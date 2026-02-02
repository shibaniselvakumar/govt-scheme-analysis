import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './components/Home'
import UserProfile from './components/UserProfile'
import SchemeSelection from './components/SchemeSelection'
import DocumentUpload from './components/DocumentUpload'
import FullGuidance from './components/FullGuidance'
import GeographicalMap from './components/GeographicalMap'
import Dashboard from './components/Dashboard'

function App() {
  const [userProfile, setUserProfile] = useState(null)
  const [selectedSchemes, setSelectedSchemes] = useState([])
  const [eligibilityOutputs, setEligibilityOutputs] = useState({})
  const [uploadedDocuments, setUploadedDocuments] = useState({})
  const [guidanceData, setGuidanceData] = useState([])

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <Header />

        {/* Main content */}
        <main className="flex-grow">
          <Routes>
            {/* Home page */}
            <Route path="/" element={<Home />} />

            {/* User Profile */}
            <Route 
              path="/profile" 
              element={<UserProfile onComplete={setUserProfile} />} 
            />

            {/* Scheme Selection */}
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

            {/* Document Upload */}
            <Route 
              path="/documents" 
              element={
                selectedSchemes.length > 0 && userProfile ? (
                  <DocumentUpload 
                    schemes={selectedSchemes}
                    eligibilityOutputs={eligibilityOutputs}
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

            {/* Guidance */}
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

            {/* Map */}
            <Route path="/map" element={<GeographicalMap />} />

            {/* Dashboard */}
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

            {/* Catch all unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  )
}

export default App
