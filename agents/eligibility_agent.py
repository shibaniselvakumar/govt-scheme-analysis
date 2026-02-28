# agents/eligibility_agent.py

import os
from .ai_agents_base import AIBaseAgent
from pymongo import MongoClient
import json
import re


class EligibilityAgent(AIBaseAgent):
    """
    Agent 2: Deterministic eligibility validation + explainable matrix
    """

    def __init__(self, faiss_indexes=None, llm=None, precomputed_rules_file="precomputed_rules_new.json"):
        super().__init__(faiss_indexes or {}, llm)

        client = MongoClient("mongodb://localhost:27017/")
        self.db = client["policy_db"]
        self.collection = self.db["schemes"]

        agents_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(agents_dir)

        precomputed_path = os.path.join(project_root, precomputed_rules_file)

        try:
            with open(precomputed_path, "r", encoding="utf-8") as f:
                self.precomputed_rules = json.load(f)
                print(f"Loaded precomputed rules for {len(self.precomputed_rules)} schemes")
        except FileNotFoundError:
            print("Precomputed rules file not found. Falling back to LLM extraction.")
            self.precomputed_rules = {}

    # --------------------------------------------------
    # Main public API
    # --------------------------------------------------
    def validate_user_for_schemes(self, user_profile: dict, schemes: list):
        eligible = []
        rejected = []

        user = {
            "age": user_profile.get("age"),
            "gender": user_profile.get("gender", "").lower(),
            "state": user_profile.get("state", "").lower(),
            "occupation": user_profile.get("occupation", "").lower(),
            "monthly_income": user_profile.get("monthly_income")
        }

        scheme_ids = [s["scheme_id"] for s in schemes]
        all_schemes_data = {
            s["_id"]: s
            for s in self.collection.find({"_id": {"$in": scheme_ids}})
        }

        for scheme in schemes:
            scheme_id = scheme["scheme_id"]
            scheme_data = all_schemes_data.get(scheme_id)

            if not scheme_data:
                rejected.append({
                    "_id": scheme_id,
                    "scheme_name": scheme.get("scheme_name"),
                    "final_decision": "REJECTED",
                    "reason": "Scheme not found in DB",
                    "eligibility_matrix": {}
                })
                continue

            rules = self.precomputed_rules.get(scheme_id, {})
            if not rules:
                print(f"No rules found for {scheme_id}, skipping eligibility checks")
            matrix = self.build_eligibility_matrix(user, rules)

            failed = [
                f"{k}: {v['reason']}"
                for k, v in matrix.items()
                if v["status"] == "FAIL"
            ]

            # Print eligibility matrix for this scheme
            print(f"\n{'='*80}")
            print(f"📋 ELIGIBILITY MATRIX FOR: {scheme_data.get('scheme_name')}")
            print(f"   Scheme ID: {scheme_id}")
            print(f"{'='*80}")
            for criterion, result in matrix.items():
                status_icon = "✅" if result["status"] == "PASS" else "❌"
                print(f"{status_icon} {criterion}: {result['status']}")
                print(f"   Reason: {result['reason']}")
            print(f"{'='*80}\n")

            if not failed:
                eligible.append({
                    "_id": scheme_id,
                    "scheme_id": scheme_id,
                    "scheme_name": scheme_data.get("scheme_name"),
                    "eligibility_rules": rules,
                    "eligibility_matrix": matrix,
                    "final_decision": "ELIGIBLE"
                })
            else:
                rejected.append({
                    "_id": scheme_id,
                    "scheme_id": scheme_id,
                    "scheme_name": scheme_data.get("scheme_name"),
                    "eligibility_matrix": matrix,
                    "final_decision": "REJECTED",
                    "reason": "; ".join(failed)
                })

        return eligible, rejected

    # --------------------------------------------------
    # Eligibility matrix (single source of truth)
    # --------------------------------------------------
    def build_eligibility_matrix(self, user: dict, rules: dict):
        matrix = {}

        # -------- Age --------
        age = user.get("age")
        min_age = rules.get("min_age")
        max_age = rules.get("max_age")

        if min_age is not None or max_age is not None:
            status = "PASS"
            reason = None

            if min_age is not None and age < min_age:
                status = "FAIL"
                reason = f"Age {age} is below minimum {min_age}"

            if max_age is not None and age > max_age:
                status = "FAIL"
                reason = f"Age {age} exceeds maximum {max_age}"

            matrix["age"] = {
                "rule": {"min_age": min_age, "max_age": max_age},
                "user_value": age,
                "status": status,
                "reason": reason
            }

        # -------- Gender --------
        rule_gender = rules.get("gender")
        if rule_gender:
            user_gender = user.get("gender")
            status = "PASS"
            reason = None

            if isinstance(rule_gender, str):
                if rule_gender.lower() != "any" and user_gender != rule_gender.lower():
                    status = "FAIL"
                    reason = "Gender mismatch"

            elif isinstance(rule_gender, list):
                allowed = [g.lower() for g in rule_gender if g]
                if user_gender not in allowed:
                    status = "FAIL"
                    reason = "Gender not allowed"

            matrix["gender"] = {
                "rule": rule_gender,
                "user_value": user_gender,
                "status": status,
                "reason": reason
            }

        # -------- State --------
        rule_state = rules.get("state")
        if rule_state:
            user_state = user.get("state")

            allowed = (
                [s.lower() for s in rule_state if s]
                if isinstance(rule_state, list)
                else [rule_state.lower()]
            )

            status = "PASS" if user_state in allowed else "FAIL"

            matrix["state"] = {
                "rule": rule_state,
                "user_value": user_state,
                "status": status,
                "reason": None if status == "PASS" else "State mismatch"
            }

        # -------- Occupation --------
        rule_occ = rules.get("occupation")

        if isinstance(rule_occ, list):
            rule_occ = [o for o in rule_occ if isinstance(o, str)]

        if rule_occ:
            user_occ = user.get("occupation")

            allowed = (
                [o.lower() for o in rule_occ]
                if isinstance(rule_occ, list)
                else [rule_occ.lower()]
            )

            status = "PASS" if user_occ in allowed else "FAIL"

            matrix["occupation"] = {
                "rule": rule_occ,
                "user_value": user_occ,
                "status": status,
                "reason": None if status == "PASS" else "Occupation mismatch"
            }

        # -------- Income --------
        max_income = rules.get("max_income")
        income = user.get("monthly_income")

        if max_income is not None and income is not None:
            status = "PASS" if income <= max_income else "FAIL"

            matrix["income"] = {
                "rule": {"max_income": max_income},
                "user_value": income,
                "status": status,
                "reason": None if status == "PASS" else "Income exceeds limit"
            }

        return matrix

    # --------------------------------------------------
    # LLM utilities (unchanged)
    # --------------------------------------------------
    def safe_json_parse(self, text: str) -> dict:
        text = re.sub(r"^```.*?\n", "", text)
        text = re.sub(r"```$", "", text)
        text = re.sub(r"//.*?\n", "", text)
        text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
        text = re.sub(r",(\s*[}\]])", r"\1", text)

        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if match:
            text = match.group(0)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {}

    def extract_eligibility_rules(self, eligibility_text: str) -> dict:
        """
        Calls LLM to extract eligibility rules as strict JSON
        """
        if not self.llm:
            return {}

        prompt = f"""
You are a data extraction assistant. Your task is to extract eligibility rules from Indian government scheme text and return them as a valid JSON object.

GUIDELINES:
1. Extract eligibility conditions mentioned in the text.
2. Return JSON with ONLY the following keys if present:
   - min_age (number)
   - max_age (number)
   - gender ("Male", "Female", "Any")
   - state (string or list of strings)
   - occupation (string or list of strings)
   - max_income (number, monthly income in INR)
   - category (string)
3. Convert any human-readable descriptions into numeric or standard JSON format:
   - "more than 21 years old" → "min_age": 21
   - "up to 60 years" → "max_age": 60
   - "income below 10,000" → "max_income": 10000
   - Occupation descriptions like "small and marginal farmers" → "occupation": "farmer"
4. If a key is not mentioned in the text, omit it. Do NOT guess.
5. Output MUST be valid JSON only, no extra text, comments, or explanations.

Eligibility Text:
\"\"\"{eligibility_text}\"\"\"

Return JSON only:
"""

        raw = self.generate_answer(prompt, max_tokens=512)
        rules = self.safe_json_parse(raw)
        return rules
    
    def normalize_rules(self, rules: dict) -> dict:
        """
        Convert numeric fields from strings to numbers.
        """
        numeric_keys = ["min_age", "max_age", "max_income"]
        for k in numeric_keys:
            if k in rules and rules[k] is not None:
                try:
                    rules[k] = int(rules[k])
                except ValueError:
                    rules[k] = None  # fallback if conversion fails
        return rules
    

