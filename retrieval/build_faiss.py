import os
import pickle
import faiss
import numpy as np
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer  # your embedding model

# -----------------------------
# Config
# -----------------------------
TEXT_FIELDS = ["description", "eligibility_text", "documents_required_text", "benefits_text"]
INDEX_DIR = "indexes"
os.makedirs(INDEX_DIR, exist_ok=True)

# -----------------------------
# Connect MongoDB
# -----------------------------
client = MongoClient("mongodb://localhost:27017/")
db = client["policy_db"]
schemes = db["schemes"]

# -----------------------------
# Load embedding model
# -----------------------------
# Replace with your 512-d model
embed_model = SentenceTransformer("all-mpnet-base-v2")  # 768-d, you can choose 512-d if needed

# -----------------------------
# Build FAISS indexes
# -----------------------------
faiss_indexes = {}

for field in TEXT_FIELDS:
    texts = []
    ids = []
    for scheme in schemes.find():
        text = scheme.get(field)
        if text:
            texts.append(text)
            ids.append(scheme["_id"])

    if texts:
        # Generate embeddings
        embeddings = embed_model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        dim = embeddings.shape[1]

        # Build FAISS index
        index = faiss.IndexFlatL2(dim)
        index.add(embeddings.astype(np.float32))
        faiss_indexes[field] = {"index": index, "ids": ids}

        # Save index + IDs to disk
        with open(os.path.join(INDEX_DIR, f"faiss_index_{field}.pkl"), "wb") as f:
            pickle.dump(faiss_indexes[field], f)

        print(f"✅ FAISS index built & saved for '{field}' with {len(ids)} vectors (dim={dim})")

print("🎉 All FAISS indexes are ready in the 'indexes/' folder!")
