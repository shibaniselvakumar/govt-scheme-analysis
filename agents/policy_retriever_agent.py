# agents/policy_retriever_agent.py

from .ai_agents_base import AIBaseAgent
from pymongo import MongoClient
import numpy as np
import json
import re

class PolicyRetrieverAgent(AIBaseAgent):
    def __init__(self, faiss_indexes, llm, max_context_chars: int = 500):
        super().__init__(faiss_indexes, llm)

        # Fields to retrieve and embed
        self.policy_fields = [
            "description",
            "eligibility_text",
            "documents_required_text",
            "benefits_text",
        ]

        # MongoDB setup
        client = MongoClient("mongodb://localhost:27017/")
        self.db = client["policy_db"]
        self.collection = self.db["schemes"]

        self.max_context_chars = max_context_chars

    # ---------------------------
    # JSON cleaning utils
    # ---------------------------
    def clean_json_text(self, text: str) -> str:
        text = re.sub(r"^```.*?\n", "", text)
        text = re.sub(r"```$", "", text)
        text = re.sub(r"//.*?\n", "", text)
        text = re.sub(r",(\s*[}\]])", r"\1", text)
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if match:
            text = match.group(0)
        return text.strip()

    def robust_json_parse(self, text: str) -> dict:
        cleaned = self.clean_json_text(text)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"error": "LLM produced incomplete JSON", "raw_output": text}

    # ---------------------------
    # Main method
    # ---------------------------
    def retrieve_policies(
    self,
    query: str,
    user_profile: dict,
    top_k: int = 5
) -> list[dict]:

        # 1. Build semantic query
        profile_text = f"""
        Occupation: {user_profile.get("occupation")}
        State: {user_profile.get("state")}
        Gender: {user_profile.get("gender")}
        Income: {user_profile.get("monthly_income")}
        """
        full_query = f"{query}. {profile_text}"

        # 2. Embed
        query_vector = self.llm.get_embedding(full_query)

        # 3. Optional DB pre-filter
        db_filter = {}
        if "state" in user_profile:
            db_filter["state"] = user_profile["state"]

        candidate_ids = [
            s["_id"]
            for s in self.collection
                .find(db_filter if db_filter else {}, {"_id": 1})
                .limit(100)
        ]


        # 4. FAISS retrieval
        doc_ids = self.retrieve_similar_docs(query_vector, "description", top_k)

        if candidate_ids:
            doc_ids = [d for d in doc_ids if d in candidate_ids]

        # 5. Return clean structured output
        results = []
        for doc_id in doc_ids:
            scheme = self.collection.find_one({"_id": doc_id})
            if not scheme:
                continue

            results.append({
                "scheme_id": str(scheme["_id"]),
                "scheme_name": scheme.get("scheme_name"),
            })

        return results
