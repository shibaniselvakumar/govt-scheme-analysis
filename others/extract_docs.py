import json
import os
import re
from agents.eligibility_agent import EligibilityAgent
from llm.local_llm import LocalLLM

# -----------------------------
# Config
# -----------------------------
INPUT_LIMIT = 600
SAVE_EVERY = 10
OUTPUT_FILE = "precomputed_documents_new.json"

# -----------------------------
# Init
# -----------------------------
agent = EligibilityAgent(llm=LocalLLM())
all_schemes = list(agent.collection.find({}))

# -----------------------------
# Load existing file (APPEND BASE)
# -----------------------------
if os.path.exists(OUTPUT_FILE):
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        saved_data = json.load(f)
    print(f"🔁 Loaded {len(saved_data)} existing schemes")
else:
    saved_data = {}
    print("🆕 Starting fresh")

# -----------------------------
# LLM Extraction
# -----------------------------
def extract_documents_required(text: str) -> dict:
    if not text:
        return {}

    prompt = f"""
Extract ONLY documents required from the text.

Rules:
- Output ONLY valid JSON
- No explanations
- Each document must be atomic
- Do not infer
- Do not merge documents

Format:
{{ "documents": ["Document 1", "Document 2"] }}

Normalize:
- Aadhaar / Aadhar → Aadhaar Card
- Income proof → Income Certificate
- Residence proof → Residence Certificate
- Photo → Passport Size Photograph

If nothing found, return {{}}.

Text:
\"\"\"{text}\"\"\"
"""

    raw = agent.generate_answer(prompt, max_tokens=256)
    return agent.safe_json_parse(raw)

# -----------------------------
# Cleanup
# -----------------------------
def normalize_documents(docs: dict) -> dict:
    if "documents" not in docs:
        return docs

    cleaned = []

    for d in docs["documents"]:
        if not isinstance(d, str):
            continue

        parts = re.split(r",|;|\band\b|\n|\|", d)
        for p in parts:
            p = p.strip()
            if len(p) >= 4:
                cleaned.append(p)

    docs["documents"] = list(dict.fromkeys(cleaned))  # dedupe
    return docs

# -----------------------------
# Main Loop (APPEND SAFE)
# -----------------------------
new_count = 0

for scheme in all_schemes[:3]:
    scheme_id = scheme["_id"]

    # ⛔ Skip already written
    if scheme_id in saved_data:
        continue

    print(f"📄 Processing {scheme_id}")

    doc_text = scheme.get("documents_required_text", "").strip()

    if doc_text:
        extracted = extract_documents_required(doc_text[:INPUT_LIMIT])
        extracted = normalize_documents(extracted)
        saved_data[scheme_id] = extracted
    else:
        saved_data[scheme_id] = {}

    new_count += 1

    # 💾 checkpoint append-write
    if new_count % SAVE_EVERY == 0:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(saved_data, f, ensure_ascii=False, indent=2)

        print(f"💾 Appended {new_count} new schemes (total {len(saved_data)})")

# -----------------------------
# Final Save
# -----------------------------
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(saved_data, f, ensure_ascii=False, indent=2)

print(f"✅ Done. Total schemes stored: {len(saved_data)}")
