import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  TrendingUp,
  Users,
  MapPin,
  Briefcase
} from 'lucide-react'
import api from '../utils/api'

function RelevantSchemesDisplay({ userProfile, onSchemesSelected }) {
  const navigate = useNavigate()

  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSchemes, setSelectedSchemes] = useState([])
  const [stats, setStats] = useState({
    totalSchemes: 0,
    eligibleSchemes: 0,
    averageMatch: 0
  })

  useEffect(() => {
    const fetchRelevantSchemes = async () => {
      try {
        setLoading(true)

        const response = await api.post('/api/search-schemes', {
          query: '',
          userProfile
        })

        const allSchemes = response.data.top_schemes || []
        const eligibleSchemes = response.data.eligible_schemes || []
        const rejectedSchemes = response.data.rejected_schemes || []

        setSchemes([...eligibleSchemes, ...rejectedSchemes])

        setStats({
          totalSchemes: allSchemes.length,
          eligibleSchemes: eligibleSchemes.length,
          averageMatch:
            allSchemes.length > 0
              ? Math.round((eligibleSchemes.length / allSchemes.length) * 100)
              : 0
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (userProfile) fetchRelevantSchemes()
  }, [userProfile])

  const toggleScheme = (scheme) => {
    if (!scheme.eligible) return

    setSelectedSchemes(prev => {
      const id = scheme.scheme_id || scheme._id
      const exists = prev.find(s => (s.scheme_id || s._id) === id)

      if (exists) {
        return prev.filter(s => (s.scheme_id || s._id) !== id)
      }

      return [...prev, { ...scheme, scheme_id: id }]
    })
  }

  const handleContinue = () => {
    if (selectedSchemes.length === 0) {
      alert('Please select at least one eligible scheme')
      return
    }
    onSchemesSelected(selectedSchemes)
    navigate('/schemes')
  }

  const handleSkip = () => navigate('/schemes')

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            Analyzing Your Profile
          </h2>
          <p className="text-blue-700">
            Finding schemes that match your eligibility…
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
            Based on your profile, these government schemes match your eligibility
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={Search} value={stats.totalSchemes} label="Schemes Analyzed" color="blue" />
          <StatCard icon={CheckCircle2} value={stats.eligibleSchemes} label="Eligible Schemes" color="green" />
          <StatCard icon={TrendingUp} value={`${stats.averageMatch}%`} label="Match Rate" color="purple" />
        </div>

        {/* PROFILE SUMMARY */}
        <div className="bg-white border border-blue-300 hover:border-blue-400 transition rounded-xl shadow p-6 mb-10">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Users className="text-blue-600" />
            Profile Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProfileItem icon={Users} label="Name" value={userProfile.name} color="blue" />
            <ProfileItem icon={MapPin} label="State" value={userProfile.state} color="green" />
            <ProfileItem icon={Briefcase} label="Occupation" value={userProfile.occupation} color="purple" />
            <ProfileItem
              icon={TrendingUp}
              label="Income"
              value={`₹${userProfile.monthly_income}/month`}
              color="orange"
            />
          </div>
        </div>

        {/* SCHEMES */}
        <div className="space-y-6 mb-10">
          {schemes.map((scheme) => {
            const id = scheme.scheme_id || scheme._id
            const selected = selectedSchemes.find(s => (s.scheme_id || s._id) === id)

            return (
              <div
                key={id}
                onClick={() => scheme.eligible && toggleScheme(scheme)}
                className={`rounded-xl p-6 border-2 transition-all duration-200
                  ${
                    scheme.eligible
                      ? selected
                        ? 'border-green-500 bg-green-50'
                        : 'border-blue-300 bg-white hover:border-blue-400'
                      : 'border-red-300 bg-red-50 opacity-70 cursor-not-allowed'
                  }`}
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-900 mb-2">
                      {scheme.scheme_name}
                    </h3>

                    {scheme.description && (
                      <p className="text-blue-700 text-sm mb-2">
                        {scheme.description}
                      </p>
                    )}

                    {scheme.benefits_text && (
                      <p className="text-sm text-gray-600">
                        <strong>Benefits:</strong> {scheme.benefits_text}
                      </p>
                    )}
                  </div>

                  {scheme.eligible ? (
                    selected ? (
                      <CheckCircle2 className="text-green-600" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-blue-400 rounded-full" />
                    )
                  ) : (
                    <XCircle className="text-red-600" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-center gap-4 bg-white border border-blue-300 hover:border-blue-400 transition rounded-xl shadow p-6">
          <button
            onClick={handleContinue}
            disabled={selectedSchemes.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            Continue ({selectedSchemes.length})
          </button>

          <button
            onClick={handleSkip}
            className="border border-blue-400 text-blue-700 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50"
          >
            Skip
          </button>
        </div>
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
    <div className="bg-white border border-blue-300 hover:border-blue-400 transition rounded-xl shadow p-6 text-center">
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
