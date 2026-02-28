from .ai_agents_base import AIBaseAgent
from pymongo import MongoClient
import numpy as np
import json
import re
import time
from datetime import datetime

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

    def _trace(self, system_trace, step, event, node, details, start_time=None):
        entry = {
            "step": step,
            "event": event,
            "node": node,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "details": details
        }

        if start_time:
            entry["latency_ms"] = round((time.time() - start_time) * 1000, 2)

        system_trace.append(entry)

    # ---------------------------
    # Main method
    # ---------------------------
    def retrieve_policies(
    self,
    query: str,
    user_profile: dict,
    top_k: int = 25,
    system_trace: list | None = None
) -> list[dict]:

        if system_trace is None:
            system_trace = []

        overall_start = time.time()

        # -------------------------
        # STEP 2 — Semantic Query
        # -------------------------
        step_start = time.time()

        profile_text = f"""
        Occupation: {user_profile.get("occupation")}
        State: {user_profile.get("state")}
        Gender: {user_profile.get("gender")}
        Income: {user_profile.get("monthly_income")}
        """

        full_query = f"{query}. {profile_text}"

        self._trace(system_trace, 2,
            "SEMANTIC_QUERY_CONSTRUCTED",
            "POLICY_RETRIEVER",
            {
                "fields_used": ["occupation", "state", "gender", "income"],
                "constructed_query_preview": full_query[:200]
            },
            step_start
        )

        # Embedding
        step_start = time.time()
        query_vector = self.llm.get_embedding(full_query)

        self._trace(system_trace, 3,
            "QUERY_EMBEDDED",
            "VECTOR_ENCODER",
            {
                "embedding_type": "semantic_vector",
                "embedding_dimension": len(query_vector)
            },
            step_start
        )
        step_start = time.time()

        state = user_profile.get("state")
        candidate_ids = []
        db_filter = {}

        if state:
            db_filter = {
                "$or": [
                    {"state": {"$regex": f"^{state}$", "$options": "i"}},
                    {"states": {"$regex": f"^{state}$", "$options": "i"}},
                    {"states": {"$elemMatch": {"$regex": f"^{state}$", "$options": "i"}}},
                    {"state": None},          
                    {"states": None}
                ]
            }

            cursor = self.collection.find(db_filter, {"_id": 1}).limit(300)
            candidate_ids = [doc["_id"] for doc in cursor]


        if not candidate_ids:
            fallback_cursor = self.collection.find({}, {"_id": 1}).limit(300)
            candidate_ids = [doc["_id"] for doc in fallback_cursor]
            fallback_used = True
        else:
            fallback_used = False


        self._trace(system_trace, 4,
            "CANDIDATE_SPACE_REDUCED",
            "MONGODB",
            {
                "db_filter_applied": db_filter if state else "none",
                "candidates_considered": len(candidate_ids),
                "fallback_to_full_corpus": fallback_used,
                "sample_candidate_ids": [str(cid) for cid in candidate_ids[:5]]
            },
            step_start
        )

        # -------------------------
        # STEP 5 — FAISS Retrieval
        # -------------------------
        step_start = time.time()
        print(type(self.faiss_indexes["description"]["index"]))

        # Modify this method to return (ids, scores)
        doc_ids, scores = self.retrieve_similar_docs_with_scores(
            query_vector,
            "description",
            top_k
        )

        raw_matches = [
            {
                "scheme_id": str(doc_ids[i]),
                "similarity_score": float(scores[i])
            }
            for i in range(len(doc_ids))
        ]

        self._trace(system_trace, 5,
            "FAISS_SIMILARITY_SEARCH",
            "FAISS_INDEX",
            {
                "similarity_metric": "cosine",
                "top_k": top_k,
                "raw_match_count": len(doc_ids),
                "matches": raw_matches
            },
            step_start
        )

        # -------------------------
        # STEP 6 — Return all FAISS results (semantic relevance only)
        # -------------------------
        step_start = time.time()

        # Return all FAISS results without state filtering
        # State filtering will be applied in eligibility validation
        final_doc_ids = doc_ids
        final_scores = scores

        self._trace(system_trace, 6,
            "FAISS_RESULTS_ACCEPTED",
            "POLICY_RETRIEVER",
            {
                "final_match_count": len(final_doc_ids),
                "note": "All FAISS matches returned - state filtering applied in eligibility"
            },
            step_start
        )

        # -------------------------
        # STEP 7 — Materialization
        # -------------------------
        step_start = time.time()

        results = []

        for i, doc_id in enumerate(final_doc_ids):
            scheme = self.collection.find_one({"_id": doc_id})
            if not scheme:
                continue

            results.append({
                "scheme_id": str(scheme["_id"]),
                "scheme_name": scheme.get("scheme_name"),
                "similarity_score": float(final_scores[i]),
                "rank": i + 1
            })

        self._trace(system_trace, 7,
            "SCHEMES_MATERIALIZED",
            "POLICY_RETRIEVER",
            {
                "returned": len(results),
                "ranked_results": results
            },
            step_start
        )

        total_latency = round((time.time() - overall_start) * 1000, 2)

        system_trace.append({
            "step": 8,
            "event": "RETRIEVAL_PIPELINE_COMPLETED",
            "node": "POLICY_RETRIEVER",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "latency_ms": total_latency,
            "details": {
                "total_latency_ms": total_latency
            }
        })

        return results
