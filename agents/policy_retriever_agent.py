# agents/policy_retriever_agent.py

from .ai_agents_base import AIBaseAgent
from pymongo import MongoClient
import numpy as np


class PolicyRetrieverAgent(AIBaseAgent):
    def __init__(self, faiss_indexes, llm):
        super().__init__(faiss_indexes, llm)

        self.policy_fields = [
            "description",
            "eligibility_text",
        ]

        # MongoDB connection
        client = MongoClient("mongodb://localhost:27017/")
        self.db = client["policy_db"]
        self.collection = self.db["schemes"]

    def answer_policy_query(self, query_vector: np.ndarray, top_k: int = 3) -> str:
        context_chunks = []

        for field in self.policy_fields:
            doc_ids = self.retrieve_similar_docs(query_vector, field, top_k)

            for doc_id in doc_ids:
                scheme = self.collection.find_one({"_id": doc_id})

                if scheme and field in scheme:
                    context_chunks.append(
                        f"{field.upper()}:\n{scheme[field]}"
                    )

        if not context_chunks:
            return "No relevant policy information found."

        context = "\n\n".join(context_chunks)

        prompt = f"""
You are a government policy assistant.

Answer the user's question strictly using the information below.
Be accurate, concise, and factual.

POLICY INFORMATION:
{context}

Answer:
"""

        return self.generate_answer(prompt)
