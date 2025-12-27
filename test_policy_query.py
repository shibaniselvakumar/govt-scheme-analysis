# test_policy_query.py

import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from llm.local_llm import LocalLLM
from agents.policy_retriever_agent import PolicyRetrieverAgent

# 1️⃣ Load FAISS indexes
TEXT_FIELDS = ["description", "eligibility_text", "documents_required_text", "benefits_text"]
faiss_indexes = {}

for field in TEXT_FIELDS:
    with open(f"faiss_indexes/faiss_index_{field}.pkl", "rb") as f:
        faiss_indexes[field] = pickle.load(f)

print("✅ FAISS indexes loaded")

# 2️⃣ Load 768-d embedding model (same as index)
embedding_model = SentenceTransformer("all-mpnet-base-v2")  # 768-d model

# 3️⃣ Initialize your Local LLM
llm = LocalLLM()  # adjust path inside LocalLLM as needed

# 4️⃣ Initialize Policy Retriever Agent
agent = PolicyRetrieverAgent(faiss_indexes, llm)

# 5️⃣ Create query vector using the same 768-d embedding model
query_text = "Which policies provide health benefits for senior citizens?"
query_vector = embedding_model.encode(query_text, convert_to_numpy=True, normalize_embeddings=True)

print("Query vector shape:", query_vector.shape)  # should be (768,)

# 6️⃣ Retrieve top-k documents and generate answer
answer = agent.answer_policy_query(query_vector, top_k=3)
print("\n=== Agent Answer ===\n")
print(answer)
