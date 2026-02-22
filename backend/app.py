import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import time
import os
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import json

#-------------------- MODELS --------------------
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Create Flask app instance first
app = Flask(__name__)

# Configure CORS before initializing database
CORS(app, resources={r"/*": {"origins": "*"}}, 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

# Replace PASSWORD with the postgres password you set in pgAdmin
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:shibani@localhost:5432/schemes_users'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    occupation = db.Column(db.String(50), nullable=False)
    monthly_income = db.Column(db.Numeric, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

# -------------------- IMPORT AGENTS --------------------
import sys
sys.path.append("..")

from llm.local_llm import LocalLLM
from agents.policy_retriever_agent import PolicyRetrieverAgent
from agents.eligibility_agent import EligibilityAgent
from agents.document_validation_agent import DocumentValidationAgent
from agents.pathway_generation_agent import PathwayGenerationAgent

# -------------------- TESSERACT AUTO-DETECTION --------------------
import pytesseract

# Try to find Tesseract automatically on Windows
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
            print(f"✅ Found Tesseract at: {path}")
            break
    else:
        print("⚠️  Tesseract not found in common locations. OCR will fail if not in PATH.")

# -------------------- APP SETUP --------------------
# Flask app and CORS already initialized above

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

@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "name": user.name,
        "age": user.age,
        "gender": user.gender,
        "state": user.state,
        "occupation": user.occupation,
        "monthly_income": float(user.monthly_income)
    })

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "agents_ready": AGENTS_READY})


@app.route("/api/save-profile", methods=["POST"])
def save_profile():
    initialize_agents()
    data = request.get_json()  # FIX: use request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    # Save to database
    user = User(
        name=data["name"],
        age=data["age"],
        gender=data["gender"],
        state=data["state"],
        occupation=data["occupation"],
        monthly_income=data["monthly_income"]
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"status": "success", "profile": data, "user_id": user.id})


# -------------------- SEARCH SCHEMES --------------------
@app.route("/api/search-schemes", methods=["POST"])
def search_schemes():
    initialize_agents()
    data = get_json()
    interaction_id = str(uuid.uuid4())

    # 🔹 SYSTEM TRACE (NEW)
    system_trace = []

    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    query = data.get("query")
    user_profile = data.get("userProfile", {})

    if not query:
        return jsonify({"error": "Query required"}), 400

    # 🔹 TRACE: request accepted
    system_trace.append({
        "step": 1,
        "event": "SEARCH_REQUEST_ACCEPTED",
        "node": "API_GATEWAY",
        "details": {
            "has_query": True,
            "has_profile": bool(user_profile)
        }
    })

    # 🔹 POLICY RETRIEVER (PASS TRACE)
    retrieved = policy_agent.retrieve_policies(
        query=query,
        user_profile=user_profile,
        top_k=10,
        system_trace=system_trace
    )

    # ❗ These agents are NOT visualized yet (kept unchanged)
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
                s["eligibility_text"] = full.get("eligibility_text", "")
                s["documents_required_text"] = full.get("documents_required_text", "")
                s["scheme_name"] = full.get("scheme_name", s.get("scheme_name", ""))
                # Add eligibility rules if present
                if "eligibility_rules" not in s and "eligibility_rules" in full:
                    s["eligibility_rules"] = full.get("eligibility_rules", {})
                # Add additional metadata from the scheme
                s["category"] = full.get("category", "")
                s["max_income"] = full.get("max_income", "")
                s["min_age"] = full.get("min_age", "")
                s["max_age"] = full.get("max_age", "")
                s["state"] = full.get("state", "")
                s["gender"] = full.get("gender", "")
                s["occupation"] = full.get("occupation", "")
                s["community"] = full.get("community", "")
                s["application_url"] = full.get("application_url", "")
                s["ministry"] = full.get("ministry", "")

            enriched.append(s)
        return enriched

    # 🔹 SYSTEM SNAPSHOT (UPGRADED, NOT BROKEN)
    system_snapshot = {
        "interaction_id": interaction_id,
        "active_phase": "SCHEME_DISCOVERY",
        "active_agent": "POLICY_RETRIEVER_AGENT",
        "trace": system_trace,
        "metrics": {
            "query": query,
            "schemes_found": len(retrieved)
        }
    }

    print("\n📊 SYSTEM SNAPSHOT")
    print(json.dumps(system_snapshot, indent=2))

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

    # ===== STEP 1: VALIDATE REQUEST =====
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    scheme_id = request.form.get("scheme_id")
    document_type = request.form.get("document_type")

    if not file or file.filename == "":
        return jsonify({"error": "Invalid file"}), 400

    if not scheme_id or not document_type:
        return jsonify({"error": "Missing scheme_id or document_type"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    print(f"\n📋 DOCUMENT VALIDATION START")
    print(f"  Scheme ID: {scheme_id}")
    print(f"  Document Type: {document_type}")
    print(f"  File: {file.filename}")

    # ===== STEP 2: SAVE FILE =====
    filename = secure_filename(file.filename)
    timestamp = int(time.time())
    filename = f"{timestamp}_{filename}"
    path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    
    try:
        file.save(path)
        if not os.path.exists(path):
            return jsonify({"error": "Failed to save file"}), 500
        print(f"  ✅ File saved: {path}")
    except Exception as e:
        return jsonify({"error": f"File save failed: {str(e)}"}), 500

    # ===== STEP 3: INITIALIZE SCHEME RULES IN AGENT =====
    try:
        if scheme_id not in doc_agent.doc_rules:
            print(f"  ℹ️  Initializing doc_rules for {scheme_id}...")
            required_docs = doc_agent.get_required_documents(scheme_id, "")
    except Exception as e:
        print(f"  ⚠️  Warning initializing doc_rules: {str(e)}")

    # ===== STEP 4: VALIDATE DOCUMENT =====
    try:
        result = doc_agent.validate_single_document(
            scheme_id,
            document_type,
            {"file_path": path}
        )
        print(f"  📋 Validation result: {result}")
    except Exception as e:
        print(f"  ❌ Validation error: {str(e)}")
        try:
            os.remove(path)
        except:
            pass
        return jsonify({"error": f"Validation failed: {str(e)}"}), 500

    # ===== STEP 5: GET VALIDATION MATRIX =====
    try:
        status_snapshot = doc_agent.get_document_validation_status(scheme_id)
        print(f"\n📊 DOCUMENT VALIDATION MATRIX")
        print(json.dumps(status_snapshot, indent=2))
    except Exception as e:
        print(f"  ⚠️  Could not get validation matrix: {str(e)}")
        status_snapshot = {}

    # ===== STEP 6: RETURN RESPONSE =====
    response = {
        "status": "valid" if result.get("status") == "PASS" else "invalid",
        "reason": result.get("reason", "Document validation complete"),
        "file_path": path,
        "document_type": document_type,
        "validation_matrix": status_snapshot.get("document_validation_matrix", {})
    }
    
    print(f"\n✅ RESPONSE: {response}\n")
    return jsonify(response)
    

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
