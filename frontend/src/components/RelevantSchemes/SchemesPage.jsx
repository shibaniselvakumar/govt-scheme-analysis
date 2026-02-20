import { useState } from 'react'
import RelevantSchemesDisplay from './RelevantSchemesDisplay'
import SchemesSystemUI from './SchemesSystemUI' // empty for now
import { Cpu, User } from 'lucide-react'

function SchemesPage({ userProfile }) {
  const [showSystemUI, setShowSystemUI] = useState(false)
  const [systemSnapshot, setSystemSnapshot] = useState(null)
const [topSchemes, setTopSchemes] = useState([])
const [eligibleSchemes, setEligibleSchemes] = useState([])
const [rejectedSchemes, setRejectedSchemes] = useState([])


  return (
    <div className="relative min-h-screen bg-blue-50">

      {/* TOGGLE BUTTON */}
      <div className="absolute top-6 right-6 z-[1000]">
        <button
          onClick={() => setShowSystemUI(!showSystemUI)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md"
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
      </div>

      {/* SWITCH CONTENT */}
      {showSystemUI ? (
        <SchemesSystemUI
          systemSnapshot={systemSnapshot}
          topSchemes={topSchemes}
          eligibleSchemes={eligibleSchemes}
          rejectedSchemes={rejectedSchemes}
        />

      ) : (
        <RelevantSchemesDisplay
          userProfile={userProfile}
          setSystemSnapshot={setSystemSnapshot}
          setTopSchemes={setTopSchemes}
          setEligibleSchemes={setEligibleSchemes}
          setRejectedSchemes={setRejectedSchemes}
        />
      )}
    </div>
  )
}


export default SchemesPage
