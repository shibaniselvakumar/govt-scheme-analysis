import json
import os
from agents.eligibility_agent import EligibilityAgent
from llm.local_llm import LocalLLM

# -----------------------------
# Init
# -----------------------------
agent = EligibilityAgent(llm=LocalLLM())

all_schemes = list(agent.collection.find({}))

OUTPUT_FILE = "precomputed_rules_new.json"

# -----------------------------
# Load existing rules if any
# -----------------------------
if os.path.exists(OUTPUT_FILE):
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        precomputed_rules = json.load(f)
    print(f"🔁 Loaded {len(precomputed_rules)} existing rules")
else:
    precomputed_rules = {}

# -----------------------------
# LLM Extraction
# -----------------------------
def extract_eligibility_rules(eligibility_text: str) -> dict:
    """
    Extract eligibility rules using LLM.
    Output may be flat OR multi-rule.
    """
    if not agent.llm or not eligibility_text:
        return {}

    prompt = f"""
You are a data extraction assistant. Extract eligibility rules from Indian government scheme text.

RULES:
- Return VALID JSON only
- DO NOT explain
- DO NOT hallucinate
- If something is not mentioned, omit it

Allowed keys:
- min_age (number)
- max_age (number)
- gender ("Male", "Female", "Any")
- state (string or list)
- occupation (string or list)
- max_income (number, INR per month)
- category (string)

Eligibility Text:
\"\"\"{eligibility_text}\"\"\" 

Return JSON only:
"""

    raw = agent.generate_answer(prompt, max_tokens=512)
    return agent.safe_json_parse(raw)

# -----------------------------
# Normalize numeric fields
# -----------------------------
def normalize_rules(rules: dict) -> dict:
    for k in ["min_age", "max_age", "max_income"]:
        if k in rules and rules[k] is not None:
            try:
                rules[k] = int(rules[k])
            except:
                rules[k] = None
    return rules

# -----------------------------
# 🔑 COLLAPSE TO OLD SCHEMA
# -----------------------------
def collapse_to_legacy_schema(raw: dict) -> dict:
    """
    Convert new / multi-rule eligibility into
    your old flat eligibility schema.
    """

    legacy = {
        "min_age": None,
        "max_age": None,
        "gender": None,
        "state": None,
        "occupation": None,
        "max_income": None,
        "category": None
    }

    if not raw:
        return legacy

    # Case 1: multi-rule eligibility
    if "eligibility_rules" in raw:
        occupations = set()
        categories = set()
        genders = set()
        states = set()

        for rule in raw["eligibility_rules"]:
            if rule.get("occupation"):
                occupations.update(
                    rule["occupation"]
                    if isinstance(rule["occupation"], list)
                    else [rule["occupation"]]
                )

            if rule.get("category"):
                categories.add(rule["category"])

            if rule.get("gender"):
                genders.add(rule["gender"])

            if rule.get("state"):
                states.update(
                    rule["state"]
                    if isinstance(rule["state"], list)
                    else [rule["state"]]
                )

        legacy["occupation"] = list(occupations) or None
        legacy["category"] = list(categories)[0] if categories else None
        legacy["state"] = list(states) or None

        if genders:
            legacy["gender"] = (
                list(genders) if len(genders) > 1 else genders.pop()
            )

        return legacy

    # Case 2: already flat
    for k in legacy:
        if k in raw:
            legacy[k] = raw[k]

    return legacy

# -----------------------------
# Main Loop with incremental save
# -----------------------------
SAVE_EVERY = 10
processed = 0

for scheme in all_schemes:
    scheme_id = scheme["_id"]

    # Skip already processed schemes
    if scheme_id in precomputed_rules:
        continue

    eligibility_text = scheme.get("eligibility_text", "").strip()
    print(f"Extracting rules for scheme ID: {scheme_id}")

    if not eligibility_text:
        precomputed_rules[scheme_id] = {}
    else:
        raw_rules = extract_eligibility_rules(eligibility_text[:600])
        raw_rules = normalize_rules(raw_rules)
        final_rules = collapse_to_legacy_schema(raw_rules)
        precomputed_rules[scheme_id] = final_rules

    processed += 1

    # Save checkpoint every 10 processed schemes
    if processed % SAVE_EVERY == 0:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(precomputed_rules, f, ensure_ascii=False, indent=2)
        print(f"💾 Saved checkpoint at {len(precomputed_rules)} schemes")

# -----------------------------
# Final save
# -----------------------------
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(precomputed_rules, f, ensure_ascii=False, indent=2)

print(f"✅ Precomputed rules saved for {len(precomputed_rules)} schemes.")
