from pymongo import MongoClient
from sentence_transformers import SentenceTransformer

# Load model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["policy_db"]
schemes = db["schemes"]

TEXT_FIELDS = [
    "description",
    "eligibility_text",
    "documents_required_text",
    "benefits_text"
]

def embed_text(text):
    if not text or not text.strip():
        return None
    return model.encode(text).tolist()

# Loop through schemes
for scheme in schemes.find():
    embeddings = {}
    for field in TEXT_FIELDS:
        embeddings[field] = embed_text(scheme.get(field, ""))

    schemes.update_one(
        {"_id": scheme["_id"]},
        {"$set": {"embeddings": embeddings}}
    )

print("✅ Embedding generation complete")
