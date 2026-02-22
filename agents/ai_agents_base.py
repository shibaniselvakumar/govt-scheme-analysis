# ai_agent_base.py

# agents/ai_agents_base.py

from turtle import distance
from typing import List
import numpy as np
from llm.local_llm import LocalLLM


class AIBaseAgent:
    def __init__(self, faiss_indexes: dict, llm: LocalLLM):
        self.faiss_indexes = faiss_indexes
        self.llm = llm

    def retrieve_similar_docs_with_scores(
    self,
    query_vector: np.ndarray,
    field: str,
    top_k: int = 5,
    oversample_factor: int = 10,
) -> tuple[list, list]:

        if field not in self.faiss_indexes:
            raise ValueError(f"FAISS index for '{field}' not found")

        index = self.faiss_indexes[field]["index"]
        ids = self.faiss_indexes[field]["ids"]

        query_vector = np.asarray(query_vector, dtype="float32").reshape(1, -1)
        
        
        # 🔍 Oversample because we may filter later
        search_k = top_k *50

        distances, indices = index.search(query_vector, search_k)

        distances, indices = index.search(query_vector, search_k)

        print("Raw FAISS indices (top 20):", indices[0][:20])

        mapped_ids = []
        for i in indices[0][:20]:
            if i != -1 and i < len(ids):
                mapped_ids.append(ids[i])

        print("Mapped scheme IDs (top 20):", mapped_ids)

    
       

        doc_ids = []
        scores = []

        for rank, i in enumerate(indices[0]):
            if i == -1:
                continue
            if i >= len(ids):
                continue

            doc_ids.append(ids[i])

            # Convert FAISS distance → similarity
            # If using cosine (normalized vectors) distance ≈ 1 - similarity
            distance = float(distances[0][rank])

# Convert L2 distance → bounded similarity (0–1)
            similarity_score = 1 / (1 + distance)
            scores.append(similarity_score)

            if len(doc_ids) == top_k:
                break

        return doc_ids, scores

    def generate_answer(self, prompt: str, max_tokens: int = 512) -> str:
        return self.llm.generate(prompt, max_tokens=max_tokens)


    def generate_answer(self, prompt: str, max_tokens: int = 512) -> str:
        """
        Generate a response from the LLM given a prompt.
        """
        return self.llm.generate(prompt, max_tokens=max_tokens)

    def answer_query(self, query_vector: np.ndarray, field: str, top_k: int = 5) -> str:
        """
        Complete retrieval + generation pipeline:
        1. Retrieve top_k documents using FAISS.
        2. Construct prompt and query LLM.
        """
        doc_ids = self.retrieve_similar_docs(query_vector, field, top_k)
        # For demonstration, simply join IDs as context. You can replace with full text from DB
        context = f"Relevant document IDs: {doc_ids}\n"
        prompt = f"{context}Answer the user's query based on these documents."
        return self.generate_answer(prompt)
