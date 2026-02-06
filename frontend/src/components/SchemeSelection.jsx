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



 const handleSearch = async () => {
  if (!query.trim()) return
  setLoading(true)
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
    setLoading(false)
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100 py-12">
  <div className="max-w-7xl mx-auto px-6 space-y-12">

    {/* HEADER */}
    <div className="text-center space-y-4">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-900">
        Your Eligibility Results
      </h1>
      <p className="text-blue-700 max-w-3xl mx-auto text-lg">
        Based on the profile you provided, we’ve evaluated government schemes
        you may qualify for.
      </p>
    </div>

    {/* SUMMARY PANEL */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl border border-green-200 p-6 shadow-md">
        <p className="text-sm text-green-700">Eligible Schemes</p>
        <p className="text-3xl font-bold text-green-800">
          {eligibleSchemes.length}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-md">
        <p className="text-sm text-red-700">Not Eligible</p>
        <p className="text-3xl font-bold text-red-800">
          {rejectedSchemes.length}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-md">
        <p className="text-sm text-blue-700">Profile Match</p>
        <p className="text-3xl font-bold text-blue-800">
          High
        </p>
      </div>
    </div>

    {/* SEARCH */}
    <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-lg">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Refine schemes (education, housing, agriculture...)"
            className="input-field pl-12"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-medium flex items-center gap-2"
        >
          {searching ? <Loader2 className="animate-spin" /> : <Search />}
          Refine
        </button>
      </div>
    </div>

    {/* ELIGIBLE SCHEMES */}
    {eligibleSchemes.length > 0 && (
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-green-800 flex items-center gap-2">
          <CheckCircle2 />
          Eligible for You
        </h2>

        <div className="grid gap-6">
          {eligibleSchemes.map(scheme => {
            const id = scheme.scheme_id || scheme._id
            const selected = selectedSchemes.find(s => (s.scheme_id || s._id) === id)

            return (
              <div
                key={id}
                onClick={() => toggleScheme(scheme)}
                className={`cursor-pointer rounded-2xl border p-6 transition-all
                  ${selected
                    ? 'border-blue-600 bg-blue-50 shadow-xl'
                    : 'border-gray-200 bg-white hover:shadow-lg'
                  }`}
              >
                <div className="flex justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {scheme.scheme_name}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {scheme.description}
                    </p>
                  </div>

                  <div className="flex items-center">
                    {selected
                      ? <CheckCircle2 className="text-blue-600 w-6 h-6" />
                      : <div className="w-6 h-6 border-2 rounded-full" />
                    }
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )}

    {/* REJECTED SCHEMES */}
    {rejectedSchemes.length > 0 && (
      <section className="space-y-4 opacity-80">
        <h2 className="text-xl font-medium text-red-700 flex items-center gap-2">
          <XCircle />
          Not Eligible
        </h2>

        <div className="grid gap-4">
          {rejectedSchemes.map(scheme => (
            <div
              key={scheme.scheme_id}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <p className="font-medium text-gray-800">
                {scheme.scheme_name}
              </p>
              <p className="text-sm text-red-600">
                {scheme.reason}
              </p>
            </div>
          ))}
        </div>
      </section>
    )}
  </div>

  {/* BOTTOM ACTION */}
  {selectedSchemes.length > 0 && (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg">
      <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
        <p className="text-gray-700">
          <strong>{selectedSchemes.length}</strong> scheme(s) selected
        </p>
        <button
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          Continue
          <ArrowRight />
        </button>
      </div>
    </div>
  )}
</div>

  )
}

export default SchemeSelection
