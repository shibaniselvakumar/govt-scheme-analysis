# agents/document_validation_agent.py

from .ai_agents_base import AIBaseAgent
import json
import re
import os
from PIL import Image
import pytesseract

# Auto-detect Tesseract on Windows
if os.name == 'nt':  # Windows
    possible_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        r'C:\Users\shibs\AppData\Local\Tesseract-OCR\tesseract.exe',
        r'C:\Users\shibs\Downloads\Tesseract-OCR\tesseract.exe',
        r'C:\Users\shibs\Downloads\tesseract\tesseract.exe',
    ]
    for path in possible_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break


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
        Uses precomputed JSON first; falls back to default documents if missing.
        """
        if scheme_id in self.doc_rules:
            return self.doc_rules[scheme_id]

        # Try precomputed first
        if scheme_id in self.precomputed_docs:
            precomp = self.precomputed_docs[scheme_id]
            docs_list = precomp.get("documents", [])

            # If docs_list is empty or None, use default documents
            if not docs_list:
                docs_list = ["Aadhaar Card", "Income Certificate", "Ration Card"]

            required_documents = {}
            for doc in docs_list:
                # Normalize to snake_case for consistency
                key = doc.lower().replace(" ", "_").replace("(", "").replace(")", "").strip("_")
                required_documents[key] = {
                    "mandatory": True,
                    "description": doc,
                }

            self.doc_rules[scheme_id] = {"required_documents": required_documents}
            return self.doc_rules[scheme_id]

        # Fall back to default documents if scheme not in precomputed
        default_docs = ["Aadhaar Card", "Income Certificate", "Ration Card"]
        required_documents = {}
        for doc in default_docs:
            key = doc.lower().replace(" ", "_").replace("(", "").replace(")", "").strip("_")
            required_documents[key] = {
                "mandatory": True,
                "description": doc,
            }
        
        self.doc_rules[scheme_id] = {"required_documents": required_documents}
        return self.doc_rules[scheme_id]

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

        required_docs = self.doc_rules.get(scheme_id, {}).get("required_documents", {})

        if document_type not in required_docs:
            return {
                "document": document_type,
                "status": "FAIL",
                "reason": "Document not required for this scheme",
                "ocr_text": "",
                "extracted_keywords": [],
                "matched_keywords": [],
                "confidence": 0.0
            }

        status, reason, ocr_text, matched_keywords, confidence = self.validate_document_format(document_type, document_payload)

        self.user_documents.setdefault(scheme_id, {})
        self.user_documents[scheme_id][document_type] = {
            "mandatory": required_docs[document_type].get("mandatory", True),
            "submitted": True,
            "status": status,
            "reason": reason,
            "ocr_text": ocr_text[:500] if ocr_text else "",  # Store first 500 chars
            "matched_keywords": matched_keywords,
            "confidence": confidence
        }

        return {
            "document": document_type,
            "status": status,
            "reason": reason,
            "ocr_text": ocr_text[:500] if ocr_text else "",
            "extracted_keywords": ocr_text.split() if ocr_text else [],
            "matched_keywords": matched_keywords,
            "confidence": confidence
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
        Deterministic format validation with OCR content checking
        Supports both text values and uploaded files
        Returns: (status, reason, ocr_text, matched_keywords, confidence)
        """

        if not payload:
            return "FAIL", "Empty document payload", "", [], 0.0

        # ---------- FILE-BASED DOCUMENTS ----------
        file_path = payload.get("file_path")
        if file_path:
            if not os.path.exists(file_path):
                return "FAIL", "Uploaded file not found", "", [], 0.0

            # Check file extension
            allowed_ext = {".pdf", ".jpg", ".jpeg", ".png"}
            ext = os.path.splitext(file_path)[1].lower()

            if ext not in allowed_ext:
                return "FAIL", f"Unsupported file type: {ext}", "", [], 0.0

            # Extract text using OCR
            try:
                extracted_text = self._extract_text_from_image(file_path)
                
                # Validate document type based on extracted content
                is_valid, matched_keywords, confidence = self._validate_document_content_detailed(
                    document_type,
                    extracted_text
                )
                
                if is_valid:
                    return "PASS", f"Document recognized: {document_type}", extracted_text, matched_keywords, confidence
                else:
                    return "FAIL", f"Could not verify {document_type} in document", extracted_text, matched_keywords, confidence
                    
            except Exception as e:
                print(f"⚠️ OCR Error for {document_type}: {str(e)}")
                return "FAIL", f"Failed to process document: {str(e)}", "", [], 0.0

        # ---------- VALUE-BASED DOCUMENTS ----------
        value = payload.get("value")

        if document_type == "aadhaar":
            if not value or not re.fullmatch(r"\d{12}", str(value)):
                return "FAIL", "Invalid Aadhaar format (12 digits required)", value, ["aadhaar"], 0.0

        elif document_type == "pan":
            if not value or not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", str(value)):
                return "FAIL", "Invalid PAN format", value, ["pan"], 0.0

        elif value is None:
            return "FAIL", "Document value missing", "", [], 0.0

        return "PASS", None, str(value), [document_type], 1.0

    def _extract_text_from_image(self, file_path: str) -> str:
        """Extract text from image using OCR (Tesseract)"""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                raise Exception(f"File not found: {file_path}")
            
            # Handle PDF files separately
            ext = os.path.splitext(file_path)[1].lower()
            if ext == '.pdf':
                print(f"  ℹ️  PDF files require pdf2image library for OCR. Using fallback validation.")
                raise Exception("PDF processing requires additional dependencies")
            
            # Open and process image
            image = Image.open(file_path)
            print(f"  📸 Image loaded: {image.size}")
            
            # Extract text using Tesseract
            text = pytesseract.image_to_string(image)
            text = text.lower()
            
            if not text or len(text.strip()) < 5:
                print(f"  ⚠️  No meaningful text extracted from image")
                raise Exception("No readable text found in image (blurry or invalid document)")
            
            print(f"  ✅ OCR extracted {len(text)} characters")
            return text
            
        except Exception as e:
            raise Exception(f"OCR extraction failed: {str(e)}")

    def _validate_document_content(self, document_type: str, extracted_text: str) -> bool:
        """
        Validate if the extracted text matches the expected document type
        Uses fuzzy matching to handle OCR errors
        """
        is_valid, _, _ = self._validate_document_content_detailed(document_type, extracted_text)
        return is_valid

    def _validate_document_content_detailed(self, document_type: str, extracted_text: str) -> tuple:
        """
        Validate if the extracted text matches the expected document type
        Returns: (is_valid, matched_keywords, confidence_score)
        Uses fuzzy matching to handle OCR errors
        """
        import difflib
        
        document_type = document_type.lower().strip()
        
        # Normalize document type (remove special chars, extra spaces)
        normalized_type = document_type.replace("_", " ").replace(",", "").replace(".", "").strip()
        
        # Keywords to look for in each document type
        keywords_map = {
            "aadhaar": ["aadhaar", "aadhar", "unique identification", "enrollment"],
            "aadhar": ["aadhaar", "aadhar", "unique identification", "enrollment"],
            "aadhar card": ["aadhaar", "aadhar", "unique identification", "enrollment"],
            "pan": ["pan", "income tax", "permanent account number"],
            "pan card": ["pan", "income tax", "permanent account number"],
            "passport": ["passport", "date of issue", "date of expiry"],
            "bank account": ["account", "ifsc", "bank", "account number"],
            "bank account details": ["account", "ifsc", "bank"],
            "driving license": ["driving", "license", "dlr", "license number"],
            "driving licence": ["driving", "license", "dlr"],
            "ration card": ["ration", "cardholder", "aepds"],
            "voter id": ["voter", "election", "electoral", "voter id"],
            "voter id card": ["voter", "election", "electoral"],
            "income certificate": ["income", "certificate", "issued"],
            "caste certificate": ["caste", "certificate", "sc", "st", "obc"],
            "land document": ["land", "deed", "property", "plot", "survey"],
            "land ownership": ["land", "deed", "property", "owner"],
            "land proof": ["land", "deed", "property"],
            "death certificate": ["death", "certificate", "deceased"],
            "marriage certificate": ["marriage", "certificate", "spouse"],
            "birth certificate": ["birth", "certificate", "born", "date of birth"],
            "age proof": ["birth", "certificate", "born", "date of birth", "age"],
            "residential certificate": ["residential", "certificate", "resident"],
            "photograph": ["photograph", "photo", "image", "jpg", "png"],
            "gram panchayat": ["gram panchayat", "panchayat certificate"],
            "gram panchayat certificate": ["gram panchayat", "panchayat"],
            "passport sized photo": ["photo", "photograph", "passport"],
            "educational certificate": ["educational", "certificate", "school", "college", "university", "marksheet"],
            "educational marksheet": ["educational", "marksheet", "school", "college", "university"],
            "residence nativity certificate": ["residence", "nativity", "certificate", "residential"],
        }
        
        # Try exact match first
        keywords = keywords_map.get(document_type, [])
        
        # If not found, try normalized version
        if not keywords:
            keywords = keywords_map.get(normalized_type, [])
        
        # Try partial matching
        if not keywords:
            for key in keywords_map:
                if key in normalized_type or normalized_type in key:
                    keywords = keywords_map[key]
                    break
        
        print(f"  📄 Document Type: {document_type}")
        print(f"  🔍 Looking for keywords: {keywords}")
        
        # Check if at least one keyword is found
        if not keywords:
            print(f"  ❌ No validation keywords for '{document_type}' - REJECTING")
            return False, [], 0.0
        
        # Fuzzy matching: find keywords even with OCR errors
        found_keywords = []
        for kw in keywords:
            # Exact match
            if kw in extracted_text:
                found_keywords.append(kw)
            else:
                # Fuzzy match: check if keyword is 75% similar (handles OCR errors)
                for word in extracted_text.split():
                    similarity = difflib.SequenceMatcher(None, kw, word).ratio()
                    if similarity >= 0.75:  # 75% match threshold
                        found_keywords.append(f"{kw}(~{word})")
                        break
        
        print(f"  ✅ Keywords found: {found_keywords}")
        print(f"  📋 Extracted text (first 200 chars): {extracted_text[:200]}")
        
        # Calculate confidence
        confidence = min(len(found_keywords) / max(len(keywords), 1), 1.0)
        
        # Require at least one keyword match
        if len(found_keywords) > 0:
            return True, found_keywords, confidence
        else:
            print(f"  ❌ No keywords matched (fuzzy match threshold: 75%)")
            return False, [], 0.0

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
