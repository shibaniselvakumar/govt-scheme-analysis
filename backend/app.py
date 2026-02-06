import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import time
import os
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from bson import ObjectId
import json

# -------------------- IMPORT AGENTS --------------------
import sys
sys.path.append("..")

from llm.local_llm import LocalLLM
from agents.policy_retriever_agent import PolicyRetrieverAgent
from agents.eligibility_agent import EligibilityAgent
from agents.document_validation_agent import DocumentValidationAgent
from agents.pathway_generation_agent import PathwayGenerationAgent


# -------------------- APP SETUP --------------------
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}
MAX_FILE_SIZE = 5 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE


# -------------------- GLOBALS --------------------
faiss_indexes = {}
llm = None
policy_agent = None
elig_agent = None
doc_agent = None
pathway_agent = None
schemes_collection = None
AGENTS_READY = False


# -------------------- HELPERS --------------------
def get_json():
    return request.get_json(silent=True)


def serialize(obj):
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize(v) for v in obj]
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# -------------------- AGENT INITIALIZATION --------------------
def initialize_agents():
    global faiss_indexes, llm, policy_agent, elig_agent
    global doc_agent, pathway_agent, schemes_collection, AGENTS_READY

    if AGENTS_READY:
        return

    print("🔄 Initializing agents...")
    start_time = time.time()

    # Load FAISS indexes
    FIELDS = ["description", "eligibility_text", "documents_required_text", "benefits_text"]
    for field in FIELDS:
        path = f"../faiss_indexes/faiss_index_{field}.pkl"
        if os.path.exists(path):
            with open(path, "rb") as f:
                faiss_indexes[field] = pickle.load(f)
        else:
            print(f"⚠️ FAISS index missing for {field}")

    # MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client["policy_db"]
    schemes_collection = db["schemes"]

    # Agents
    llm = LocalLLM()
    policy_agent = PolicyRetrieverAgent(faiss_indexes, llm)
    elig_agent = EligibilityAgent(faiss_indexes, llm)
    doc_agent = DocumentValidationAgent(llm)
    pathway_agent = PathwayGenerationAgent(llm)

    AGENTS_READY = True
    print(f"✅ Agents ready in {round(time.time() - start_time, 2)}s")


# -------------------- ROUTES --------------------
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "agents_ready": AGENTS_READY})


@app.route("/api/save-profile", methods=["POST"])
def save_profile():
    initialize_agents()
    data = get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    return jsonify({"status": "success", "profile": data})


# -------------------- SEARCH SCHEMES --------------------
@app.route("/api/search-schemes", methods=["POST"])
def search_schemes():
    initialize_agents()
    data = get_json()
    interaction_id = str(uuid.uuid4())


    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    query = data.get("query")
    user_profile = data.get("userProfile", {})

    if not query:
        return jsonify({"error": "Query required"}), 400

    retrieved = policy_agent.retrieve_policies(
        query=query,
        user_profile=user_profile,
        top_k=10
    )

    eligible, rejected = elig_agent.validate_user_for_schemes(
        user_profile, retrieved
    )
    

    def enrich(schemes):
        enriched = []
        for s in schemes:
            sid = str(s.get("scheme_id") or s.get("_id"))
            try:
                full = schemes_collection.find_one({"_id": ObjectId(sid)})
            except Exception:
                full = schemes_collection.find_one({"_id": sid})

            s["_id"] = sid
            s["scheme_id"] = sid

            if full:
                s["description"] = full.get("description", "")
                s["benefits_text"] = full.get("benefits_text", "")

            enriched.append(s)
        return enriched
    # SYSTEM SNAPSHOT METADATA
    system_snapshot = {
        "interaction_id": interaction_id,
        "agents_ran": [
            "SCHEME_DISCOVERY_AGENT",
            "ELIGIBILITY_AGENT",
            "DOCUMENT_VALIDATION_AGENT",
            "PATHWAY_GENERATION_AGENT"
        ],
        "scheme_retriever": {
            "query": query,
            "candidates_scanned": len(retrieved),
            "results_returned": len(retrieved)
        },
        "eligibility_agent": {
            "rules_evaluated": len(retrieved) * 5,  # fake number, can be adjusted
            "passed": len(eligible),
            "failed": len(rejected)
        },
        "document_agent": {
            "validated": 0,
            "missing": 0
        },
        "pathway_agent": {
            "steps_generated": 0
        }
    }


    return jsonify(serialize({
        "interaction_id": interaction_id,
        "top_schemes": enrich(retrieved),
        "eligible_schemes": enrich(eligible),
        "rejected_schemes": enrich(rejected),
        "_system": system_snapshot
    }))


# -------------------- REQUIRED DOCUMENTS --------------------
@app.route("/api/get-required-documents", methods=["POST"])
def get_required_documents():
    initialize_agents()
    data = get_json()

    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    scheme_id = data.get("scheme_id")
    if not scheme_id:
        return jsonify({"error": "scheme_id required"}), 400

    try:
        scheme = schemes_collection.find_one({"_id": ObjectId(scheme_id)})
    except Exception:
        scheme = schemes_collection.find_one({"_id": scheme_id})

    if not scheme:
        return jsonify({"error": "Scheme not found"}), 404

    required_docs = doc_agent.get_required_documents(
        scheme_id=scheme_id,
        raw_documents_text=scheme.get("documents_required_text", "")
    )

    return jsonify({"required_documents": serialize(required_docs)})


# -------------------- DOCUMENT VALIDATION --------------------
@app.route("/api/validate-document", methods=["POST"])
def validate_document():
    initialize_agents()

    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    scheme_id = request.form.get("scheme_id")
    document_type = request.form.get("document_type")

    if not file or file.filename == "":
        return jsonify({"error": "Invalid file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    filename = secure_filename(file.filename)
    path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(path)

    result = doc_agent.validate_single_document(
        scheme_id,
        document_type,
        {"file_path": path}
    )

    status_snapshot = doc_agent.get_document_validation_status(scheme_id)

    print("\n📊 DOCUMENT STATUS")
    print(json.dumps(status_snapshot, indent=2))

    return jsonify({
        "status": "valid" if result["status"] == "PASS" else "invalid",
        "reason": result.get("reason"),
        "file_path": path
    })

# -------------------- PATHWAY GENERATION --------------------
@app.route("/api/generate-guidance", methods=["POST"])
def generate_pathway():
    initialize_agents()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    eligibility_output = data.get("eligibility_output")
    document_status = data.get("document_status")  # keep missing docs here

    if eligibility_output is None or document_status is None:
        return jsonify({"error": "eligibility_output and document_status required"}), 400

    try:
        pathway = pathway_agent.generate_pathway(eligibility_output, document_status)
        return jsonify({"success": True, "pathway": pathway})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------- RUN --------------------
if __name__ == "__main__":
    initialize_agents()
    app.run(debug=True, port=5000)
