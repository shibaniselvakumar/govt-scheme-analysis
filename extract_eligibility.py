from agents.eligibility_agent import EligibilityAgent
import json
from llm.local_llm import LocalLLM

# Initialize agent with your LLM instance
agent = EligibilityAgent(llm=LocalLLM())  # Replace with your LLM

# Fetch all schemes from DB
all_schemes = list(agent.collection.find({}))
precomputed_rules = {}

for scheme in all_schemes[2182:2183]:
    scheme_id = scheme["_id"]
    eligibility_text = scheme.get("eligibility_text", "").strip()

    if eligibility_text:
        # Extract rules via LLM
        print(f"Extracting rules for scheme ID: {scheme_id}")
        rules = agent.extract_eligibility_rules(eligibility_text[:1000])
        rules = agent.normalize_rules(rules)
        precomputed_rules[scheme_id] = rules
    else:
        precomputed_rules[scheme_id] = {}

# Save to JSON file
with open("precomputed_rules.json", "w", encoding="utf-8") as f:
    json.dump(precomputed_rules, f, ensure_ascii=False, indent=2)

print(f"Precomputed rules saved for {len(precomputed_rules)} schemes.")
