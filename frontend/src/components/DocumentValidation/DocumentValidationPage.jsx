import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import DocumentUpload from './DocumentUpload'
import DocumentValidationSystemUI from './DocumentValidationSystemUI'

function DocumentValidationPage({ schemes, eligibilityOutputs, userProfile, onComplete }) {
  const [showSystemUI, setShowSystemUI] = useState(false)
  const [validationStatus, setValidationStatus] = useState({})
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [requiredDocs, setRequiredDocs] = useState({})

  console.log('🟢 DocumentValidationPage RENDERED')
  console.log('Props received:', { schemes, eligibilityOutputs, userProfile })

  const handleValidationStatusChange = (status) => {
    setValidationStatus(status)
  }

  const handleUploadedFilesChange = (files) => {
    setUploadedFiles(files)
  }

  const handleRequiredDocsChange = (docs) => {
    setRequiredDocs(docs)
  }

  return (
    <>
      {/* TOGGLE BUTTON - STYLED LIKE OTHER PAGES */}
      <button
        onClick={() => {
          console.log('🔴 BUTTON CLICKED! showSystemUI:', showSystemUI)
          setShowSystemUI(!showSystemUI)
        }}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          backgroundColor: showSystemUI ? '#2563eb' : '#1d4ed8',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '50px',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#1e40af'
          e.target.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = showSystemUI ? '#2563eb' : '#1d4ed8'
          e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)'
        }}
      >
        {showSystemUI ? '👁️ Citizen View' : '⚙️ System View'}
      </button>

      {/* MAIN CONTENT */}
      <div className="w-full min-h-screen">
        {showSystemUI ? (
          <DocumentValidationSystemUI
            validationStatus={validationStatus}
            uploadedFiles={uploadedFiles}
            requiredDocs={requiredDocs}
            schemes={schemes}
            userProfile={userProfile}
          />
        ) : (
          <DocumentUpload
            schemes={schemes}
            eligibilityOutputs={eligibilityOutputs}
            onComplete={onComplete}
            onValidationStatusChange={handleValidationStatusChange}
            onUploadedFilesChange={handleUploadedFilesChange}
            onRequiredDocsChange={handleRequiredDocsChange}
          />
        )}
      </div>
    </>
  )
}

export default DocumentValidationPage
