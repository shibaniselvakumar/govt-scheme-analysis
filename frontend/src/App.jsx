import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './components/Home'
import UserProfile from './components/UserProfile'
import RelevantSchemesDisplay from './components/RelevantSchemesDisplay'
import SchemeSelection from './components/SchemeSelection'
import DocumentUpload from './components/DocumentUpload'
import FullGuidance from './components/FullGuidance'
import GeographicalMap from './components/GeographicalMap'
import Dashboard from './components/Dashboard'

function App() {
  const [userProfile, setUserProfile] = useState(null)
  const [selectedSchemes, setSelectedSchemes] = useState([])
  const [uploadedDocuments, setUploadedDocuments] = useState({})
  const [guidanceData, setGuidanceData] = useState(null)

  return (
    <Router>
      <div className="min-h-screen bg-blue-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route
              path="/profile"
              element={<UserProfile onComplete={setUserProfile} />}
            />
            <Route
              path="/relevant-schemes"
              element={
                userProfile ? (
                  <RelevantSchemesDisplay
                    userProfile={userProfile}
                    onSchemesSelected={setSelectedSchemes}
                  />
                ) : (
                  <Navigate to="/profile" replace />
                )
              }
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
                userProfile ? (
                  selectedSchemes.length > 0 ? (
                    <DocumentUpload
                      schemes={selectedSchemes}
                      userProfile={userProfile}
                      onComplete={(result) => {
                        setUploadedDocuments(result.documents || {})
                        setGuidanceData(result.guidanceData)
                      }}
                    />
                  ) : (
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
                      <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Schemes Selected</h2>
                        <p className="text-gray-600 mb-6">Please select at least one scheme before proceeding to document upload.</p>
                        <button
                          onClick={() => window.history.back()}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Go Back to Schemes
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <Navigate to="/profile" replace />
                )
              }
            />
            <Route
              path="/guidance"
              element={
                guidanceData ? (
                  <FullGuidance data={guidanceData} />
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
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
