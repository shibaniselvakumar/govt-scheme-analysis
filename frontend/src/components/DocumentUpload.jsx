import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  FileText
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';

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
          const res = await api.post('/api/get-required-documents', {
            scheme_id: schemeId
          });
          docsObj[schemeId] = res.data.required_documents || {};
        }
        setRequiredDocs(docsObj);
      } catch (err) {
        alert('Failed to load required documents');
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

      const res = await api.post('/api/validate-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadedFiles(prev => ({
        ...prev,
        [`${schemeId}_${docType}`]: file
      }));

      setValidationStatus(prev => ({
        ...prev,
        [`${schemeId}_${docType}`]: {
          status: res.data.status,
          reason: res.data.reason
        }
      }));
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (schemeId, docType) => {
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

  // ---------------- CONTINUE ----------------
  const handleContinue = async () => {
    setGeneratingGuidance(true);
    try {
      const documentMeta = {};
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        documentMeta[key] = {
          filename: file.name,
          size: file.size,
          type: file.type
        };
      });

      const res = await api.post('/api/generate-guidance', {
        userProfile,
        selectedSchemes: schemes,
        documents: documentMeta,
        validationStatus
      });

      onComplete({
        documents: uploadedFiles,
        validationStatus,
        guidanceData: res.data
      });

      navigate('/guidance');
    } catch (err) {
      alert('Guidance generation failed');
    } finally {
      setGeneratingGuidance(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 py-10">
      <div className="max-w-6xl mx-auto px-4">

        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            Document Verification
          </h1>
          <p className="text-blue-700">
            Upload required documents for selected government schemes
          </p>
        </div>

        {/* SCHEME CARDS */}
        <div className="space-y-8">
          {schemes.map(scheme => {
            const schemeId = scheme.scheme_id || scheme._id;
            const docs = requiredDocs[schemeId] || {};

            return (
              <div
                key={schemeId}
                className="bg-white border border-blue-200 rounded-xl shadow p-6"
              >
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <FileText className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-blue-900">
                    {scheme.scheme_name}
                  </h2>
                </div>

                {Object.entries(docs).map(([docType, docInfo]) => {
                  const key = `${schemeId}_${docType}`;
                  const file = uploadedFiles[key];
                  const validation = validationStatus[key];

                  return (
                    <div
                      key={docType}
                      className="border border-blue-200 bg-blue-50 p-4 rounded-lg mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-medium text-blue-900 capitalize">
                            {docType.replace(/_/g, ' ')}
                            {docInfo.mandatory !== false && (
                              <span className="text-red-600 ml-1">*</span>
                            )}
                          </h3>
                          <p className="text-sm text-blue-700">
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
                        <div className="flex justify-between items-center bg-white p-3 rounded border border-blue-200">
                          <div className="flex gap-2 items-center text-blue-900">
                            <File className="w-5 h-5 text-blue-600" />
                            {file.name}
                          </div>
                          <button
                            onClick={() =>
                              removeFile(schemeId, docType)
                            }
                          >
                            <X className="text-red-600" />
                          </button>
                        </div>
                      ) : (
                        <Dropzone
                          onDrop={files =>
                            onDrop(files, docType, schemeId)
                          }
                          disabled={uploading}
                        />
                      )}

                      {validation?.reason && (
                        <p className="text-sm mt-2 text-blue-700">
                          {validation.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* CONTINUE BUTTON */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleContinue}
            disabled={uploading || generatingGuidance}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold disabled:opacity-50"
          >
            {generatingGuidance ? (
              <>
                <Loader2 className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Continue
                <ArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- DROPZONE ----------------
function Dropzone({ onDrop, disabled }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    disabled
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
        ${
          isDragActive
            ? 'border-blue-500 bg-blue-100'
            : 'border-blue-300 bg-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto mb-2 text-blue-600" />
      <p className="text-sm text-blue-700">
        Click or drag file (PDF / JPG / PNG, max 5MB)
      </p>
    </div>
  );
}

export default DocumentUpload;
