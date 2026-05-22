# Application Flow - Frontend to Backend Connection

## Complete User Journey

### 1. User Profile Building → Backend
**Frontend:** `UserProfile.jsx`
- User fills form (name, age, gender, state, occupation, monthly_income)
- On submit: Calls `POST /api/save-profile`
- Backend: Saves profile (currently just returns success, can be extended to MongoDB)
- Navigates to `/schemes`

### 2. Scheme Search & Selection → Backend
**Frontend:** `SchemeSelection.jsx`
- User enters search query (e.g., "Policies for fishermen")
- On search: Calls `POST /api/search-schemes` with:
  ```json
  {
    "query": "Policies for fishermen",
    "userProfile": { ... }
  }
  ```
- **Backend Flow:**
  1. `PolicyRetrieverAgent.retrieve_policies()` - Finds relevant schemes using FAISS
  2. `EligibilityAgent.validate_user_for_schemes()` - Checks eligibility
  3. Returns:
     - `top_schemes`: All retrieved schemes
     - `eligible_schemes`: Schemes user is eligible for
     - `rejected_schemes`: Schemes user is not eligible for (with reasons)
- **Frontend displays:**
  - Eligible schemes (green checkmark) - user can select
  - Rejected schemes (red X) - shows rejection reason
- User selects one or more eligible schemes
- On continue: Navigates to `/documents` with selected schemes

### 3. Document Upload & Validation → Backend
**Frontend:** `DocumentUpload.jsx`
- On load: For each selected scheme, calls `POST /api/get-required-documents`
  ```json
  {
    "scheme_id": "SCHEME_0001"
  }
  ```
- **Backend:** `DocumentValidationAgent.get_required_documents()` extracts required docs using LLM
- **Frontend displays:** Required documents for each scheme with:
  - Document type (e.g., "aadhaar", "income_certificate")
  - Mandatory/Optional status
  - Description

- **User uploads document:**
  - Drag & drop or click to upload
  - File validation: Type (PDF, JPG, PNG) and size (max 5MB)
  - Calls `POST /api/validate-document` with FormData:
    ```
    file: <File>
    scheme_id: "SCHEME_0001"
    document_type: "aadhaar"
    ```
- **Backend:** `DocumentValidationAgent.validate_single_document()` validates:
  - File format
  - Document type (Aadhaar format, PAN format, etc.)
  - Returns validation status and reason
- **Frontend shows:** Validation status (✓ valid / ✗ invalid) with reason

- **After all documents uploaded:**
  - User clicks "Continue to Full Guidance"
  - Calls `POST /api/generate-guidance` with:
    ```json
    {
      "userProfile": { ... },
      "selectedSchemes": [ ... ],
      "documents": { ... },
      "validationStatus": { ... }
    }
    ```
- Navigates to `/guidance`

### 4. Full Guidance Generation → Backend
**Backend:** `POST /api/generate-guidance`
- **Process:**
  1. For each selected scheme:
     - Get document validation status
     - Identify missing documents
     - Generate steps to acquire missing documents
     - Parse application steps from scheme data
  2. Generate complete pathway:
     - **Missing Documents Section:** Steps to get each missing doc
     - **Pre-Application Steps:** Preparation steps
     - **Application Steps:** How to apply
     - **Post-Application Steps:** What happens after application
  3. Calculate timeline estimates
  4. Add contact information

- **Returns:**
  ```json
  {
    "missing_documents": [
      {
        "document_type": "aadhaar",
        "steps": ["Step 1", "Step 2", ...],
        "office_location": "...",
        "estimated_time": "7-15 days"
      }
    ],
    "pre_application_steps": [ ... ],
    "application_steps": [ ... ],
    "post_application_steps": [ ... ],
    "timeline": {
      "estimated_days": 45,
      "breakdown": { ... }
    },
    "contact_info": { ... }
  }
  ```

**Frontend:** `FullGuidance.jsx`
- Displays complete pathway with tabs:
  - Missing Documents
  - Pre-Application
  - Application
  - Post-Application
- Shows timeline, contact info, and action buttons

### 5. Geographical Map → Backend
**Frontend:** `GeographicalMap.jsx`
- Calls `GET /api/state-utilization`
- **Backend:** Returns mock data (ready for DB integration):
  ```json
  {
    "Andhra Pradesh": 45,
    "Uttar Pradesh": 89,
    ...
  }
  ```
- Displays color-coded India map with utilization statistics

## Backend API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/save-profile` | POST | Save user profile |
| `/api/search-schemes` | POST | Search and get eligible schemes |
| `/api/get-required-documents` | POST | Get required docs for a scheme |
| `/api/validate-document` | POST | Validate uploaded document |
| `/api/generate-guidance` | POST | Generate complete pathway |
| `/api/state-utilization` | GET | Get scheme utilization by state |

## Data Flow Diagram

```
User Profile → Backend (save)
     ↓
Search Query → PolicyRetrieverAgent → FAISS Search
     ↓
Retrieved Schemes → EligibilityAgent → Eligibility Check
     ↓
Eligible Schemes → User Selection
     ↓
Selected Schemes → DocumentValidationAgent → Get Required Docs
     ↓
User Uploads Docs → DocumentValidationAgent → Validate Docs
     ↓
Validated Docs → Generate Guidance → Full Pathway
     ↓
Display Guidance → User completes application
```

## Key Integration Points

1. **Profile → Schemes:** User profile passed to eligibility checking
2. **Schemes → Documents:** Selected scheme IDs used to fetch required documents
3. **Documents → Validation:** Uploaded files validated against scheme requirements
4. **Validation → Guidance:** Document status used to generate missing doc steps
5. **All Data → Guidance:** Complete pathway generated from all agent outputs
