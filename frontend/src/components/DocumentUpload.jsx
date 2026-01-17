import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, X, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function DocumentUpload({ schemes, onComplete, userProfile }) {
  const navigate = useNavigate();
  const [requiredDocs, setRequiredDocs] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generatingGuidance, setGeneratingGuidance] = useState(false);

  // ---------------- FETCH REQUIRED DOCUMENTS ----------------
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docsObj = {};
        for (const scheme of schemes) {
          const schemeId = scheme.scheme_id || scheme._id;
          console.log("Schemes being fetched:", schemes);

          const res = await axios.post('/api/get-required-documents', { scheme_id: schemeId });
          docsObj[schemeId] = res.data.required_documents || {};
        }
        setRequiredDocs(docsObj);
      } catch (err) {
        console.error('Error fetching required documents:', err);
        alert('Failed to load required documents from backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [schemes]);

  // ---------------- FILE DROP ----------------
  const onDrop = async (acceptedFiles, docType, schemeId) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scheme_id', schemeId);
      formData.append('document_type', docType);

      const res = await axios.post('/api/validate-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadedFiles(prev => ({ ...prev, [`${schemeId}_${docType}`]: file }));
      setValidationStatus(prev => ({
        ...prev,
        [`${schemeId}_${docType}`]: { status: res.data.status, reason: res.data.reason },
      }));
    } catch (err) {
      console.error('Upload error:', err);
      alert('Document upload failed. Check backend is running.');
    } finally {
      setUploading(false);
    }
  };

  // ---------------- CONTINUE ----------------
  const handleContinue = async () => {
    setGeneratingGuidance(true);
    try {
      const documentMeta = {};
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        documentMeta[key] = { filename: file.name, size: file.size, type: file.type };
      });

      const res = await axios.post('/api/generate-guidance', {
        userProfile,
        selectedSchemes: schemes,
        documents: documentMeta,
        validationStatus,
      });

      onComplete({ documents: uploadedFiles, validationStatus, guidanceData: res.data });
      navigate('/guidance');
    } catch (err) {
      console.error('Guidance error:', err);
      alert('Failed to generate guidance from backend.');
    } finally {
      setGeneratingGuidance(false);
    }
  };

  const removeFile = (schemeId, docType) => {
    const key = `${schemeId}_${docType}`;
    setUploadedFiles(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
    setValidationStatus(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
  };

  if (loading) return <Loader2 className="w-8 h-8 animate-spin text-blue-600 m-auto" />;

  return (
    <div className="min-h-screen p-6">
      {schemes.map(scheme => {
        const schemeId = scheme.scheme_id || scheme._id;
        const docs = requiredDocs[schemeId] || {};
        return (
          <div key={schemeId} className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">{scheme.scheme_name}</h2>
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
                        {docInfo.mandatory !== false && <span className="text-red-600 ml-1">*</span>}
                      </h3>
                      <p className="text-sm text-gray-600">{docInfo.description}</p>
                    </div>
                    {validation && (validation.status === 'valid' ? <CheckCircle2 className="text-green-600" /> : <AlertCircle className="text-red-600" />)}
                  </div>

                  {file ? (
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div className="flex gap-2 items-center"><File className="text-blue-600" />{file.name}</div>
                      <button onClick={() => removeFile(schemeId, docType)}><X className="text-red-600" /></button>
                    </div>
                  ) : (
                    <Dropzone onDrop={(files) => onDrop(files, docType, schemeId)} disabled={uploading} />
                  )}

                  {validation?.reason && <p className="text-sm mt-2 text-gray-600">{validation.reason}</p>}
                </div>
              );
            })}
          </div>
        );
      })}
      <button onClick={handleContinue} disabled={uploading || generatingGuidance} className="btn-primary flex items-center gap-2">
        {generatingGuidance ? 'Generating...' : 'Continue'} <ArrowRight />
      </button>
    </div>
  );
}

// ---------------- DROPZONE ----------------
function Dropzone({ onDrop, disabled }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1, maxSize: MAX_FILE_SIZE, disabled });
  return (
    <div {...getRootProps()} className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input {...getInputProps()} />
      <Upload className="mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-600">Click or drag file (PDF / JPG / PNG, max 5MB)</p>
    </div>
  );
}

export default DocumentUpload;
