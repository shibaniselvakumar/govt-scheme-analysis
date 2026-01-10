# agents/eligibility_agent.py

from .ai_agents_base import AIBaseAgent
from pymongo import MongoClient
import json
import re

class EligibilityAgent(AIBaseAgent):
    """
    Agent 2: Semantic eligibility extraction + strict rule checking
    """

    def __init__(self, faiss_indexes=None, llm=None):
        super().__init__(faiss_indexes or {}, llm)

        client = MongoClient("mongodb://localhost:27017/")
        self.db = client["policy_db"]
        self.collection = self.db["schemes"]

    # -------------------------------
    # LLM: Extract eligibility rules
    # -------------------------------
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

    # -------------------------------
    # Check user against rules
    # -------------------------------
    def check_user_against_rules(self, user: dict, rules: dict):
        """
        Returns:
            is_eligible (bool)
            reasons (list of strings)
        """
        reasons = []

        # Age
        age = user.get("age")
        if age is not None:
            min_age = rules.get("min_age")
            max_age = rules.get("max_age")
            if min_age is not None and age < min_age:
                reasons.append(f"User age {age} < min_age {min_age}")
            if max_age is not None and age > max_age:
                reasons.append(f"User age {age} > max_age {max_age}")

        # Gender
        if rules.get("gender"):
            user_gender = user.get("gender", "").lower()
            rule_gender = rules["gender"]

            # If "Any", allow all
            if isinstance(rule_gender, str) and rule_gender.lower() == "any":
                pass  # automatically eligible
            else:
                # Handle list or string
                if isinstance(rule_gender, list):
                    rule_gender = [g.lower() for g in rule_gender]
                    if user_gender not in rule_gender:
                        reasons.append(f"User gender '{user_gender}' not in allowed genders {rule_gender}")
                else:
                    if user_gender != rule_gender.lower():
                        reasons.append(f"User gender '{user_gender}' does not match required '{rule_gender}'")

        # State
        if rules.get("state"):
            user_state = user.get("state", "").lower()
            rule_state = rules["state"]
            if isinstance(rule_state, list):
                rule_state = [s.lower() for s in rule_state]
                if user_state not in rule_state:
                    reasons.append(f"User state '{user_state}' not in allowed states {rule_state}")
            else:
                if user_state != rule_state.lower():
                    reasons.append(f"User state '{user_state}' does not match required '{rule_state}'")

        # Occupation
        if rules.get("occupation"):
            user_occ = user.get("occupation", "").lower()
            rule_occ = rules["occupation"]
            if isinstance(rule_occ, list):
                rule_occ = [o.lower() if isinstance(o, str) else o.get("type","").lower() for o in rule_occ]
                if user_occ not in rule_occ:
                    reasons.append(f"User occupation '{user_occ}' not in allowed occupations {rule_occ}")
            else:
                if user_occ != rule_occ.lower():
                    reasons.append(f"User occupation '{user_occ}' does not match required '{rule_occ}'")

        # Income
        income = user.get("monthly_income")
        max_income = rules.get("max_income")
        if income is not None and max_income is not None:
            if income > max_income:
                reasons.append(f"User income {income} > max_income {max_income}")

        return len(reasons) == 0, reasons


    # -------------------------------
    # Main method: eligible + rejected
    # -------------------------------
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

    def validate_user_for_schemes(self, user_profile: dict, schemes: list):
        eligible = []
        rejected = []

        for scheme in schemes:
            scheme_id = scheme.get("scheme_id")
            scheme_data = self.collection.find_one({"_id": scheme_id})
            if not scheme_data:
                rejected.append({"_id": scheme_id, "scheme_name": scheme.get("scheme_name"), "reason": "Scheme not found in DB"})
                continue

            eligibility_text = scheme_data.get("eligibility_text", "")
            if not eligibility_text.strip():
                rejected.append({"_id": scheme_id, "scheme_name": scheme_data.get("scheme_name"), "reason": "No eligibility text available"})
                continue

            # 1️⃣ Extract rules
            rules = self.extract_eligibility_rules(eligibility_text[:500])
            rules = self.normalize_rules(rules)

            # 2️⃣ Check rules
            is_eligible, reasons = self.check_user_against_rules(user_profile, rules)
            if is_eligible:
                eligible.append({
                    "_id": scheme_id,
                    "scheme_name": scheme_data.get("scheme_name"),
                    "eligibility_rules_used": rules
                })
            else:
                rejected.append({
                    "_id": scheme_id,
                    "scheme_name": scheme_data.get("scheme_name"),
                    "eligibility_rules_used": rules,
                    "reason": "; ".join(reasons)
                })

        return eligible, rejected


    # -------------------------------
    # Document validation (optional)
    # -------------------------------
    # def validate_uploaded_docs(self, user_docs: dict, scheme_id: str) -> list:
    #     scheme_data = self.collection.find_one({"_id": scheme_id})
    #     required_docs = scheme_data.get("documents_required_text", "").split("\n")

    #     results = []
    #     for doc in required_docs:
    #         doc = doc.strip()
    #         if not doc:
    #             continue

    #         if doc not in user_docs:
    #             results.append({"name": doc, "status": "missing"})
    #         else:
    #             results.append({"name": doc, "status": "valid"})

    #     return results

    # -------------------------------
    # Safe JSON parser
    # -------------------------------
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
