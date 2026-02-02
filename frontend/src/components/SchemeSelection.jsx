import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import api from '../utils/api'

function SchemeSelection({ userProfile, onSelect }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [schemes, setSchemes] = useState([])
  const [eligibleSchemes, setEligibleSchemes] = useState([])
  const [rejectedSchemes, setRejectedSchemes] = useState([])
  const [selectedSchemes, setSelectedSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  // Auto-load eligible schemes when component mounts
  useEffect(() => {
  if (!userProfile) return // wait until userProfile is available

  const didRequest = { current: false } // tracks if request already fired

  const loadEligibleSchemes = async () => {
    if (didRequest.current) return // prevent duplicate request in Strict Mode
    didRequest.current = true

    setLoading(true)
    try {
      const response = await api.post('/api/search-schemes', {
        query: 'all', // default placeholder to fetch all eligible schemes
        userProfile
      })

      setSchemes(response.data.top_schemes || [])
      setEligibleSchemes(response.data.eligible_schemes || [])
      setRejectedSchemes(response.data.rejected_schemes || [])
    } catch (error) {
      console.error('Error loading schemes:', error)
      alert('Error loading schemes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  loadEligibleSchemes()
}, [userProfile])


  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const response = await api.post('/api/search-schemes', {
        query,
        userProfile
      })

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
    <div className="min-h-screen bg-blue-50 py-12">
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mb-6 shadow-lg float">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 fade-in">Discover Eligible Schemes</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 slide-up animate-delay-200">Search through our comprehensive database of government welfare schemes tailored to your profile</p>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                alt="Government Schemes Search"
                className="w-full h-80 object-cover rounded-xl shadow-2xl slide-in-right animate-delay-300 hover-rotate"
              />
            </div>
          </div>

          <div className="card mb-6 zoom-in animate-delay-400 card-hover">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 icon-bounce" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field pl-12 focus-pulse hover-scale"
                  placeholder="Search for schemes (e.g., 'Policies for fishermen', 'Education schemes')"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="btn-primary btn-animated flex items-center gap-2 whitespace-nowrap click-bounce hover-bounce"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin heartbeat" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 icon-bounce" />
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

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Loading eligible schemes...</p>
            </div>
          )}

          {schemes.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No schemes found. Try adjusting your search query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchemeSelection
