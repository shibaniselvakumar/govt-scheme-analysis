import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, ArrowRight } from 'lucide-react'
import api from '../utils/api'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Delhi',
  'Jammu and Kashmir','Ladakh','Puducherry'
]

const OCCUPATIONS = [
  'Farmer','Fisherman','Construction Worker','Small Business Owner',
  'Teacher','Student','Housewife','Daily Wage Worker','Artisan',
  'Self Employed','Other'
]

function UserProfile({ onComplete }) {
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    state: '',
    occupation: '',
    monthly_income: ''
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!formData.name) e.name = 'Name required'
    if (!formData.age || formData.age < 1) e.age = 'Valid age required'
    if (!formData.gender) e.gender = 'Gender required'
    if (!formData.state) e.state = 'State required'
    if (!formData.occupation) e.occupation = 'Occupation required'
    if (!formData.monthly_income) e.monthly_income = 'Income required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const profile = {
      ...formData,
      age: Number(formData.age),
      monthly_income: Number(formData.monthly_income)
    }

    try {
      await api.post('/api/save-profile', profile)
    } catch (err) {}

    onComplete(profile)
    navigate('/relevant-schemes')
  }

  return (
    <div className="min-h-screen bg-blue-50 py-14">

      {/* INTRO SECTION */}
      {!showForm && (
        <div className="max-w-5xl mx-auto text-center animate-fadeIn">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="text-white w-12 h-12" />
          </div>

          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            Create Your Citizen Profile
          </h1>

          <p className="text-blue-700 mb-8 max-w-2xl mx-auto">
            Provide your details to discover government schemes tailored to your eligibility
          </p>

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-semibold transition-all"
          >
            Create Profile
          </button>
        </div>
      )}

      {/* FORM SECTION */}
      {showForm && (
        <div className="max-w-2xl mx-auto animate-slideUp">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-blue-300 rounded-xl shadow-xl p-8 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-blue-900 text-center mb-4">
              Personal Information
            </h2>

            {/* Name */}
            <div>
              <label className="text-sm text-gray-700">Full Name *</label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700">Age *</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Gender *</label>
                <select
                  className="input-field"
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* State */}
            <div>
              <label className="text-sm text-gray-700">State *</label>
              <select
                className="input-field"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label className="text-sm text-gray-700">Occupation *</label>
              <select
                className="input-field"
                value={formData.occupation}
                onChange={e => setFormData({ ...formData, occupation: e.target.value })}
              >
                <option value="">Select Occupation</option>
                {OCCUPATIONS.map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Income */}
            <div>
              <label className="text-sm text-gray-700">Monthly Income *</label>
              <input
                type="number"
                className="input-field"
                value={formData.monthly_income}
                onChange={e =>
                  setFormData({ ...formData, monthly_income: e.target.value })
                }
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default UserProfile
