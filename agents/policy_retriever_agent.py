from .ai_agents_base import AIBaseAgent
from pymongo import MongoClient
import numpy as np
import json
import re
import time
from datetime import datetime
from collections import defaultdict

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

        self.field_weights = {
            "description": 0.45,
            "eligibility_text": 0.35,
            "benefits_text": 0.15,
            "documents_required_text": 0.05,
        }

    def _normalize_text(self, value):
        if value is None:
            return ""
        if isinstance(value, list):
            return " ".join([str(v) for v in value if v is not None]).lower()
        return str(value).lower()

    def _tokenize(self, text: str):
        return set(re.findall(r"[a-z0-9]+", (text or "").lower()))

    def _occupation_aliases(self, occupation: str) -> set[str]:
        occ = (occupation or "").strip().lower()
        if not occ:
            return set()

        alias_map = {
            "fisherman": {"fisherman", "fishermen", "fisher", "fisherfolk", "fishing"},
            "farmer": {"farmer", "farmers", "agriculture", "agricultural", "cultivator"},
            "student": {"student", "students", "learner", "education"},
            "worker": {"worker", "labour", "labor", "employee", "unorganized"},
            "artisan": {"artisan", "craft", "handicraft", "weaver"},
        }

        tokens = self._tokenize(occ)
        aliases = set(tokens)
        aliases.add(occ)

        for canonical, expanded in alias_map.items():
            if occ == canonical or canonical in tokens or len(tokens & expanded) > 0:
                aliases |= expanded

        return aliases

    def _state_match(self, scheme: dict, user_state: str) -> bool:
        if not user_state:
            return False

        user_state = user_state.strip().lower()
        if not user_state:
            return False

        state_values = []
        for field in ["state", "states"]:
            value = scheme.get(field)
            if value is None:
                continue
            if isinstance(value, list):
                state_values.extend([str(v).strip().lower() for v in value if v])
            else:
                state_values.append(str(value).strip().lower())

        if not state_values:
            return False

        return user_state in state_values

    def _occupation_match(self, scheme: dict, user_occupation: str) -> bool:
        if not user_occupation:
            return False

        user_occupation = user_occupation.strip().lower()
        if not user_occupation:
            return False
        user_aliases = self._occupation_aliases(user_occupation)

        occ_values = []
        value = scheme.get("occupation")
        if value is not None:
            if isinstance(value, list):
                occ_values.extend([str(v).strip().lower() for v in value if v])
            else:
                occ_values.append(str(value).strip().lower())

        if not occ_values:
            return False

        for occ in occ_values:
            occ_tokens = self._tokenize(occ)
            if occ in user_aliases or len(occ_tokens & user_aliases) > 0:
                return True

        return False

    def _build_text_blob(self, scheme: dict) -> str:
        parts = [
            self._normalize_text(scheme.get("scheme_name")),
            self._normalize_text(scheme.get("description")),
            self._normalize_text(scheme.get("eligibility_text")),
            self._normalize_text(scheme.get("benefits_text")),
            self._normalize_text(scheme.get("occupation")),
            self._normalize_text(scheme.get("state")),
            self._normalize_text(scheme.get("states")),
            self._normalize_text(scheme.get("category")),
            self._normalize_text(scheme.get("ministry")),
        ]
        return " ".join([p for p in parts if p]).strip()

    def _to_float(self, value):
        if value is None:
            return None
        try:
            if isinstance(value, str):
                value = value.replace(",", "").strip()
            return float(value)
        except Exception:
            return None

    def _profile_signal_scores(self, scheme: dict, user_profile: dict, scheme_tokens: set[str], text_blob: str):
        occupation = str(user_profile.get("occupation") or "").strip().lower()
        state = str(user_profile.get("state") or "").strip().lower()
        gender = str(user_profile.get("gender") or "").strip().lower()
        income = self._to_float(user_profile.get("monthly_income"))

        occupation_exact = 1.0 if self._occupation_match(scheme, occupation) else 0.0
        occupation_token_overlap = 0.0
        if occupation:
            occ_aliases = self._occupation_aliases(occupation)
            occupation_token_overlap = len(occ_aliases & scheme_tokens) / max(len(occ_aliases), 1)

        state_exact = 1.0 if self._state_match(scheme, state) else 0.0

        gender_match = 0.0
        if gender:
            rule_gender = self._normalize_text(scheme.get("gender"))
            if rule_gender and ("any" in rule_gender or gender in rule_gender):
                gender_match = 1.0

        income_match = 0.0
        max_income = self._to_float(scheme.get("max_income"))
        if income is not None and max_income is not None:
            if income <= max_income:
                income_match = 1.0

        profile_score = (
            0.80 * occupation_exact
            + 0.25 * occupation_token_overlap
            + 0.20 * state_exact
            + 0.10 * gender_match
            + 0.05 * income_match
        )

        return {
            "profile_score": profile_score,
            "occupation_exact": occupation_exact,
            "occupation_token_overlap": occupation_token_overlap,
            "state_exact": state_exact,
            "gender_match": gender_match,
            "income_match": income_match,
        }

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

        # Embeddings: keep user query and profile context separate for better control
        step_start = time.time()
        query_vector = self.llm.get_embedding(query)
        profile_vector = self.llm.get_embedding(profile_text)

        self._trace(system_trace, 3,
            "QUERY_EMBEDDED",
            "VECTOR_ENCODER",
            {
                "embedding_type": "semantic_vector",
                "embedding_dimension": len(query_vector),
                "query_strategy": "hybrid_query_plus_profile"
            },
            step_start
        )
        step_start = time.time()

        state = user_profile.get("state")
        occupation = str(user_profile.get("occupation") or "").strip().lower()
        candidate_ids = []
        occupation_candidate_ids = []
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

        # Occupation-intent candidates (helps when semantic search drifts)
        if occupation:
            occ_aliases = list(self._occupation_aliases(occupation))[:8]
            occ_or = []
            for occ in occ_aliases:
                safe = re.escape(occ)
                occ_or.extend([
                    {"occupation": {"$regex": safe, "$options": "i"}},
                    {"description": {"$regex": safe, "$options": "i"}},
                    {"eligibility_text": {"$regex": safe, "$options": "i"}},
                    {"scheme_name": {"$regex": safe, "$options": "i"}},
                    {"category": {"$regex": safe, "$options": "i"}},
                ])

            if occ_or:
                occ_cursor = self.collection.find({"$or": occ_or}, {"_id": 1}).limit(500)
                occupation_candidate_ids = [doc["_id"] for doc in occ_cursor]


        self._trace(system_trace, 4,
            "CANDIDATE_SPACE_REDUCED",
            "MONGODB",
            {
                "db_filter_applied": db_filter if state else "none",
                "candidates_considered": len(candidate_ids),
                "occupation_candidates_considered": len(occupation_candidate_ids),
                "fallback_to_full_corpus": fallback_used,
                "sample_candidate_ids": [str(cid) for cid in candidate_ids[:5]]
            },
            step_start
        )

        # -------------------------
        # STEP 5 — Multi-field FAISS Retrieval + score fusion
        # -------------------------
        step_start = time.time()

        semantic_scores = defaultdict(float)
        retrieval_debug = []
        expanded_k = max(top_k * 8, 40)

        for field, weight in self.field_weights.items():
            if field not in self.faiss_indexes:
                continue

            field_doc_ids, field_scores = self.retrieve_similar_docs_with_scores(
                query_vector,
                field,
                expanded_k
            )

            for doc_id, score in zip(field_doc_ids, field_scores):
                semantic_scores[doc_id] += float(score) * weight

            retrieval_debug.append({
                "field": field,
                "weight": weight,
                "hits": len(field_doc_ids)
            })

        # Small profile-anchor retrieval to retain strong user-profile relevance
        for field in ["description", "eligibility_text"]:
            if field not in self.faiss_indexes:
                continue
            prof_doc_ids, prof_scores = self.retrieve_similar_docs_with_scores(
                profile_vector,
                field,
                max(top_k * 4, 20)
            )
            for doc_id, score in zip(prof_doc_ids, prof_scores):
                semantic_scores[doc_id] += float(score) * 0.10

        self._trace(system_trace, 5,
            "FAISS_SIMILARITY_SEARCH",
            "FAISS_INDEX",
            {
                "similarity_metric": "cosine",
                "top_k": top_k,
                "expanded_k_per_field": expanded_k,
                "field_retrieval": retrieval_debug,
                "unique_candidates": len(semantic_scores)
            },
            step_start
        )

        # -------------------------
        # STEP 6 — Metadata/lexical reranking
        # -------------------------
        step_start = time.time()

        candidate_docs = []
        if semantic_scores:
            semantic_sorted_ids = [
                doc_id for doc_id, _ in sorted(
                    semantic_scores.items(),
                    key=lambda x: x[1],
                    reverse=True
                )
            ]
            candidate_pool_ids = semantic_sorted_ids[: max(top_k * 15, 120)]
            candidate_docs = list(self.collection.find({"_id": {"$in": candidate_pool_ids}}))

        state_set = set(candidate_ids) if candidate_ids else set()
        occupation_set = set(occupation_candidate_ids) if occupation_candidate_ids else set()
        query_tokens = self._tokenize(query)
        occ_tokens = self._tokenize(str(user_profile.get("occupation") or ""))

        reranked = []
        query_text = (query or "").strip().lower()
        occupation_text = str(user_profile.get("occupation") or "").strip().lower()
        for scheme in candidate_docs:
            scheme_id = scheme.get("_id")
            if scheme_id not in semantic_scores:
                continue

            semantic = float(semantic_scores[scheme_id])
            text_blob = self._build_text_blob(scheme)
            scheme_tokens = self._tokenize(text_blob)

            query_overlap = (len(query_tokens & scheme_tokens) / max(len(query_tokens), 1)) if query_tokens else 0.0
            occ_overlap = (len(occ_tokens & scheme_tokens) / max(len(occ_tokens), 1)) if occ_tokens else 0.0

            state_boost = 0.10 if scheme_id in state_set else 0.0
            occupation_candidate_boost = 0.22 if scheme_id in occupation_set else 0.0
            occupation_boost = 0.12 if self._occupation_match(scheme, user_profile.get("occupation", "")) else 0.0
            explicit_state_boost = 0.08 if self._state_match(scheme, user_profile.get("state", "")) else 0.0

            lexical_boost = (0.20 * query_overlap) + (0.20 * occ_overlap)
            profile_signals = self._profile_signal_scores(scheme, user_profile, scheme_tokens, text_blob)

            final_score = (
                (0.60 * semantic)
                + lexical_boost
                + (0.55 * profile_signals["profile_score"])
                + state_boost
                + occupation_candidate_boost
                + occupation_boost
                + explicit_state_boost
            )

            reranked.append({
                "scheme": scheme,
                "score": final_score,
                "semantic": semantic,
                "query_overlap": query_overlap,
                "occupation_overlap": occ_overlap,
                "profile_score": profile_signals["profile_score"],
                "occupation_exact": profile_signals["occupation_exact"],
                "state_exact": profile_signals["state_exact"],
            })

        reranked.sort(key=lambda x: x["score"], reverse=True)

        # Hard-prioritize profile-consistent schemes when possible
        strongly_profiled = [
            r for r in reranked
            if (r["occupation_exact"] > 0 or r["profile_score"] >= 0.35 or r["state_exact"] > 0)
        ]

        if len(strongly_profiled) >= max(3, top_k // 2):
            reranked = strongly_profiled[:top_k]
        else:
            reranked = reranked[:top_k]

        # If still weak, apply lexical fallback from MongoDB using query/profile terms
        if len(reranked) < top_k and (query_text or occupation_text):
            or_clauses = []
            for token in [query_text, occupation_text]:
                if not token:
                    continue
                safe = re.escape(token)
                or_clauses.extend([
                    {"scheme_name": {"$regex": safe, "$options": "i"}},
                    {"description": {"$regex": safe, "$options": "i"}},
                    {"eligibility_text": {"$regex": safe, "$options": "i"}},
                    {"occupation": {"$regex": safe, "$options": "i"}},
                    {"category": {"$regex": safe, "$options": "i"}},
                ])

            if or_clauses:
                existing_ids = {str(r["scheme"]["_id"]) for r in reranked}
                fallback_docs = list(self.collection.find({"$or": or_clauses}).limit(top_k * 3))
                for doc in fallback_docs:
                    sid = str(doc.get("_id"))
                    if sid in existing_ids:
                        continue
                    text_blob = self._build_text_blob(doc)
                    scheme_tokens = self._tokenize(text_blob)
                    profile_signals = self._profile_signal_scores(doc, user_profile, scheme_tokens, text_blob)
                    reranked.append({
                        "scheme": doc,
                        "score": 0.35 + (0.45 * profile_signals["profile_score"]),
                        "semantic": 0.0,
                        "query_overlap": (len(query_tokens & scheme_tokens) / max(len(query_tokens), 1)) if query_tokens else 0.0,
                        "occupation_overlap": (len(occ_tokens & scheme_tokens) / max(len(occ_tokens), 1)) if occ_tokens else 0.0,
                        "profile_score": profile_signals["profile_score"],
                        "occupation_exact": profile_signals["occupation_exact"],
                        "state_exact": profile_signals["state_exact"],
                    })
                    existing_ids.add(sid)
                    if len(reranked) >= top_k:
                        break

        reranked.sort(key=lambda x: x["score"], reverse=True)
        reranked = reranked[:top_k]

        self._trace(system_trace, 6,
            "HYBRID_RERANK_COMPLETED",
            "POLICY_RETRIEVER",
            {
                "final_match_count": len(reranked),
                "rerank_features": [
                    "multi_field_semantic",
                    "query_lexical_overlap",
                    "occupation_lexical_overlap",
                    "state_candidate_boost",
                    "occupation_exact_boost",
                    "state_exact_boost"
                ]
            },
            step_start
        )

        # -------------------------
        # STEP 7 — Materialization
        # -------------------------
        step_start = time.time()

        results = []

        for i, item in enumerate(reranked):
            scheme = item["scheme"]
            results.append({
                "scheme_id": str(scheme["_id"]),
                "scheme_name": scheme.get("scheme_name"),
                "similarity_score": float(item["score"]),
                "semantic_score": float(item["semantic"]),
                "query_overlap": float(item["query_overlap"]),
                "occupation_overlap": float(item["occupation_overlap"]),
                "profile_score": float(item.get("profile_score", 0.0)),
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
