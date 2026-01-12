from .ai_agents_base import AIBaseAgent
import json
import re


class DocumentValidationAgent(AIBaseAgent):
    """
    Agent 3: Document Validation Agent (Hybrid)
    - Uses LLM ONCE to extract required documents from raw DB text
    - Deterministic validation for uploads (format + presence)
    - Incremental document uploads
    """

    def __init__(self, llm):
        super().__init__({}, llm)

        # Cache extracted document rules per scheme
        # { scheme_id: { "required_documents": {...} } }
        self.doc_rules = {}

        # In-memory user uploads
        # { scheme_id: { document_type: validation_result } }
        self.user_documents = {}

    # --------------------------------------------------
    # 🔹 LLM-based document extraction (Level 0)
    # --------------------------------------------------
    def extract_required_documents_from_text(
        self,
        scheme_id: str,
        raw_text: str
    ) -> dict:
        """
        Uses LLM to extract required documents from raw DB text.
        Cached per scheme_id.
        """

        if scheme_id in self.doc_rules:
            return self.doc_rules[scheme_id]

        if not raw_text:
            self.doc_rules[scheme_id] = {"required_documents": {}}
            return self.doc_rules[scheme_id]

        prompt = f"""
You are an expert government policy analyst.

From the text below, extract the documents required to apply
for this government scheme.

TEXT:
\"\"\"{raw_text}\"\"\"

Return STRICT JSON only in this format:

{{
  "required_documents": {{
    "<document_key>": {{
      "mandatory": true or false,
      "description": "<short description>"
    }}
  }}
}}

Rules:
- Use lowercase snake_case keys (aadhaar, pan, income_certificate, etc.)
- If mandatory status is unclear, assume mandatory = true
- Do NOT add explanations or extra text
"""

        llm_output = self.llm.generate(prompt, max_tokens=400)

        try:
            cleaned = self.clean_json_text(llm_output)
            parsed = json.loads(cleaned)
        except Exception:
            parsed = {"required_documents": {}}

        # Cache result
        self.doc_rules[scheme_id] = parsed
        return parsed

    # --------------------------------------------------
    # 🔹 Public API
    # --------------------------------------------------
    def get_required_documents(
        self,
        scheme_id: str,
        raw_documents_text: str
    ) -> dict:
        """
        Returns structured required documents for UI.
        """
        scheme_rules = self.extract_required_documents_from_text(
            scheme_id,
            raw_documents_text
        )
        return scheme_rules.get("required_documents", {})

    def validate_single_document(
        self,
        scheme_id: str,
        document_type: str,
        document_payload: dict
    ) -> dict:
        """
        Validate a single uploaded document
        """
        required_docs = self.doc_rules.get(scheme_id, {}).get(
            "required_documents", {}
        )

        if document_type not in required_docs:
            return {
                "document": document_type,
                "status": "FAIL",
                "reason": "Document not required for this scheme"
            }

        status, reason = self.validate_document_format(
            document_type, document_payload
        )

        self.user_documents.setdefault(scheme_id, {})
        self.user_documents[scheme_id][document_type] = {
            "mandatory": required_docs[document_type].get("mandatory", True),
            "submitted": True,
            "status": status,
            "reason": reason
        }

        return {
            "document": document_type,
            "status": status,
            "reason": reason
        }

    def get_document_validation_status(self, scheme_id: str) -> dict:
        """
        Builds document validation matrix
        """
        required_docs = self.doc_rules.get(scheme_id, {}).get(
            "required_documents", {}
        )
        submitted_docs = self.user_documents.get(scheme_id, {})

        matrix = {}
        final_status = "COMPLETE"

        for doc_type, rule in required_docs.items():
            mandatory = rule.get("mandatory", True)
            submitted = submitted_docs.get(doc_type)

            if not submitted:
                status = "FAIL" if mandatory else "PASS"
                reason = (
                    "Document not submitted" if mandatory else None
                )
            else:
                status = submitted["status"]
                reason = submitted["reason"]

            matrix[doc_type] = {
                "mandatory": mandatory,
                "user_submitted": bool(submitted),
                "status": status,
                "reason": reason
            }

            if mandatory:
                if not submitted:
                    final_status = "INCOMPLETE"
                elif status == "FAIL":
                    final_status = "FAILED"

        return {
            "scheme_id": scheme_id,
            "document_validation_matrix": matrix,
            "final_document_status": final_status
        }

    # --------------------------------------------------
    # 🔹 Deterministic validation (Level 1)
    # --------------------------------------------------
    def validate_document_format(self, document_type: str, payload: dict):
        """
        Deterministic format validation
        """

        if not payload:
            return "FAIL", "Empty document payload"

        value = payload.get("value")

        if document_type == "aadhaar":
            if not value or not re.fullmatch(r"\d{12}", str(value)):
                return "FAIL", "Invalid Aadhaar format (12 digits required)"

        elif document_type == "pan":
            if not value or not re.fullmatch(
                r"[A-Z]{5}[0-9]{4}[A-Z]", str(value)
            ):
                return "FAIL", "Invalid PAN format"

        elif value is None:
            return "FAIL", "Document value missing"

        return "PASS", None

    # --------------------------------------------------
    # 🔹 Utility
    # --------------------------------------------------
    def clean_json_text(self, text: str) -> str:
        """
        Cleans LLM output into valid JSON
        """
        text = re.sub(r"^```.*?\n", "", text)
        text = re.sub(r"```$", "", text)
        text = re.sub(r",(\s*[}\]])", r"\1", text)
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        return match.group(0) if match else "{}"
