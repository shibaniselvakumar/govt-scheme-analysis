from .ai_agents_base import AIBaseAgent
from pymongo import MongoClient
import numpy as np
import json
import re

class PolicyRetrieverAgent(AIBaseAgent):
    def __init__(self, faiss_indexes, llm, max_context_chars: int = 500):
        super().__init__(faiss_indexes, llm)

        self.policy_fields = [
            "description",
            "eligibility_text",
            "documents_required_text",
            "benefits_text",
        ]

        client = MongoClient("mongodb://localhost:27017/")
        self.db = client["policy_db"]
        self.collection = self.db["schemes"]

        self.max_context_chars = max_context_chars

    # ---------------------------
    # Main method
    # ---------------------------
    def retrieve_policies(
        self,
        query: str,
        user_profile: dict,
        top_k: int = 5,
        system_trace: dict | None = None
    ) -> list[dict]:

        if system_trace is None:
            system_trace = []

        # 2️⃣ Semantic query construction
        profile_text = f"""
        Occupation: {user_profile.get("occupation")}
        State: {user_profile.get("state")}
        Gender: {user_profile.get("gender")}
        Income: {user_profile.get("monthly_income")}
        """
        full_query = f"{query}. {profile_text}"

        system_trace.append({
            "step": 2,
            "event": "SEMANTIC_QUERY_CONSTRUCTED",
            "node": "POLICY_RETRIEVER",
            "details": {
                "fields_used": ["occupation", "state", "gender", "income"]
            }
        })

        # 3️⃣ Embedding
        query_vector = self.llm.get_embedding(full_query)

        system_trace.append({
            "step": 3,
            "event": "QUERY_EMBEDDED",
            "node": "VECTOR_ENCODER",
            "details": {
                "embedding_type": "semantic_vector"
            }
        })

        # 4️⃣ DB pre-filter
        db_filter = {}
        if "state" in user_profile:
            db_filter["state"] = user_profile["state"]

        candidate_ids = [
            s["_id"]
            for s in self.collection
                .find(db_filter if db_filter else {}, {"_id": 1})
                .limit(100)
        ]

        system_trace.append({
            "step": 4,
            "event": "CANDIDATE_SPACE_REDUCED",
            "node": "MONGODB",
            "details": {
                "candidates_considered": len(candidate_ids)
            }
        })

        # 5️⃣ FAISS retrieval
        doc_ids = self.retrieve_similar_docs(query_vector, "description")

        system_trace.append({
            "step": 5,
            "event": "FAISS_SIMILARITY_SEARCH",
            "node": "FAISS_INDEX",
            "details": {
                "raw_matches": len(doc_ids)
            }
        })

        if candidate_ids:
            doc_ids = [d for d in doc_ids if d in candidate_ids]

        system_trace.append({
            "step": 6,
            "event": "SEMANTIC_CONTEXT_INTERSECTION",
            "node": "POLICY_RETRIEVER",
            "details": {
                "final_matches": len(doc_ids)
            }
        })

        # 6️⃣ Materialize results
        results = []
        for doc_id in doc_ids:
            scheme = self.collection.find_one({"_id": doc_id})
            if not scheme:
                continue

            results.append({
                "scheme_id": str(scheme["_id"]),
                "scheme_name": scheme.get("scheme_name"),
            })

        system_trace.append({
            "step": 7,
            "event": "SCHEMES_MATERIALIZED",
            "node": "POLICY_RETRIEVER",
            "details": {
                "returned": len(results)
            }
        })

        return results
