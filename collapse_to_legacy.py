import json

INPUT_FILE = "precomputed_rules_new.json"
OUTPUT_FILE = "precomputed_rules_legacy1.json"


SECTOR_KEYWORDS = [
    "sector",
    "companies",
    "undertakings",
    "private",
    "cooperative",
    "joint"
]


def is_sector_like(value: str) -> bool:
    value = value.lower()
    return any(k in value for k in SECTOR_KEYWORDS)


def normalize_list(values):
    return sorted(set(v.strip().lower() for v in values if v and v.strip())) or None


def collapse_to_legacy_schema(raw: dict) -> dict:
    legacy = {
        "min_age": None,
        "max_age": None,
        "gender": None,
        "state": None,
        "occupation": None,
        "max_income": None,
        "category": None
    }

    if not raw:
        return legacy

    # ----------------------------
    # Multi-rule case
    # ----------------------------
    if "eligibility_rules" in raw:
        occupations = []
        categories = []
        genders = set()
        states = []

        for rule in raw["eligibility_rules"]:
            # Occupation
            if rule.get("occupation"):
                occs = rule["occupation"] if isinstance(rule["occupation"], list) else [rule["occupation"]]
                occupations.extend(occs)

            # Category
            if rule.get("category"):
                categories.append(rule["category"])

            # Gender
            if rule.get("gender"):
                genders.add(rule["gender"])

            # State (filter sector-like values)
            if rule.get("state"):
                sts = rule["state"] if isinstance(rule["state"], list) else [rule["state"]]
                for s in sts:
                    if not is_sector_like(str(s)):
                        states.append(s)

        legacy["occupation"] = normalize_list(occupations)
        legacy["state"] = normalize_list(states)
        legacy["category"] = categories[0] if categories else None

        if genders:
            legacy["gender"] = "Any" if "Any" in genders else list(genders)[0]

        return legacy

    # ----------------------------
    # Already-flat case
    # ----------------------------
    for k in legacy:
        if k in raw:
            value = raw[k]

            if isinstance(value, list):
                value = normalize_list(value)

            legacy[k] = value

    return legacy


# -----------------------------
# Run
# -----------------------------
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

collapsed = {}

for scheme_id, rules in data.items():
    collapsed[scheme_id] = collapse_to_legacy_schema(rules)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(collapsed, f, ensure_ascii=False, indent=2)

print(f"✅ Collapsed rules saved to {OUTPUT_FILE}")
