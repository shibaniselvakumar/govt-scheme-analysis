import { useState } from 'react'
import EligibleSchemesCitizen from './EligibleSchemesCitizen'
import EligibleSchemesSystemUI from './EligibleSchemesSystemUI'
import { Cpu, User } from 'lucide-react'

function EligibleSchemesPage({ userProfile, onSelect }) {
  const [showSystemUI, setShowSystemUI] = useState(false)
  const [systemData, setSystemData] = useState({
    schemes: [],
    eligibleSchemes: [],
    rejectedSchemes: []
  })

  return (
    <>
      <button
        onClick={() => setShowSystemUI(!showSystemUI)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
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
        onMouseEnter={(e) => e.target.style.backgroundColor = '#1e40af'}
        onMouseLeave={(e) => e.target.style.backgroundColor = showSystemUI ? '#2563eb' : '#1d4ed8'}
      >
        {showSystemUI ? (
          <>
            <User size={16} style={{marginRight: '4px'}} /> Citizen View
          </>
        ) : (
          <>
            <Cpu size={16} style={{marginRight: '4px'}} /> System View
          </>
        )}
      </button>

      <div className="min-h-screen">
       

        {showSystemUI ? (
          <EligibleSchemesSystemUI 
            userProfile={userProfile}
            schemes={systemData.schemes}
            eligibleSchemes={systemData.eligibleSchemes}
            rejectedSchemes={systemData.rejectedSchemes}
          />
        ) : (
          <EligibleSchemesCitizen
            userProfile={userProfile}
            onSelect={onSelect}
            onDataUpdate={setSystemData}
          />
        )}
      </div>
    </>
  )
}

export default EligibleSchemesPage