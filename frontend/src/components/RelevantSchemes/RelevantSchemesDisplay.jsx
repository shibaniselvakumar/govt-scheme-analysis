import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, TrendingUp, Users, MapPin, Briefcase } from 'lucide-react'
import api from '../../utils/api'

function RelevantSchemesDisplay({ userProfile,
  setSystemSnapshot,
  setTopSchemes,
  setEligibleSchemes,
  setRejectedSchemes }) {
  const navigate = useNavigate()

  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [stats, setStats] = useState({
    totalSchemes: 0,
    averageMatch: 0
  })

  // Fetch relevant schemes
  const fetchRelevantSchemes = async (searchQuery = '') => {
    try {
      setLoading(true)
      setSearching(true)

      const response = await api.post('/api/search-schemes', {
        query: searchQuery || 'all',
        userProfile
      })
      setTopSchemes(response.data.top_schemes || [])
      setEligibleSchemes(response.data.eligible_schemes || [])
      setRejectedSchemes(response.data.rejected_schemes || [])
      setSystemSnapshot(response.data._system || {})



      const allSchemes = response.data.top_schemes || []
      const eligibleSchemes = response.data.eligible_schemes || []

      setSchemes(allSchemes)
      setStats({
        totalSchemes: allSchemes.length,
        averageMatch: allSchemes.length > 0
          ? Math.round((eligibleSchemes.length / allSchemes.length) * 100)
          : 0
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }



  const handleSearch = () => fetchRelevantSchemes(query)
  const handleContinue = () => navigate('/schemes')

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            Analyzing Your Profile
          </h2>
          <p className="text-blue-700">
            Finding schemes that match your profile…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 py-10">
      <div className="max-w-7xl mx-auto px-4">

        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-3">
            Your Relevant Schemes
          </h1>
          <p className="text-blue-700 max-w-3xl mx-auto">
            Based on your profile, these government schemes are most relevant to you
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <StatCard icon={Search} value={stats.totalSchemes} label="Schemes Retrieved" color="blue" />
          <StatCard icon={TrendingUp} value={`${stats.averageMatch}%`} label="Profile Match" color="purple" />
        </div>

        {/* PROFILE SUMMARY */}
        <div className="bg-white border border-blue-300 rounded-xl shadow p-6 mb-10">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Users className="text-blue-600" /> Profile Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProfileItem icon={Users} label="Name" value={userProfile.name} color="blue" />
            <ProfileItem icon={MapPin} label="State" value={userProfile.state} color="green" />
            <ProfileItem icon={Briefcase} label="Occupation" value={userProfile.occupation} color="purple" />
            <ProfileItem icon={TrendingUp} label="Income" value={`₹${userProfile.monthly_income}/month`} color="orange" />
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-lg mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search schemes (education, housing, agriculture...)"
                className="input-field pl-12"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-medium flex items-center gap-2"
            >
              {searching ? <Loader2 className="animate-spin" /> : <Search />}
              Search
            </button>
          </div>
        </div>

       {/* SCHEMES LIST */}
{!loading && query.trim() && schemes.length > 0 && (
  <div className="space-y-6">
    {schemes.map((scheme) => (
      <SchemeCard key={scheme.scheme_id || scheme._id} scheme={scheme} />
    ))}
  </div>
)}

{/* Optional: show "No schemes found" if search returns empty */}
{!loading && query.trim() && schemes.length === 0 && (
  <p className="text-center text-gray-500 mt-6">No schemes found for "{query}"</p>
)}


        {/* CONTINUE BUTTON */}
        <div className="flex justify-center mt-12">
          <button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- SCHEME CARD ---------------- */
function SchemeCard({ scheme }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition border border-gray-200">
      <h3 className="text-xl font-bold text-blue-900 mb-2">{scheme.scheme_name}</h3>

      {/* Description */}
      {scheme.description && (
        <p className={`text-gray-700 text-sm mb-2 ${!expanded ? 'line-clamp-2' : ''}`}>
          {scheme.description}
        </p>
      )}

      {/* Benefits */}
      {scheme.benefits_text && (
        <ul className={`text-gray-600 text-sm list-disc list-inside mb-2 ${!expanded ? 'line-clamp-2' : ''}`}>
          {scheme.benefits_text.split('. ').map((point, i) =>
            point ? <li key={i}>{point.trim()}.</li> : null
          )}
        </ul>
      )}

      {/* Learn More Toggle */}
      {(scheme.description?.length > 100 || scheme.benefits_text?.length > 100) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 text-sm font-semibold mt-1 hover:underline"
        >
          {expanded ? 'Show Less' : 'Learn More'}
        </button>
      )}

      {/* Badges */}
      <div className="flex gap-2 mt-3">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
          Government Scheme
        </span>
        {scheme.eligible && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
            Relevant to You
          </span>
        )}
      </div>
    </div>
  )
}

/* ---------------- SMALL COMPONENTS ---------------- */
function StatCard({ icon: Icon, value, label, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  }

  return (
    <div className="bg-white border border-blue-300 rounded-xl shadow p-6 text-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${colors[color]}`}>
        <Icon />
      </div>
      <div className="text-3xl font-bold text-blue-900">{value}</div>
      <div className="text-blue-700">{label}</div>
    </div>
  )
}

function ProfileItem({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[color]}`}>
        <Icon />
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-medium text-blue-900">{value}</div>
      </div>
    </div>
  )
}

export default RelevantSchemesDisplay
