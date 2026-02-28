import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import GuidanceCitizen from './GuidanceCitizen'
import GuidanceSystemUI from './GuidanceSystemUI'
import { Cpu, User } from 'lucide-react'

function GuidancePage({ userProfile, eligibleSchemes = [] }) {
  const location = useLocation()
  const [showSystemUI, setShowSystemUI] = useState(false)
  const [systemSnapshot, setSystemSnapshot] = useState(null)
  const [guidanceData, setGuidanceData] = useState([])
  const [schemeData, setSchemeData] = useState(eligibleSchemes)

  // Receive guidance data from DocumentUpload route state
  useEffect(() => {
    const state = location.state
    if (state?.guidanceData) {
      console.log('[GUIDANCE_PAGE] Received guidance data from route state:', state.guidanceData)
      setSchemeData(state.guidanceData)
    }
  }, [location.state])

  return (
    <div className="relative min-h-screen">
      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setShowSystemUI(!showSystemUI)}
        className="fixed top-6 right-6 z-[9999]
          bg-blue-600 hover:bg-blue-700
          text-white px-4 py-2 rounded-full
          flex items-center gap-2 shadow-lg transition"
      >
        {showSystemUI ? (
          <>
            <User className="w-4 h-4" />
            Citizen View
          </>
        ) : (
          <>
            <Cpu className="w-4 h-4" />
            System View
          </>
        )}
      </button>

      {/* CONTENT SWITCH */}
      {showSystemUI ? (
        <GuidanceSystemUI
          userProfile={userProfile}
          systemSnapshot={systemSnapshot}
          guidanceData={guidanceData}
          eligibleSchemes={schemeData}
        />
      ) : (
        <GuidanceCitizen
          userProfile={userProfile}
          eligibleSchemes={schemeData}
          setSystemSnapshot={setSystemSnapshot}
          setGuidanceData={setGuidanceData}
        />
      )}
    </div>
  )
}

export default GuidancePage
