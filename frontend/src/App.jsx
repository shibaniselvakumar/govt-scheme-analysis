import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import UserProfile from './components/UserProfile'
import SchemeSelection from './components/SchemeSelection'
import DocumentUpload from './components/DocumentUpload'
import FullGuidance from './components/FullGuidance'
import GeographicalMap from './components/GeographicalMap'
import Dashboard from './components/Dashboard'

function App() {
  const [userProfile, setUserProfile] = useState(null)
  const [selectedSchemes, setSelectedSchemes] = useState([])
  const [eligibilityOutputs, setEligibilityOutputs] = useState({});
  const [uploadedDocuments, setUploadedDocuments] = useState({})
  const [guidanceData, setGuidanceData] = useState([])


  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route 
            path="/profile" 
            element={<UserProfile onComplete={setUserProfile} />} 
          />
          <Route 
            path="/schemes" 
            element={
              userProfile ? (
                <SchemeSelection 
                  userProfile={userProfile}
                  onSelect={setSelectedSchemes}
                />
              ) : (
                <Navigate to="/profile" replace />
              )
            } 
          />
          <Route 
            path="/documents" 
            element={
              selectedSchemes.length > 0 && userProfile ? (
                <DocumentUpload 
                  schemes={selectedSchemes}
                  eligibilityOutputs={eligibilityOutputs}   // << ADD THIS
                  userProfile={userProfile}
                  onComplete={(result) => {
                    setUploadedDocuments(result.documents || {})
                    setGuidanceData(result.guidanceData)
                  }}
                />
              ) : (
                <Navigate to="/schemes" replace />
              )
            } 
          />

          <Route 
            path="/guidance" 
            element={
              guidanceData.length > 0 ? (
                <FullGuidance guidanceData={guidanceData} />
              ) : (
                <Navigate to="/documents" replace />
              )
            }
          />

          <Route 
            path="/map" 
            element={<GeographicalMap />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                userProfile={userProfile}
                selectedSchemes={selectedSchemes}
                guidanceData={guidanceData}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
