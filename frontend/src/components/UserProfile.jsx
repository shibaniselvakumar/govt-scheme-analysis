import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, ArrowRight } from 'lucide-react'
import axios from 'axios'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
]

const OCCUPATIONS = [
  'Farmer', 'Fisherman', 'Construction Worker', 'Small Business Owner',
  'Teacher', 'Student', 'Housewife', 'Daily Wage Worker', 'Artisan',
  'Self Employed', 'Other'
]

function UserProfile({ onComplete }) {
  const navigate = useNavigate()
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
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.age || formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Valid age is required'
    }
    if (!formData.gender) newErrors.gender = 'Gender is required'
    if (!formData.state) newErrors.state = 'State is required'
    if (!formData.occupation) newErrors.occupation = 'Occupation is required'
    if (!formData.monthly_income || formData.monthly_income < 0) {
      newErrors.monthly_income = 'Valid monthly income is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validate()) {
      const profile = {
        ...formData,
        age: parseInt(formData.age),
        monthly_income: parseFloat(formData.monthly_income)
      }
      
      // Save profile to backend
      try {
        const response = await axios.post('/api/save-profile', profile, {
  headers: { 'Content-Type': 'application/json' }
})

        console.log('Profile saved:', response.data)
        onComplete(profile)
        navigate('/schemes')
      } catch (error) {
        console.error('Error saving profile:', error)
        // Still proceed even if save fails
        onComplete(profile)
        navigate('/schemes')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Build Your Profile</h1>
          <p className="text-gray-600">Tell us about yourself to find the best schemes for you</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className={`input-field ${errors.age ? 'border-red-500' : ''}`}
                placeholder="Enter your age"
                min="1"
                max="120"
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className={`input-field ${errors.gender ? 'border-red-500' : ''}`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State of Residence *
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className={`input-field ${errors.state ? 'border-red-500' : ''}`}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occupation *
            </label>
            <select
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className={`input-field ${errors.occupation ? 'border-red-500' : ''}`}
            >
              <option value="">Select Occupation</option>
              {OCCUPATIONS.map(occ => (
                <option key={occ} value={occ}>{occ}</option>
              ))}
            </select>
            {errors.occupation && <p className="text-red-500 text-sm mt-1">{errors.occupation}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Income (INR) *
            </label>
            <input
              type="number"
              value={formData.monthly_income}
              onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
              className={`input-field ${errors.monthly_income ? 'border-red-500' : ''}`}
              placeholder="Enter monthly income"
              min="0"
              step="0.01"
            />
            {errors.monthly_income && (
              <p className="text-red-500 text-sm mt-1">{errors.monthly_income}</p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            Continue to Scheme Selection
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default UserProfile
