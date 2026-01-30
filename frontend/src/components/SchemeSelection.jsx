import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'

function SchemeSelection({ userProfile, onSelect }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [schemes, setSchemes] = useState([])
  const [eligibleSchemes, setEligibleSchemes] = useState([])
  const [rejectedSchemes, setRejectedSchemes] = useState([])
  const [selectedSchemes, setSelectedSchemes] = useState([])
  const [eligibilityOutputs, setEligibilityOutputs] = useState({})
  const [searching, setSearching] = useState(false)

  // ---------------- SEARCH ----------------
  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const response = await axios.post(
        '/api/search-schemes',
        { query, userProfile },
        { headers: { 'Content-Type': 'application/json' } }
      )

      setSchemes(response.data.top_schemes || [])
      setEligibleSchemes(response.data.eligible_schemes || [])
      setRejectedSchemes(response.data.rejected_schemes || [])

      // Store eligibility outputs per scheme
      const outputs = {}
      (response.data.eligible_schemes || []).forEach(s => {
        const schemeId = s.scheme_id || s._id
        outputs[schemeId] = s.eligibility_output
      })
      setEligibilityOutputs(outputs)
    } catch (error) {
      console.error('Error searching schemes:', error)
      alert('Error searching schemes. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  // ---------------- TOGGLE SCHEME ----------------
  const toggleScheme = (scheme) => {
    const schemeId = scheme.scheme_id || scheme._id
    const exists = selectedSchemes.find(s => (s.scheme_id || s._id) === schemeId)

    if (exists) {
      setSelectedSchemes(prev => prev.filter(s => (s.scheme_id || s._id) !== schemeId))
    } else {
      setSelectedSchemes(prev => [...prev, { ...scheme, scheme_id: schemeId }])
    }
  }

  // ---------------- CONTINUE ----------------
  const handleContinue = () => {
    if (selectedSchemes.length === 0) {
      alert('Please select at least one scheme')
      return
    }

    // Call the onSelect prop with selected schemes and eligibility outputs
    onSelect(selectedSchemes, eligibilityOutputs)

    navigate('/documents')
  }

  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Find Your Schemes</h1>
          <p className="text-gray-600">Search and select schemes that match your profile</p>
        </div>

        {/* Search Box */}
        <div className="card mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field pl-12"
                placeholder="Search for schemes (e.g., 'Policies for fishermen', 'Education schemes')"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Eligible Schemes */}
        {eligibleSchemes.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Eligible Schemes ({eligibleSchemes.length})
            </h2>
            <div className="grid gap-4">
              {eligibleSchemes.map(scheme => {
                const schemeId = scheme.scheme_id || scheme._id
                const isSelected = selectedSchemes.find(s => (s.scheme_id || s._id) === schemeId)
                return (
                  <div
                    key={schemeId}
                    className={`card cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-blue-600 bg-blue-50' : 'hover:shadow-xl'
                    }`}
                    onClick={() => toggleScheme(scheme)}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{scheme.scheme_name}</h3>
                    {scheme.description && <p className="text-gray-600 line-clamp-2">{scheme.description}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rejected Schemes */}
        {rejectedSchemes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" />
              Not Eligible ({rejectedSchemes.length})
            </h2>
            <div className="grid gap-4">
              {rejectedSchemes.map(s => (
                <div key={s.scheme_id || s._id} className="card opacity-60">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{s.scheme_name}</h3>
                  {s.reason && <p className="text-red-600 text-sm">Reason: {s.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Continue Bar */}
        {selectedSchemes.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <p className="text-gray-700">
                <span className="font-semibold">{selectedSchemes.length}</span> scheme(s) selected
              </p>
              <button onClick={handleContinue} className="btn-primary flex items-center gap-2">
                Continue to Document Upload
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SchemeSelection
