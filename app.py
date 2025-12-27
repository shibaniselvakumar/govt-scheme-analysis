# app.py

import pickle
from llm.local_llm import LocalLLM
from agents.policy_retriever_agent import PolicyRetrieverAgent

FIELDS = [
    "description",
    "eligibility_text",
    "documents_required_text",
    "benefits_text",
]

faiss_indexes = {}

for field in FIELDS:
    with open(f"faiss_indexes/faiss_index_{field}.pkl", "rb") as f:
        faiss_indexes[field] = pickle.load(f)

print("✅ FAISS indexes loaded")

llm = LocalLLM()
agent = PolicyRetrieverAgent(faiss_indexes, llm)

query = "What are the eligibility criteria for health insurance schemes?"

query_vector = llm.get_embedding(query)

answer = agent.answer_policy_query(query_vector, top_k=3)

print("\n=== FINAL ANSWER ===\n")
print(answer)
