from agents.eligibility_agent import EligibilityAgent
import json
from llm.local_llm import LocalLLM

# Initialize agent with your LLM
agent = EligibilityAgent(llm=LocalLLM())

# Fetch all schemes from DB
all_schemes = list(agent.collection.find({}))

precomputed_documents = {}


def extract_documents_required(doc_text: str) -> dict:
    """
    Calls LLM to extract documents required as strict JSON
    """
    if not agent.llm:
        return {}

    prompt = f"""
You are a data extraction assistant. Your task is to extract documents required for an Indian government scheme and return them as a valid JSON object.

GUIDELINES:
1. Extract documents explicitly mentioned in the text.
2. Return JSON with ONLY the following key if present:
   - documents (list of strings)
3. Normalize document names:
   - "Aadhar", "Aadhaar ID" → "Aadhaar Card"
   - "Ration card copy" → "Ration Card"
   - "Income proof" → "Income Certificate"
4. If no documents are mentioned, return an empty JSON object.
5. Do NOT guess or infer missing documents.
6. Output MUST be valid JSON only. No extra text.

Documents Text:
\"\"\"{doc_text}\"\"\"

Return JSON only:
"""

    raw = agent.generate_answer(prompt, max_tokens=256)
    docs = agent.safe_json_parse(raw)
    return docs


def normalize_documents(docs: dict) -> dict:
    """
    Ensure documents is always a list of clean strings
    """
    if "documents" in docs and isinstance(docs["documents"], list):
        docs["documents"] = [
            doc.strip() for doc in docs["documents"] if isinstance(doc, str)
        ]
    return docs


# Process schemes
for scheme in all_schemes[:100]:
    scheme_id = scheme["_id"]
    doc_text = scheme.get("documents_required_text", "").strip()

    if doc_text:
        print(f"Extracting documents for scheme ID: {scheme_id}")
        docs = extract_documents_required(doc_text[:500])
        docs = normalize_documents(docs)
        precomputed_documents[scheme_id] = docs
    else:
        precomputed_documents[scheme_id] = {}


# Save to JSON file
with open("precomputed_documents.json", "w", encoding="utf-8") as f:
    json.dump(precomputed_documents, f, ensure_ascii=False, indent=2)

print(f"Precomputed documents saved for {len(precomputed_documents)} schemes.")
