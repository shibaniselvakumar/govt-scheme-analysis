# app.py

import pickle
import time
import json
import sys

from llm.local_llm import LocalLLM
from agents.policy_retriever_agent import PolicyRetrieverAgent
from agents.eligibility_agent import EligibilityAgent
from agents.document_validation_agent import DocumentValidationAgent
from agents.pathway_generation_agent import PathwayGenerationAgent   # ✅ NEW
from user_interaction import get_user_profile
from pymongo import MongoClient


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
# Step 1: Initialize DB, LLM & Agents
# -------------------------
start = time.time()

client = MongoClient("mongodb://localhost:27017/")
db = client["policy_db"]
schemes_collection = db["schemes"]

llm = LocalLLM()

policy_agent = PolicyRetrieverAgent(faiss_indexes, llm)
elig_agent = EligibilityAgent(faiss_indexes, llm)
doc_agent = DocumentValidationAgent(llm)

# ✅ NEW AGENT
pathway_agent = PathwayGenerationAgent(llm=llm)

print("✅ Agents initialized in", round(time.time() - start, 2), "sec")


# -------------------------
# Step 2: Get user profile
# -------------------------
user_profile = get_user_profile()


# -------------------------
# Step 3: User query & policy retrieval
# -------------------------
query = "Policies for fishermen"

start = time.time()
query_vector = llm.get_embedding(query)
print("⏱️ Embedding time:", round(time.time() - start, 2), "sec")

start = time.time()
top_k = 3 if FAST_MODE else FAISS_TOP_K

retrieved_schemes = policy_agent.retrieve_policies(
    query=query,
    user_profile=user_profile,
    top_k=top_k
)

print("⏱️ Policy retrieval time:", round(time.time() - start, 2), "sec")

print("\n✅ Top schemes retrieved:")
for i, s in enumerate(retrieved_schemes, 1):
    print(f"{i}. {s['scheme_name']}")


# -------------------------
# Step 4: Eligibility Checking
# -------------------------
start = time.time()

eligible_schemes, rejected_schemes = elig_agent.validate_user_for_schemes(
    user_profile,
    retrieved_schemes
)

print("⏱️ Eligibility checking time:", round(time.time() - start, 2), "sec")

print("\n✅ Eligible schemes:")
if eligible_schemes:
    for i, s in enumerate(eligible_schemes, 1):
        print(f"{i}. {s['scheme_name']}")
else:
    print("No eligible schemes found.")

print("\n❌ Rejected schemes:")
if rejected_schemes:
    for i, s in enumerate(rejected_schemes, 1):
        print(f"{i}. {s['scheme_name']} - {s.get('reason')}")
else:
    print("No rejected schemes.")


# -------------------------
# Step 5: User selects scheme
# -------------------------
if not eligible_schemes:
    print("\n🚫 No eligible schemes to apply for.")
    sys.exit(0)

print("\n📌 Select a scheme to apply for:")
for i, s in enumerate(eligible_schemes, 1):
    print(f"{i}. {s['scheme_name']}")

choice = int(input("Enter scheme number: ").strip())
selected_scheme = eligible_schemes[choice - 1]
scheme_id = selected_scheme["_id"]

print(f"\n📝 Applying for: {selected_scheme['scheme_name']}")


# -------------------------
# Step 6: Fetch scheme from DB
# -------------------------
scheme = schemes_collection.find_one({"_id": scheme_id})
raw_documents_text = scheme.get("documents_required_text", "")


# -------------------------
# Step 7: Document requirement extraction
# -------------------------
required_docs = doc_agent.get_required_documents(
    scheme_id=scheme_id,
    raw_documents_text=raw_documents_text
)

print("\n📄 Documents required:")
if not required_docs:
    print("No documents specified.")
else:
    for doc, rule in required_docs.items():
        tag = "(Mandatory)" if rule.get("mandatory", True) else "(Optional)"
        print(f"- {doc} {tag}")


# -------------------------
# Step 8: Incremental document upload
# -------------------------
print("\n⬆️ Upload documents one by one:")

for doc_type in required_docs.keys():
    value = input(f"Enter value for {doc_type} (leave empty to skip): ").strip()

    if not value:
        continue

    result = doc_agent.validate_single_document(
        scheme_id=scheme_id,
        document_type=doc_type,
        document_payload={"value": value}
    )

    print(f"→ {doc_type}: {result['status']}")
    if result["reason"]:
        print(f"   Reason: {result['reason']}")


# -------------------------
# Step 9: Document validation status
# -------------------------
doc_validation_status = doc_agent.get_document_validation_status(scheme_id)

print("\n📊 Document Validation Status:")
print(json.dumps(doc_validation_status, indent=2))


# -------------------------
# 🆕 Step 10: Pathway Generation Agent
# -------------------------
print("\n🧭 Generating application guidance...\n")
start = time.time()

pathway = pathway_agent.generate_pathway(
    eligibility_output=selected_scheme,
    document_status=doc_validation_status
)

print("===== APPLICATION PATHWAY =====")
print(json.dumps(pathway, indent=2, ensure_ascii=False))
print("⏱️ Guidance time:", round(time.time() - start, 2), "sec")


# -------------------------
# Step 11: Final output JSON
# -------------------------
final_output = {
    "user_profile": user_profile,
    "query": query,
    "top_schemes": retrieved_schemes,
    "eligible_schemes": eligible_schemes,
    "rejected_schemes": rejected_schemes,
    "selected_scheme": {
        "scheme_id": scheme_id,
        "scheme_name": selected_scheme["scheme_name"]
    },
    "document_validation": doc_validation_status,
    "application_pathway": pathway   # ✅ INCLUDED
}

print("\n=== FINAL OUTPUT (JSON) ===\n")
print(json.dumps(final_output, indent=2, ensure_ascii=False))
