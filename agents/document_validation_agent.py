# agents/document_validation_agent.py

from .ai_agents_base import AIBaseAgent
import json
import re
import os


class DocumentValidationAgent(AIBaseAgent):
    """
    Agent 3: Document Validation Agent (Hybrid)
    - Uses precomputed document rules when available
    - Falls back to LLM extraction if missing
    - Deterministic validation for uploads (format + presence)
    - Incremental document uploads
    """

    def __init__(self, llm=None, precomputed_docs_file="precomputed_documents.json"):
        super().__init__({}, llm)

        # Cache extracted document rules per scheme
        self.doc_rules = {}

        # In-memory user uploads
        self.user_documents = {}

        agents_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(agents_dir)

        precomputed_path = os.path.join(project_root, precomputed_docs_file)
        try:
            with open(precomputed_path, "r", encoding="utf-8") as f:
                self.precomputed_docs = json.load(f)
                print(f"✅ Loaded precomputed documents for {len(self.precomputed_docs)} schemes")
        except FileNotFoundError:
            print("⚠️ Precomputed documents file not found. Falling back to LLM extraction.")
            self.precomputed_docs = {}

    # --------------------------------------------------
    # 🔹 Document extraction (precomputed or LLM)
    # --------------------------------------------------
    def extract_required_documents(self, scheme_id: str, raw_text: str = "") -> dict:
        """
        Returns structured document rules for a scheme.
        Uses precomputed JSON first; falls back to LLM if missing.
        Adapts to 'documents' list format from your JSON.
        """
        if scheme_id in self.doc_rules:
            return self.doc_rules[scheme_id]
        
        print(f"Extracting required documents for scheme {scheme_id}...")
        if scheme_id in self.precomputed_docs:
            print(f"Using precomputed documents for scheme {scheme_id}")
            docs_list = self.precomputed_docs[scheme_id].get("documents", [])
            # Convert list of strings to dict with default metadata
            parsed = {"required_documents": {
                self._normalize_doc_key(doc): {"mandatory": True, "description": doc} 
                for doc in docs_list
            }}
        else:
            # Fallback to LLM
            
            parsed = {"required_documents": {}}
            print(f"⚠️ No LLM or raw text available for scheme {scheme_id}. Returning empty document rules.")
            

        self.doc_rules[scheme_id] = parsed
        return parsed

    def _normalize_doc_key(self, doc_name: str) -> str:
        """
        Converts human-readable doc name to lowercase snake_case key
        """
        key = doc_name.lower()
        key = re.sub(r"[^a-z0-9]+", "_", key)
        key = re.sub(r"_+", "_", key)
        key = key.strip("_")
        return key


    def _extract_documents_from_llm(self, scheme_id: str, raw_text: str) -> dict:
        """
        LLM extraction fallback
        """
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
        cleaned = self.clean_json_text(llm_output)

        try:
            parsed = json.loads(cleaned)
        except Exception:
            parsed = {"required_documents": {}}

        return parsed

    # --------------------------------------------------
    # 🔹 Public API
    # --------------------------------------------------
    def get_required_documents(self, scheme_id: str, raw_documents_text: str = "") -> dict:
        """
        Returns structured required documents for UI.
        """
        scheme_rules = self.extract_required_documents(scheme_id, raw_documents_text)
        return scheme_rules.get("required_documents", {})

    def validate_single_document(self, scheme_id: str, document_type: str, document_payload: dict) -> dict:
        """
        Validate a single uploaded document
        """
        required_docs = self.doc_rules.get(scheme_id, {}).get("required_documents", {})

        if document_type not in required_docs:
            return {
                "document": document_type,
                "status": "FAIL",
                "reason": "Document not required for this scheme"
            }

        status, reason = self.validate_document_format(document_type, document_payload)

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

        if scheme_id not in self.doc_rules:
            return {
                "scheme_id": scheme_id,
                "document_validation_matrix": {},
                "final_document_status": "NOT_INITIALIZED"
            }
    
        required_docs = self.doc_rules.get(scheme_id, {}).get("required_documents", {})
        submitted_docs = self.user_documents.get(scheme_id, {})

        matrix = {}
        final_status = "COMPLETE"

        for doc_type, rule in required_docs.items():
            mandatory = rule.get("mandatory", True)
            submitted = submitted_docs.get(doc_type)

            if not submitted:
                status = "FAIL" if mandatory else "PASS"
                reason = "Document not submitted" if mandatory else None
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
    # 🔹 Deterministic validation
    # --------------------------------------------------


    def validate_document_format(self, document_type: str, payload: dict):
        """
        Deterministic format validation
        Supports both text values and uploaded files
        """

        if not payload:
            return "FAIL", "Empty document payload"

        # ---------- FILE-BASED DOCUMENTS ----------
        file_path = payload.get("file_path")
        if file_path:
            if not os.path.exists(file_path):
                return "FAIL", "Uploaded file not found"

            # Optional: extension check
            allowed_ext = {".pdf", ".jpg", ".jpeg", ".png"}
            ext = os.path.splitext(file_path)[1].lower()

            if ext not in allowed_ext:
                return "FAIL", f"Unsupported file type: {ext}"

            return "PASS", None

        # ---------- VALUE-BASED DOCUMENTS ----------
        value = payload.get("value")

        if document_type == "aadhaar":
            if not value or not re.fullmatch(r"\d{12}", str(value)):
                return "FAIL", "Invalid Aadhaar format (12 digits required)"

        elif document_type == "pan":
            if not value or not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", str(value)):
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
