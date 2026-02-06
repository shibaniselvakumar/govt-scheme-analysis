import { useState } from 'react'
import ProfileCitizen from './ProfileCitizen'
import ProfileSystemUI from './ProfileSystemUI'
import { Cpu, User } from 'lucide-react'

function ProfilePage({ onComplete }) {
  const [showSystemUI, setShowSystemUI] = useState(false)

  return (
    <div className="relative min-h-screen">

      {/* TOGGLE BUTTON — SAME PATTERN AS HOME */}
      <button
        onClick={() => setShowSystemUI(!showSystemUI)}
        className="fixed bottom-6 right-6 z-[9999]
          bg-blue-600 hover:bg-blue-500
          text-white px-5 py-3 rounded-full
          flex items-center gap-2 shadow-xl transition"
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

      {/* VIEW SWITCH */}
      {showSystemUI ? (
        <ProfileSystemUI />
      ) : (
        <ProfileCitizen onComplete={onComplete} />
      )}

    </div>
  )
}

export default ProfilePage
