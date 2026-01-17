import { useState, useEffect } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const response = await axios.post('/api/search-schemes',
  {
    query,
    userProfile
  },
  {
    headers: { 'Content-Type': 'application/json' }
  }
)

      setSchemes(response.data.top_schemes || [])
      setEligibleSchemes(response.data.eligible_schemes || [])
      setRejectedSchemes(response.data.rejected_schemes || [])
    } catch (error) {
      console.error('Error searching schemes:', error)
      alert('Error searching schemes. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const toggleScheme = (scheme) => {
    setSelectedSchemes(prev => {
      // Handle both scheme_id and _id formats
      const schemeId = scheme.scheme_id || scheme._id
      const exists = prev.find(s => (s.scheme_id || s._id) === schemeId)
      if (exists) {
        return prev.filter(s => (s.scheme_id || s._id) !== schemeId)
      } else {
        // Ensure scheme has scheme_id
        const schemeToAdd = {
          ...scheme,
          scheme_id: scheme.scheme_id || scheme._id
        }
        return [...prev, schemeToAdd]
      }
    })
  }

  const handleContinue = () => {
    if (selectedSchemes.length === 0) {
      alert('Please select at least one scheme')
      return
    }
    onSelect(selectedSchemes)
    navigate('/documents')
  }

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Find Your Schemes</h1>
          <p className="text-gray-600">Search and select schemes that match your profile</p>
        </div>

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

        {schemes.length > 0 && (
          <div className="space-y-6">
            {eligibleSchemes.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  Eligible Schemes ({eligibleSchemes.length})
                </h2>
                <div className="grid gap-4">
                  {eligibleSchemes.map((scheme) => {
                    const schemeId = scheme.scheme_id || scheme._id
                    const isSelected = selectedSchemes.find(s => (s.scheme_id || s._id) === schemeId)
                    return (
                      <div
                        key={schemeId}
                        className={`card cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-blue-600 bg-blue-50'
                            : 'hover:shadow-xl'
                        }`}
                        onClick={() => toggleScheme(scheme)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                              {scheme.scheme_name}
                            </h3>
                            {scheme.description && (
                              <p className="text-gray-600 line-clamp-2">{scheme.description}</p>
                            )}
                            {scheme.benefits_text && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                                Benefits: {scheme.benefits_text.substring(0, 100)}...
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            {isSelected ? (
                              <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            ) : (
                              <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {rejectedSchemes.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  Not Eligible ({rejectedSchemes.length})
                </h2>
                <div className="grid gap-4">
                  {rejectedSchemes.map((scheme) => (
                    <div
                      key={scheme.scheme_id}
                      className="card opacity-60"
                    >
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {scheme.scheme_name}
                      </h3>
                      {scheme.reason && (
                        <p className="text-red-600 text-sm">Reason: {scheme.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

        {schemes.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Enter a search query to find schemes</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SchemeSelection
