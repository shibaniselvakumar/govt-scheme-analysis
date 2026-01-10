# test_policy_agent.py

import numpy as np
from agents.policy_retriever_agent import PolicyRetrieverAgent
from llm.local_llm import LocalLLM  # your local GPT4All wrapper
import pickle

# 1️⃣ Load FAISS indexes
with open("faiss_indexes/faiss_index_description.pkl", "rb") as f:
    description_index_data = pickle.load(f)

with open("faiss_indexes/faiss_index_eligibility_text.pkl", "rb") as f:
    eligibility_index_data = pickle.load(f)

with open("faiss_indexes/faiss_index_documents_required_text.pkl", "rb") as f:
    documents_index_data = pickle.load(f)

with open("faiss_indexes/faiss_index_benefits_text.pkl", "rb") as f:
    benefits_index_data = pickle.load(f)

faiss_indexes = {
    "description": description_index_data,
    "eligibility_text": eligibility_index_data,
    "documents_required_text": documents_index_data,
    "benefits_text": benefits_index_data,
}

# 2️⃣ Initialize your Local LLM
llm = LocalLLM()

# 3️⃣ Initialize the Policy Retriever Agent
agent = PolicyRetrieverAgent(faiss_indexes, llm)

# 4️⃣ Sample query vector (replace with real embedding)
# Example: random vector of same dimension as your embeddings
query_vector = np.random.rand(512).astype("float32")

# 5️⃣ Ask the agent a policy question
answer = agent.answer_policy_query(query_vector, top_k=3)
print("\n=== Policy Answer ===")
print(answer)
