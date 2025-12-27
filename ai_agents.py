# ai_agents.py
from gpt4all import GPT4All
import json
from pymongo import MongoClient
import faiss
import pickle

# -------------------------------
# 1. Connect to MongoDB
# -------------------------------
client = MongoClient("mongodb://localhost:27017/")
db = client["policy_db"]
schemes_col = db["schemes"]

# -------------------------------
# 2. Load FAISS indexes
# -------------------------------
def load_faiss_index(file_path):
    with open(file_path, "rb") as f:
        return pickle.load(f)

# Example: change paths as needed
description_index = load_faiss_index("faiss_index_description.pkl")
eligibility_index = load_faiss_index("faiss_index_eligibility_text.pkl")

# -------------------------------
# 3. Initialize GPT4All
# -------------------------------
# Make sure you downloaded the GGML model locally and provide the path
model_path = "C:\\Users\\shibs\\OneDrive\\Desktop\\Projects\\CIP\\models\\ggml-gpt4all-j-v1.3-groovy.bin"  
gpt_model = GPT4All(model_path)

# -------------------------------
# 4. Query function
# -------------------------------
def query_agent(user_question, top_k=3):
    """
    Simple retrieval + LLM agent:
    - Search FAISS for relevant schemes
    - Pass top results to GPT4All to generate answer
    """
    # For simplicity, using description FAISS index
    # TODO: add proper embedding of query using sentence-transformers
    # query_embedding = embed(user_question)
    # distances, indices = description_index.search(query_embedding, top_k)
    
    # Placeholder: retrieve top_k schemes from DB
    schemes = list(schemes_col.find().limit(top_k))
    context_text = "\n\n".join([f"{s['scheme_name']}: {s['description']}" for s in schemes])

    prompt = f"Answer the question using the following schemes:\n{context_text}\n\nQuestion: {user_question}\nAnswer:"
    
    response = gpt_model.generate(prompt)
    return response

# -------------------------------
# 5. Example usage
# -------------------------------
if __name__ == "__main__":
    question = "What schemes are available for women entrepreneurs in Tamil Nadu?"
    answer = query_agent(question)
    print("AI Agent Response:\n", answer)
