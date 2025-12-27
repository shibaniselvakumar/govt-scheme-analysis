# ai_agent_base.py

# agents/ai_agents_base.py

from typing import List
import numpy as np
from llm.local_llm import LocalLLM


class AIBaseAgent:
    def __init__(self, faiss_indexes: dict, llm: LocalLLM):
        self.faiss_indexes = faiss_indexes
        self.llm = llm

    def retrieve_similar_docs(
        self,
        query_vector: np.ndarray,
        field: str,
        top_k: int = 5
    ) -> List:
        if field not in self.faiss_indexes:
            raise ValueError(f"FAISS index for '{field}' not found")

        index = self.faiss_indexes[field]["index"]
        ids = self.faiss_indexes[field]["ids"]

        query_vector = np.asarray(query_vector, dtype="float32").reshape(1, -1)

        distances, indices = index.search(query_vector, top_k)

        return [ids[i] for i in indices[0] if i < len(ids)]

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
