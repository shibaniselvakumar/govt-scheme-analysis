# build_faiss_512d.py

import pickle
import faiss
import numpy as np
from pymongo import MongoClient

# ---- Step 1: Connect to MongoDB ----
client = MongoClient("mongodb://localhost:27017/")
db = client["policy_db"]
schemes = db["schemes"]

# ---- Step 2: Define text fields to index ----
TEXT_FIELDS = ["description", "eligibility_text", "documents_required_text", "benefits_text"]

# ---- Step 3: Your embedding module (must output 512-d vectors) ----
from your_embedding_module import get_embedding  # Replace with your actual module

# ---- Step 4: Build FAISS indexes ----
faiss_indexes = {}

for field in TEXT_FIELDS:
    embeddings_list = []
    ids = []

    for scheme in schemes.find():
        text = scheme.get(field)
        if text:
            emb = get_embedding(text)  # Should return 512-d vector
            embeddings_list.append(np.array(emb, dtype='float32'))
            ids.append(scheme["_id"])

    if embeddings_list:
        emb_matrix = np.vstack(embeddings_list)
        dim = emb_matrix.shape[1]  # Should be 512
        index = faiss.IndexFlatL2(dim)
        index.add(emb_matrix)

        faiss_indexes[field] = {"index": index, "ids": ids}

        print(f"✅ FAISS index built & saved for '{field}' with {len(ids)} vectors (dim={dim})")

        # ---- Step 5: Save index to disk ----
        with open(f"faiss_index_{field}.pkl", "wb") as f:
            pickle.dump(faiss_indexes[field], f)
        print(f"💾 FAISS index saved for {field}")

print("🎯 All FAISS indexes (512-d) are ready!")
