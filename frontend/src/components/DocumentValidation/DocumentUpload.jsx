import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, X, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function DocumentUpload({
  schemes = [],
  eligibilityOutputs = {},
  onComplete,
  onValidationStatusChange,
  onUploadedFilesChange,
  onRequiredDocsChange
}) {
  const navigate = useNavigate();

  const [requiredDocs, setRequiredDocs] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generatingGuidance, setGeneratingGuidance] = useState(false);

  /* ===========================
     FETCH REQUIRED DOCUMENTS
  ============================ */
  useEffect(() => {
    console.log('[INIT] Schemes received:', schemes);

    const fetchDocs = async () => {
      try {
        const docsObj = {};

        for (const scheme of schemes) {
          const schemeId = scheme.scheme_id || scheme._id;
          console.log(`[DOC_FETCH] Fetching docs for scheme: ${schemeId}`);

          const res = await axios.post('/api/get-required-documents', {
            scheme_id: schemeId,
          });

          console.log(`[DOC_FETCH] Response for ${schemeId}:`, res.data);
          docsObj[schemeId] = res.data.required_documents || {};
        }

        setRequiredDocs(docsObj);
        if (onRequiredDocsChange) onRequiredDocsChange(docsObj);
      } catch (err) {
        console.error('[DOC_FETCH_ERROR]', err);
        alert('Failed to load required documents');
      } finally {
        setLoading(false);
      }
    };

    if (schemes.length) fetchDocs();
    else setLoading(false);
  }, [schemes]);

  /* ===========================
     FILE DROP HANDLER
  ============================ */
  const onDrop = async (acceptedFiles, docType, schemeId) => {
    const file = acceptedFiles[0];
    if (!file) return;

    console.log('[UPLOAD] File dropped:', { schemeId, docType, file });

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scheme_id', schemeId);
      formData.append('document_type', docType);

      const res = await axios.post('/api/validate-document', formData);

      console.log('[UPLOAD] Validation response:', res.data);

      // Update uploaded files
      const updatedFiles = {
        ...uploadedFiles,
        [`${schemeId}_${docType}`]: file,
      };
      setUploadedFiles(updatedFiles);
      if (onUploadedFilesChange) onUploadedFilesChange(updatedFiles);

      // Update validation status with full data
      const newStatus = {
        ...validationStatus,
        [`${schemeId}_${docType}`]: {
          status: res.data.status,
          reason:
            res.data.status === "valid"
              ? "✅ Valid Document"
              : "❌ Improper Document",
          ocr_text: res.data.ocr_text || "",
          ocr_text_length: res.data.ocr_text_length || 0,
          extracted_keywords: res.data.extracted_keywords || [],
          matching_keywords: res.data.matching_keywords || [],
          file_type: res.data.file_type || "",
          file_size: res.data.file_size || 0,
          processing_timestamp: res.data.processing_timestamp,
          validation_details: res.data.validation_details || {},
        },
      };
      setValidationStatus(newStatus);
      if (onValidationStatusChange) onValidationStatusChange(newStatus);
    } catch (err) {
      console.error('[UPLOAD_ERROR]', err);
      alert('Document upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (schemeId, docType) => {
    console.log('[REMOVE_FILE]', schemeId, docType);
    const key = `${schemeId}_${docType}`;

    setUploadedFiles(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    setValidationStatus(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  /* ===========================
     CONTINUE → GENERATE GUIDANCE
  ============================ */
  const handleContinue = async () => {
    console.log('[CONTINUE_CLICKED]');
    console.log('[STATE] eligibilityOutputs:', eligibilityOutputs);
    console.log('[STATE] validationStatus:', validationStatus);

    if (!schemes.length) {
      alert('No schemes selected');
      return;
    }

    setGeneratingGuidance(true);

    try {
      console.log('[GENERATING_GUIDANCE] Calling backend API...');

      const guidanceResults = [];

      // Generate guidance for each scheme
      for (const scheme of schemes) {
        const schemeId = scheme.scheme_id || scheme._id;
        const eligibilityOutput = eligibilityOutputs[schemeId] || {};
        const docStatus = validationStatus[schemeId] || { final_document_status: 'UNKNOWN' };

        // Enrich eligibility output with ONLY essential scheme details for LLM (avoid slowdown)
        const enrichedEligibilityOutput = {
          ...eligibilityOutput,
          // Add minimal scheme metadata
          scheme_details: {
            description: scheme.description || '',
            benefits_text: scheme.benefits_text || '',
            application_url: scheme.application_url || ''
          }
        };

        console.log(`[GUIDANCE_REQUEST] Scheme: ${schemeId}`);

        try {
          const response = await axios.post('/api/generate-guidance', {
            eligibility_output: enrichedEligibilityOutput,
            document_status: docStatus,
          }, { timeout: 600000 });

          console.log(`[GUIDANCE_SUCCESS] ${schemeId}:`, response.data);

          if (response.data.success && response.data.pathway) {
            // Ensure pathway has the expected structure
            const pathway = response.data.pathway;
            const schemeInfo = response.data.scheme || {};
            console.log(`[PATHWAY_DATA] ${schemeId}:`, {
              pre_application: pathway.pre_application?.length,
              application_steps: pathway.application_steps?.length,
              missing_documents: pathway.missing_documents?.length,
              post_application: pathway.post_application?.length
            });
            
            guidanceResults.push({
              scheme_id: schemeId,
              scheme_name: schemeInfo.scheme_name || scheme.scheme_name,
              description: schemeInfo.description || scheme.description || '',
              scheme_benefits: schemeInfo.benefits_text || scheme.benefits_text || '',
              benefits_text: schemeInfo.benefits_text || scheme.benefits_text || '',
              category: schemeInfo.category || scheme.category || '',
              ministry: schemeInfo.ministry || scheme.ministry || '',
              max_income: schemeInfo.max_income || scheme.max_income || '',
              state: schemeInfo.state || scheme.state || '',
              application_url: schemeInfo.application_url || scheme.application_url || '',
              guidance: pathway || {},
              _system: response.data._system || {},
            });
          } else {
            console.warn(`[PATHWAY_MISSING] ${schemeId}: No pathway in response`, response.data);
            guidanceResults.push({
              scheme_id: schemeId,
              scheme_name: scheme.scheme_name,
              guidance: {},
              error: 'No pathway data returned',
            });
          }
        } catch (err) {
          console.warn(`[GUIDANCE_ERROR] ${schemeId}:`, err.message);
          guidanceResults.push({
            scheme_id: schemeId,
            scheme_name: scheme.scheme_name,
            guidance: {},
            error: err.message,
          });
        }
      }

      console.log('[GUIDANCE_COMPLETE]', guidanceResults);

      onComplete({
        documents: uploadedFiles,
        guidanceData: guidanceResults,
      });

      // Pass guidance data through route state
      navigate('/guidance', { 
        state: { 
          guidanceData: guidanceResults 
        } 
      });
    } catch (err) {
      console.error('[GUIDANCE_ERROR]', err);
      alert('Failed to generate guidance');
    } finally {
      setGeneratingGuidance(false);
    }
  };

  if (loading)
    return <Loader2 className="w-8 h-8 animate-spin text-blue-600 m-auto" />;

  /* ===========================
     UI
  ============================ */
  return (
    <div className="min-h-screen p-6 bg-white">
      {schemes.map(scheme => {
        const schemeId = scheme.scheme_id || scheme._id;
        const docs = requiredDocs[schemeId] || {};

        return (
          <div key={schemeId} className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {scheme.scheme_name}
            </h2>

            {Object.entries(docs).map(([docType, docInfo]) => {
              const key = `${schemeId}_${docType}`;
              const file = uploadedFiles[key];
              const validation = validationStatus[key];

              return (
                <div key={docType} className="border p-4 rounded mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="capitalize font-medium">
                        {docType.replace(/_/g, ' ')}
                        {docInfo.mandatory !== false && (
                          <span className="text-red-600 ml-1">*</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {docInfo.description}
                      </p>
                    </div>

                    {validation &&
                      (validation.status === 'valid' ? (
                        <CheckCircle2 className="text-green-600" />
                      ) : (
                        <AlertCircle className="text-red-600" />
                      ))}
                  </div>

                  {file ? (
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div className="flex gap-2 items-center">
                        <File className="text-blue-600" />
                        {file.name}
                      </div>
                      <button onClick={() => removeFile(schemeId, docType)}>
                        <X className="text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <Dropzone
                      onDrop={files => onDrop(files, docType, schemeId)}
                      disabled={uploading}
                    />
                  )}

                  {validation && (
                    <p
                      className={`text-sm mt-2 font-medium ${
                        validation.status === "valid"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {validation.status === "valid"
                        ? "✅ Valid Document"
                        : "❌ Improper Document"}
                    </p>
                  )}    
                </div>
              );
            })}
          </div>
        );
      })}

      <button
        onClick={handleContinue}
        disabled={uploading || generatingGuidance}
        className="btn-primary flex items-center gap-2"
      >
        {generatingGuidance ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Guidance... (This may take up to 2 minutes)
          </>
        ) : (
          <>
            Continue <ArrowRight />
          </>
        )}
      </button>
    </div>
  );
}

/* ===========================
   DROPZONE
=========================== */
function Dropzone({ onDrop, disabled }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-600">
        Click or drag file (PDF / JPG / PNG, max 5MB)
      </p>
    </div>
  );
}

export default DocumentUpload;
