import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './components/Home/HomePage'
import ProfilePage from './components/Profile/ProfilePage'
import SchemesPage from './components/RelevantSchemes/SchemesPage'
import EligibleSchemesPage from './components/EligibleSchemes/EligibleSchemesPage'

import DocumentValidationPage from './components/DocumentValidation/DocumentValidationPage'
import GuidancePage from './components/PathwayGeneration/GuidancePage'
import FullGuidance from './components/FullGuidance'
import GeographicalMap from './components/GeographicalMap'
import Dashboard from './components/Dashboard'
import SystemUIPage from './components/SystemUI/SystemUIPage'

function App() {
  const [userProfile, setUserProfile] = useState(null)
  const [selectedSchemes, setSelectedSchemes] = useState([])
  const [eligibleSchemes, setEligibleSchemes] = useState([])
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
            <Route path="/" element={<HomePage />} />

            {/* User Profile */}
            <Route 
              path="/profile" 
              element={<ProfilePage onComplete={setUserProfile} />}
            />

            {/* Relevant Schemes */}
           <Route
              path="/relevant-schemes"
              element={
                userProfile ? (
                  <SchemesPage userProfile={userProfile} />
                ) : (
                  <Navigate to="/profile" replace />
                )
              }
            />

           <Route 
              path="/eligible-schemes" 
              element={
                userProfile ? (
                  <EligibleSchemesPage 
                    userProfile={userProfile}
                    onSelect={(schemes) => {
                      setSelectedSchemes(schemes)
                      setEligibleSchemes(schemes)
                    }}
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
                  <DocumentValidationPage 
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

            {/* Pathway Generation - NEW SYSTEM UI */}
            <Route 
              path="/guidance" 
              element={
                eligibleSchemes.length > 0 && userProfile ? (
                  <GuidancePage 
                    userProfile={userProfile}
                    eligibleSchemes={eligibleSchemes}
                  />
                ) : (
                  <Navigate to="/eligible-schemes" replace />
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

            {/* System UI for live demo */}
            <Route path="/system-ui" element={<SystemUIPage />} />

          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  )
}

export default App
