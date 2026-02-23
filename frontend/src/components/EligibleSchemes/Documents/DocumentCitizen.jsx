import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import DocumentValidationPage from '../../DocumentValidation/DocumentValidationPage'

function DocumentCitizen({ userProfile = {}, onDataUpdate }) {
  const navigate = useNavigate()
  const [selectedSchemes, setSelectedSchemes] = useState([])
  const [eligibilityOutputs, setEligibilityOutputs] = useState({})
  const [loading, setLoading] = useState(true)

  // Get data from sessionStorage or parent props
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('selectedSchemes')
      const eligibility = sessionStorage.getItem('eligibilityOutputs')

      if (stored) {
        setSelectedSchemes(JSON.parse(stored))
      }
      if (eligibility) {
        setEligibilityOutputs(JSON.parse(eligibility))
      }
    } catch (err) {
      console.error('Error loading stored data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleComplete = (data) => {
    console.log('[DOCUMENT_UPLOAD_COMPLETE]', data)

    if (onDataUpdate) {
      onDataUpdate({
        documents: data.documents,
        guidanceData: data.guidanceData
      })
    }

    navigate('/guidance')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      <DocumentValidationPage
        schemes={selectedSchemes}
        eligibilityOutputs={eligibilityOutputs}
        userProfile={userProfile}
        onComplete={handleComplete}
      />
    </motion.div>
  )
}

export default DocumentCitizen
