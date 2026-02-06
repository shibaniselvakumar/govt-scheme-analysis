import { useState } from 'react'
import HomeCitizen from './HomeCitizen'
import HomeSystemUI from './HomeSystemUI'
import { Cpu, User } from 'lucide-react'

function HomePage() {
  const [showSystemUI, setShowSystemUI] = useState(false)

  return (
    <div className="relative">

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setShowSystemUI(!showSystemUI)}
        className="fixed bottom-6 right-6 z-50
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
      {showSystemUI ? <HomeSystemUI /> : <HomeCitizen />}
    </div>
  )
}

export default HomePage
