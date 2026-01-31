from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import time
import os
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from bson import ObjectId
import json

# Import agents
import sys
sys.path.append("..")
from llm.local_llm import LocalLLM
from agents.policy_retriever_agent import PolicyRetrieverAgent
from agents.eligibility_agent import EligibilityAgent
from agents.document_validation_agent import DocumentValidationAgent

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
schemes_collection = None
AGENTS_READY = False  # ✅ Flag to ensure agents are loaded before requests

# -------------------- HELPERS --------------------
def get_json():
    data = request.get_json(silent=True)
    if not data:
        return None
    return data

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
    global faiss_indexes, llm, policy_agent, elig_agent, doc_agent, schemes_collection, AGENTS_READY

    if AGENTS_READY:
        return  # Already initialized

    print("🔄 Initializing agents... This may take a few seconds...")
    start_time = time.time()

    # Load FAISS indexes
    FIELDS = ["description", "eligibility_text", "documents_required_text", "benefits_text"]
    for field in FIELDS:
        path = f"../faiss_indexes/faiss_index_{field}.pkl"
        if os.path.exists(path):
            with open(path, "rb") as f:
                faiss_indexes[field] = pickle.load(f)
        else:
            print(f"⚠️ FAISS index for '{field}' not found! Creating empty placeholder...")
            faiss_indexes[field] = None  # Placeholder for missing index

    # Setup MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client["policy_db"]
    schemes_collection = db["schemes"]

    # Initialize LLM & Agents
    try:
        llm = LocalLLM()
        policy_agent = PolicyRetrieverAgent(faiss_indexes, llm)
        elig_agent = EligibilityAgent(faiss_indexes, llm)
        doc_agent = DocumentValidationAgent(llm)
        AGENTS_READY = True
        print(f"✅ Agents ready! Initialization took {round(time.time() - start_time, 2)}s")
    except Exception as e:
        print(f"⚠️ Failed to initialize agents: {e}")
        print("🚀 Starting Flask server without AI agents...")
        AGENTS_READY = False

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
    return jsonify({"status": "success", "message": "Profile saved", "profile": data})

@app.route("/api/search-schemes", methods=["POST"])
def search_schemes():
    initialize_agents()
    data = get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    query = data.get("query", "")
    user_profile = data.get("userProfile", {})

    # If no query provided, use a default query to get all schemes
    if not query:
        query = "government welfare schemes"

    # Fallback mode when agents are not available
    if not AGENTS_READY:
        print("🔄 Using fallback mode - returning mock schemes")
        mock_schemes = [
            {
                "_id": "mock_1",
                "scheme_id": "mock_1",
                "scheme_name": "Pradhan Mantri Jan Dhan Yojana",
                "description": "Financial inclusion scheme providing banking services to all",
                "benefits_text": "Zero balance savings account, RuPay debit card, accident insurance up to ₹1 lakh"
            },
            {
                "_id": "mock_2",
                "scheme_id": "mock_2",
                "scheme_name": "Ayushman Bharat Yojana",
                "description": "Health insurance scheme for poor and vulnerable families",
                "benefits_text": "Health coverage up to ₹5 lakh per family per year"
            },
            {
                "_id": "mock_3",
                "scheme_id": "mock_3",
                "scheme_name": "Pradhan Mantri Awas Yojana",
                "description": "Housing scheme for urban and rural poor",
                "benefits_text": "Financial assistance for construction/acquisition of houses"
            },
            {
                "_id": "mock_4",
                "scheme_id": "mock_4",
                "scheme_name": "MGNREGA",
                "description": "Rural employment guarantee scheme",
                "benefits_text": "100 days of guaranteed wage employment per household"
            }
        ]

        # Simple eligibility check based on user profile
        eligible = []
        rejected = []

        for scheme in mock_schemes:
            # Basic eligibility logic
            is_eligible = True
            reason = ""

            if scheme["scheme_name"] == "Ayushman Bharat Yojana":
                # Check income for health scheme
                income = user_profile.get("monthly_income", 0)
                if income > 10000:  # Mock threshold
                    is_eligible = False
                    reason = "Income above threshold for this scheme"
            elif scheme["scheme_name"] == "Pradhan Mantri Awas Yojana":
                # Check state for housing scheme
                state = user_profile.get("state", "")
                if state not in ["Uttar Pradesh", "Bihar", "Madhya Pradesh", "Rajasthan"]:
                    is_eligible = False
                    reason = "Scheme not available in your state"

            if is_eligible:
                eligible.append(scheme)
            else:
                rejected.append({**scheme, "reason": reason})

        response = {
            "top_schemes": mock_schemes,
            "eligible_schemes": eligible,
            "rejected_schemes": rejected
        }

        return jsonify(serialize(response))

    try:
        retrieved = policy_agent.retrieve_policies(query=query, user_profile=user_profile, top_k=10)
        eligible, rejected = elig_agent.validate_user_for_schemes(user_profile, retrieved)
    except Exception as e:
        print("❌ Error during scheme retrieval:", e)
        return jsonify({"error": str(e)}), 500

    # Enrich schemes
    def enrich(schemes):
        result = []
        for s in schemes:
            sid = str(s.get("scheme_id") or s.get("_id"))
            try:
                full = schemes_collection.find_one({"_id": ObjectId(sid)})
            except:
                full = None

            s["_id"] = sid
            s["scheme_id"] = sid
            if full:
                s["description"] = full.get("description", "")
                s["benefits_text"] = full.get("benefits_text", "")
            result.append(s)
        return result

    response = {
        "top_schemes": enrich(retrieved),
        "eligible_schemes": enrich(eligible),
        "rejected_schemes": enrich(rejected)
    }

    return jsonify(serialize(response))

@app.route('/api/get-required-documents', methods=['POST'])
def get_required_documents():
    initialize_agents()

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    scheme_id = data.get("scheme_id")
    if not scheme_id:
        return jsonify({"error": "scheme_id required"}), 400

    # Fallback mode when agents are not available
    if not AGENTS_READY:
        print("🔄 Using fallback mode for required documents")
        # Mock required documents based on scheme name - expanded to 6-7 documents each
        mock_docs = {}

        if "Jan Dhan" in str(scheme_id) or "mock_1" in str(scheme_id):
            mock_docs = {
                "aadhar_card": {
                    "description": "Aadhaar card copy for identity verification",
                    "mandatory": True
                },
                "bank_passbook": {
                    "description": "Bank passbook first page showing account details",
                    "mandatory": True
                },
                "pan_card": {
                    "description": "PAN card copy for tax identification",
                    "mandatory": True
                },
                "mobile_number": {
                    "description": "Mobile number linked with Aadhaar for OTP verification",
                    "mandatory": True
                },
                "email_id": {
                    "description": "Valid email address for account communication",
                    "mandatory": False
                },
                "address_proof": {
                    "description": "Utility bill or any address proof document",
                    "mandatory": True
                },
                "photo": {
                    "description": "Recent passport size photograph",
                    "mandatory": True
                }
            }
        elif "Bharat" in str(scheme_id) or "mock_2" in str(scheme_id):
            mock_docs = {
                "income_certificate": {
                    "description": "Income certificate from local authority",
                    "mandatory": True
                },
                "aadhar_card": {
                    "description": "Aadhaar card copy for identity verification",
                    "mandatory": True
                },
                "ration_card": {
                    "description": "Ration card showing family details",
                    "mandatory": False
                },
                "medical_certificate": {
                    "description": "Medical certificate from registered doctor",
                    "mandatory": True
                },
                "hospital_estimate": {
                    "description": "Hospital treatment cost estimate",
                    "mandatory": True
                },
                "bank_details": {
                    "description": "Bank account details for reimbursement",
                    "mandatory": True
                },
                "family_income_proof": {
                    "description": "Proof of total family income",
                    "mandatory": True
                }
            }
        elif "Awas" in str(scheme_id) or "mock_3" in str(scheme_id):
            mock_docs = {
                "aadhar_card": {
                    "description": "Aadhaar card copy for identity verification",
                    "mandatory": True
                },
                "income_certificate": {
                    "description": "Income certificate showing annual income",
                    "mandatory": True
                },
                "property_documents": {
                    "description": "Existing property documents if any",
                    "mandatory": False
                },
                "caste_certificate": {
                    "description": "Caste certificate for SC/ST/OBC categories",
                    "mandatory": False
                },
                "bank_passbook": {
                    "description": "Bank passbook for subsidy transfer",
                    "mandatory": True
                },
                "construction_estimate": {
                    "description": "Construction cost estimate from engineer",
                    "mandatory": True
                },
                "land_documents": {
                    "description": "Land ownership or lease documents",
                    "mandatory": True
                }
            }
        elif "MGNREGA" in str(scheme_id) or "mock_4" in str(scheme_id):
            mock_docs = {
                "job_card": {
                    "description": "MGNREGA job card copy",
                    "mandatory": True
                },
                "aadhar_card": {
                    "description": "Aadhaar card copy for identity verification",
                    "mandatory": True
                },
                "bank_passbook": {
                    "description": "Bank passbook for wage transfer",
                    "mandatory": True
                },
                "voter_id": {
                    "description": "Voter ID card copy",
                    "mandatory": False
                },
                "panchayat_certificate": {
                    "description": "Certificate from local panchayat",
                    "mandatory": True
                },
                "worksite_photos": {
                    "description": "Photos of work completed",
                    "mandatory": False
                },
                "attendance_register": {
                    "description": "Attendance register copy",
                    "mandatory": True
                }
            }
        else:
            # Default documents for unknown schemes - expanded to 7 documents
            mock_docs = {
                "aadhar_card": {
                    "description": "Aadhaar card copy for identity verification",
                    "mandatory": True
                },
                "address_proof": {
                    "description": "Any address proof document",
                    "mandatory": True
                },
                "income_proof": {
                    "description": "Income certificate or salary slip",
                    "mandatory": True
                },
                "age_proof": {
                    "description": "Birth certificate or school leaving certificate",
                    "mandatory": True
                },
                "caste_certificate": {
                    "description": "Caste certificate if applicable",
                    "mandatory": False
                },
                "bank_details": {
                    "description": "Bank account details",
                    "mandatory": True
                },
                "photo": {
                    "description": "Recent passport size photograph",
                    "mandatory": True
                }
            }

        return jsonify({
            "required_documents": mock_docs
        }), 200

    scheme = None
    # Try ObjectId lookup first
    from bson import ObjectId
    try:
        scheme = schemes_collection.find_one({"_id": ObjectId(scheme_id)})
    except Exception:
        # fallback to string _id
        scheme = schemes_collection.find_one({"_id": scheme_id})

    if not scheme:
        return jsonify({"error": "Scheme not found"}), 404

    required_docs = doc_agent.get_required_documents(
        scheme_id=scheme_id,
        raw_documents_text=scheme.get("documents_required_text", "")
    )

    return jsonify({
        "required_documents": serialize(required_docs)
    }), 200



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
        scheme_id=scheme_id, document_type=document_type, document_payload={"file_path": path}
    )

    status_snapshot = doc_agent.get_document_validation_status(scheme_id)

    print("\n📊 DOCUMENT VALIDATION STATUS (BACKEND)")
    print(json.dumps(status_snapshot, indent=2))

    return jsonify({
        "status": "valid" if result.get("status") == "PASS" else "invalid",
        "reason": result.get("reason", ""),
        "file_path": path
    })

@app.route("/api/generate-guidance", methods=["POST"])
def generate_guidance():
    initialize_agents()
    data = get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    selected = data.get("selectedSchemes", [])
    if not selected:
        return jsonify({"error": "No schemes selected"}), 400

    guidance = {
        "missing_documents": [],
        "pre_application_steps": [],
        "application_steps": [],
        "post_application_steps": [],
        "timeline": {},
        "contact_info": {}
    }

    for s in selected:
        sid = s.get("scheme_id") or s.get("_id")
        try:
            scheme = schemes_collection.find_one({"_id": ObjectId(sid)})
        except:
            scheme = None

        if not scheme:
            continue

        required = doc_agent.get_required_documents(
            scheme_id=sid, raw_documents_text=scheme.get("documents_required_text", "")
        )

        for doc, info in required.items():
            guidance["missing_documents"].append({
                "scheme_id": sid,
                "document_type": doc,
                "mandatory": info.get("mandatory", True)
            })

    guidance["timeline"] = {"estimated_days": 30 + len(guidance["missing_documents"]) * 10}
    guidance["contact_info"] = {"phone": "1800-XXX-XXXX"}

    return jsonify(serialize(guidance))

# -------------------- RUN APP --------------------
if __name__ == "__main__":
    initialize_agents()  # ensure blocking at startup
    app.run(debug=True, port=5000)
