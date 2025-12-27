import csv
from pymongo import MongoClient

# 1️⃣ Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["policy_db"]
collection = db["schemes"]

records = []

# 2️⃣ Open CSV without pandas
with open("schemes_data.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for idx, row in enumerate(reader):
        record = {
            "_id": f"SCHEME_{idx+1:04d}",
            "scheme_name": row["scheme_name"],
            "slug": row["slug"],
            "state": "Tamil Nadu (Applicable)" if row["level"] == "Central" else "Puducherry",
            "level": row["level"],
            "department": "",
            "category": row["schemeCategory"],
            "tags": [t.strip() for t in row["tags"].split(",")],
            "description": row["details"],
            "eligibility_text": row["eligibility"],
            "documents_required_text": row["documents"],
            "benefits_text": row["benefits"],
            "application_steps_text": row["application"]
        }
        records.append(record)

# 3️⃣ Insert into MongoDB
collection.insert_many(records)

print(f"Inserted {len(records)} documents into MongoDB!")
