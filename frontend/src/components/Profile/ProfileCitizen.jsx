import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  ArrowRight,
  ShieldCheck,
  Info,
  MapPin,
  Briefcase,
  IndianRupee
} from 'lucide-react'
import api from '../../utils/api'

const DEV_MODE = true


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

function ProfileCitizen({ onComplete }) {
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

    let profile

    if (DEV_MODE) {
      profile = {
        name: "Test User",
        age: 35,
        gender: "Female",
        state: "Uttar Pradesh",
        occupation: "Fisherman",
        monthly_income: 12000
      }
    } else {
      if (!validate()) return
      profile = {
        ...formData,
        age: Number(formData.age),
        monthly_income: Number(formData.monthly_income)
      }
    }

  onComplete(profile)
  navigate('/relevant-schemes')
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">

      {/* HERO / CONTEXT */}
      {!showForm && (
        <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 
              rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              Citizen Onboarding
            </div>

            <h1 className="text-5xl font-bold text-blue-900 mb-6 leading-tight">
              One Profile. <br />
              <span className="text-blue-600">
                All Schemes You Deserve.
              </span>
            </h1>

            <p className="text-lg text-blue-800 max-w-xl mb-10">
              Government benefits are often missed due to lack of clarity.
              This platform helps you understand what you are eligible for —
              clearly, correctly, and without confusion.
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white 
                px-10 py-4 rounded-xl font-semibold text-lg
                shadow-lg hover:shadow-xl transition-all"
            >
              Begin Profile Setup
            </button>
          </div>

          {/* RIGHT — VALUE PANELS */}
          <div className="space-y-6">
            {[
              {
                icon: MapPin,
                title: 'Location-aware',
                desc: 'Considers central and state-specific schemes'
              },
              {
                icon: Briefcase,
                title: 'Occupation-specific',
                desc: 'Understands livelihood-based eligibility'
              },
              {
                icon: ShieldCheck,
                title: 'Privacy-first',
                desc: 'No submission without your explicit consent'
              }
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm"
              >
                <item.icon className="text-blue-500 mb-3" />
                <h3 className="font-semibold text-blue-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-blue-700">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FORM SECTION */}
      {showForm && (
        <section className="max-w-4xl mx-auto px-6 py-20 animate-slideUp">

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-2xl p-12 space-y-10"
          >

            {/* FORM HEADER */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl 
                flex items-center justify-center mx-auto mb-6">
                <User className="text-white w-10 h-10" />
              </div>

              <h2 className="text-3xl font-bold text-blue-900 mb-2">
                Citizen Profile
              </h2>
              <p className="text-blue-600">
                This information helps us guide you accurately
              </p>
            </div>

            {/* BASIC IDENTITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="input-field mt-2"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Age *
                </label>
                <input
                  type="number"
                  className="input-field mt-2"
                  value={formData.age}
                  onChange={e =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                />
              </div>

            </div>

            {/* DEMOGRAPHICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Gender *
                </label>
                <select
                  className="input-field mt-2"
                  value={formData.gender}
                  onChange={e =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  State *
                </label>
                <select
                  className="input-field mt-2"
                  value={formData.state}
                  onChange={e =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Occupation *
                </label>
                <select
                  className="input-field mt-2"
                  value={formData.occupation}
                  onChange={e =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {OCCUPATIONS.map(o => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* INCOME */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Monthly Income (₹) *
              </label>
              <div className="relative mt-2">
                <IndianRupee className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  className="input-field pl-9"
                  value={formData.monthly_income}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      monthly_income: e.target.value
                    })
                  }
                />
              </div>
            </div>

            {/* TRUST FOOTER */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-blue-800 flex gap-3">
              <Info className="w-5 h-5 mt-0.5" />
              Your information is used only to check eligibility.
              No scheme application is submitted automatically.
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 
                text-white py-4 rounded-xl font-semibold text-lg
                flex items-center justify-center gap-2"
            >
              Discover Schemes For Me
              <ArrowRight />
            </button>

          </form>
        </section>
      )}
    </div>
  )
}

export default ProfileCitizen
