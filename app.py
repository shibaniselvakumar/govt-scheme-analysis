# app.py

import pickle
import time
import json
from llm.local_llm import LocalLLM
from agents.policy_retriever_agent import PolicyRetrieverAgent
from agents.eligibility_agent import EligibilityAgent
from user_interaction import get_user_profile

# -------------------------
# Config
# -------------------------
FIELDS = [
    "description",
    "eligibility_text",
    "documents_required_text",
    "benefits_text",
]

FAISS_TOP_K = 3
FAST_MODE = True

# -------------------------
# Step 0: Load FAISS indexes
# -------------------------
faiss_indexes = {}
start = time.time()
for field in FIELDS:
    with open(f"faiss_indexes/faiss_index_{field}.pkl", "rb") as f:
        faiss_indexes[field] = pickle.load(f)
print("✅ FAISS indexes loaded in", round(time.time() - start, 2), "sec")

# -------------------------
# Step 1: Initialize LLM & PolicyRetrieverAgent
# -------------------------
start = time.time()
llm = LocalLLM()
policy_agent = PolicyRetrieverAgent(faiss_indexes, llm)
print("✅ LLM and PolicyRetrieverAgent initialized in", round(time.time() - start, 2), "sec")

# -------------------------
# Step 2: Get user profile
# -------------------------
user_profile = get_user_profile()

# -------------------------
# Step 3: User query for policy/schemes
# -------------------------

# query = input("Enter your query (e.g., 'Policies for widow'): ").strip()
query = "Policies for widow"
# Step 3a: Embed query
start = time.time()
query_vector = llm.get_embedding(query)
print("⏱️ Embedding time:", round(time.time() - start, 2), "sec")

# Step 3b: Retrieve top N relevant schemes
start = time.time()
top_k = 3 if FAST_MODE else FAISS_TOP_K
retrieved_schemes = policy_agent.retrieve_policies(
    query=query,
    user_profile=user_profile,
    top_k=top_k
)

print("⏱️ Policy retrieval time:", round(time.time() - start, 2), "sec")
start = time.time()
# Make sure retrieved_schemes is a list of dicts
# Each dict should contain: _id, scheme_name, description, benefits (if needed)
print("\n✅ Top schemes retrieved:")
for i, s in enumerate(retrieved_schemes, 1):
    print(f"{i}. {s['scheme_name']}")

# -------------------------
# Step 4: Eligibility Checking
# -------------------------
elig_agent = EligibilityAgent(faiss_indexes, llm)
eligible_schemes, rejected_schemes = elig_agent.validate_user_for_schemes(user_profile, retrieved_schemes)

print("⏱️ Eligibility Checking time:", round(time.time() - start, 2), "sec")

print("\n✅ Eligible schemes for the user:")
if eligible_schemes:
    for i, s in enumerate(eligible_schemes, start=1):
        print(f"{i}. {s['scheme_name']}")
        if s.get("eligibility_rules_used"):
            print(f"   Rules Used: {json.dumps(s['eligibility_rules_used'], indent=2)}")
else:
    print("No eligible schemes found.")

# --------------------------
# Print Rejected Schemes
# --------------------------
print("\n❌ Rejected schemes:")
if rejected_schemes:
    for i, s in enumerate(rejected_schemes, start=1):
        reason = s.get("reason", "Did not meet eligibility")
        print(f"{i}. {s['scheme_name']} - Reason: {reason}")
        if s.get("eligibility_rules_used"):
            print(f"   Rules Used: {json.dumps(s['eligibility_rules_used'], indent=2)}")
else:
    print("No rejected schemes.")

# -------------------------
# Step 5: Placeholder for document upload/validation
# -------------------------
# Example usage (dict internally):
# user_docs = {
#     "ID Proof": "path/to/id.pdf",
#     "Income Certificate": "path/to/income.pdf"
# }
# scheme_id = eligible_schemes[0]["_id"]
# doc_validation = elig_agent.validate_uploaded_docs(user_docs, scheme_id)
# print("\nDocument validation status:", doc_validation)

# -------------------------
# Step 6: Convert final output to JSON for display
# -------------------------

final_output = {
    "user_profile": user_profile,
    "top_schemes": retrieved_schemes,
    "eligible_schemes": eligible_schemes,
    "rejected_schemes": rejected_schemes,
    # "document_validation": doc_validation  # add when implemented
}

print("\n=== FINAL OUTPUT (JSON) ===\n")
print(json.dumps(final_output, indent=2, ensure_ascii=False))
