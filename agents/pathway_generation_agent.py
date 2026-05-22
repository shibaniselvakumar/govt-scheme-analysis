# agents/pathway_generation_agent.py

from .ai_agents_base import AIBaseAgent
import json
import re

class PathwayGenerationAgent(AIBaseAgent):
    """
    Agent 3: Pathway Generation Agent
    Converts eligibility + document validation outputs
    into user-friendly application guidance using LLM.
    """

    def __init__(self, llm):
        """
        Agent responsible for generating user-friendly guidance pathways
        """
        super().__init__({}, llm)
        self.llm = llm

    def _as_dict(self, value):
        return value if isinstance(value, dict) else {}

    def _fallback_pathway(self, eligibility_output: dict, missing_docs: list[str]) -> dict:
        scheme_name = eligibility_output.get("scheme_name", "the selected scheme")
        fallback = {
            "pre_application": [
                f"Review eligibility conditions for {scheme_name} and keep profile details ready.",
                "Keep ID/address/income proofs ready in clear scanned copies.",
            ],
            "missing_documents": [f"Acquire {doc} as per scheme instructions." for doc in missing_docs],
            "application_steps": [
                "Open the official application portal or visit the nearest service center.",
                "Fill all mandatory fields exactly as per your official documents.",
                "Upload required documents and submit the application.",
            ],
            "post_application": [
                "Save the application acknowledgement/ID for tracking.",
                "Track status regularly and respond to verification requests promptly.",
            ],
        }

        return fallback

    def generate_pathway(self, eligibility_output: dict, document_status: dict) -> dict:
        """
        Generate full guidance for a scheme. Always generate:
        - Pre-Application
        - Application Steps
        - Post-Application
        - Missing Documents ONLY if documents are incomplete
        """
        eligibility_output = self._as_dict(eligibility_output)
        document_status = self._as_dict(document_status)

        final_status = str(document_status.get("final_document_status", "INCOMPLETE"))
        missing_docs = []
        if final_status.upper() != "COMPLETE":
            validation_matrix = self._as_dict(document_status.get("document_validation_matrix", {}))
            for doc, info in validation_matrix.items():
                info = self._as_dict(info)
                if info.get("status") != "PASS" and info.get("mandatory", True):
                    missing_docs.append(doc)

        missing_docs_block = ""
        if missing_docs:
            missing_docs_block = "MISSING_DOCUMENTS:\n" + "\n".join(
                [f"- Acquire {doc} as per scheme instructions" for doc in missing_docs]
            )


        scheme_details = self._as_dict(eligibility_output.get("scheme_details", {}))
        scheme_name = eligibility_output.get("scheme_name", "the scheme")
        scheme_description = scheme_details.get("description", "")[:200]  
        scheme_benefits = scheme_details.get("benefits_text", "")[:300] 
        application_url = scheme_details.get("application_url", "")

        # Build the prompt with concise scheme context
        prompt = f"""You are a government scheme guidance assistant helping citizens navigate the application process.

SCHEME: {scheme_name}
Brief: {scheme_description}
Key Benefits: {scheme_benefits}
URL: {application_url}

USER ELIGIBILITY STATUS:
{json.dumps(eligibility_output, indent=2)}

DOCUMENT STATUS:
{json.dumps(document_status, indent=2)}

Your task:
- Generate FULL guidance specific to {scheme_name}
- FULL guidance means:
  - Pre-Application steps (what to prepare)
  - Application steps (how to apply)
  - Post-Application steps (what happens next)
  - Missing Documents section:
    - INCLUDE only if document status is INCOMPLETE
    - SKIP if document status is COMPLETE

Important rules:
- NEVER leave Pre-Application, Application Steps, or Post-Application empty
- Steps must be SPECIFIC to {scheme_name}
- Steps must be ACTIONABLE
- Consider the user's eligibility status
- Reference the document requirements and benefits

STRICT OUTPUT FORMAT (use these exact headers):

PRE_APPLICATION:
- Provide actionable pre-application steps specific to {scheme_name}

{missing_docs_block}

APPLICATION_STEPS:
- Provide actionable application steps for {scheme_name}

POST_APPLICATION:
- Provide post-application steps

Formatting rules:
- Use '-' bullets only
- Do NOT number steps
- Do NOT return JSON
- Do NOT add explanations outside sections
- Be specific and scheme-aware
"""

        print("\n================ LLM PROMPT =================")
        print(prompt)
        print("============================================\n")

        try:
            llm_output = self.llm.generate(prompt, max_tokens=600)
        except Exception as e:
            print(f"[PATHWAY_LLM_ERROR] {e}")
            return self._fallback_pathway(eligibility_output, missing_docs)

        print("\n================ LLM RAW OUTPUT ==============")
        print(llm_output)
        print("============================================\n")

        # Parse LLM output into sections
        parsed = self._parse_sections(llm_output)

        if (
            not parsed.get("pre_application")
            and not parsed.get("application_steps")
            and not parsed.get("post_application")
        ):
            return self._fallback_pathway(eligibility_output, missing_docs)

        if missing_docs and not parsed.get("missing_documents"):
            parsed["missing_documents"] = [f"Acquire {doc} as per scheme instructions." for doc in missing_docs]

        return parsed

    def _parse_sections(self, text: str) -> dict:
        """
        Parse LLM text output into structured sections
        """
        sections = {
            "pre_application": [],
            "missing_documents": [],
            "application_steps": [],
            "post_application": []
        }

        current = None
        for line in text.splitlines():
            line = line.strip()
            if line.upper().startswith("PRE_APPLICATION"):
                current = "pre_application"
            elif line.upper().startswith("MISSING_DOCUMENTS"):
                current = "missing_documents"
            elif line.upper().startswith("APPLICATION_STEPS"):
                current = "application_steps"
            elif line.upper().startswith("POST_APPLICATION"):
                current = "post_application"
            elif line.startswith("-") and current:
                sections[current].append(line.lstrip("- ").strip())

        # 🔒 HARD FALLBACK: ensure no empty essential sections
        if not sections["pre_application"]:
            sections["pre_application"] = ["Collect necessary information before applying."]
        if not sections["application_steps"]:
            sections["application_steps"] = ["Visit the concerned department office for application details."]
        if not sections["post_application"]:
            sections["post_application"] = ["Follow up with the department for application status."]

        return sections

    def _clean_json(self, text: str) -> str:
        """
        Utility: extract JSON substring from a text (not currently used)
        """
        text = re.sub(r"^```.*?\n", "", text)
        text = re.sub(r"```$", "", text)
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        return match.group(0) if match else "{}"
