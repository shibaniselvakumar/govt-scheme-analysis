from agents.eligibility_agent import EligibilityAgent
import json
from llm.local_llm import LocalLLM

# Initialize agent with your LLM instance
agent = EligibilityAgent(llm=LocalLLM())  # Replace with your LLM

# Fetch all schemes from DB
all_schemes = list(agent.collection.find({}))
precomputed_rules = {}

def extract_eligibility_rules(eligibility_text: str) -> dict:
        """
        Calls LLM to extract eligibility rules as strict JSON
        """
        if not agent.llm:
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

        raw = agent.generate_answer(prompt, max_tokens=512)
        rules = agent.safe_json_parse(raw)
        return rules

def normalize_rules(rules: dict) -> dict:
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






for scheme in all_schemes[:100]:
    scheme_id = scheme["_id"]
    eligibility_text = scheme.get("eligibility_text", "").strip()

    if eligibility_text:
        # Extract rules via LLM
        print(f"Extracting rules for scheme ID: {scheme_id}")
        rules = extract_eligibility_rules(eligibility_text[:500])
        rules = normalize_rules(rules)
        precomputed_rules[scheme_id] = rules
    else:
        precomputed_rules[scheme_id] = {}

# Save to JSON file
with open("precomputed_rules.json", "w", encoding="utf-8") as f:
    json.dump(precomputed_rules, f, ensure_ascii=False, indent=2)

print(f"Precomputed rules saved for {len(precomputed_rules)} schemes.")
