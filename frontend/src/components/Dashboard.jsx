import { Link } from 'react-router-dom'
import { User, FileText, Map, CheckCircle2, ArrowRight } from 'lucide-react'

function Dashboard({ userProfile, selectedSchemes, guidanceData }) {
  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your application journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/profile" className="card hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Profile</p>
                <p className="font-semibold text-gray-800">
                  {userProfile ? 'Completed' : 'Not Started'}
                </p>
              </div>
            </div>
          </Link>

          <Link to="/schemes" className="card hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Schemes</p>
                <p className="font-semibold text-gray-800">
                  {selectedSchemes?.length || 0} selected
                </p>
              </div>
            </div>
          </Link>

          <Link to="/guidance" className="card hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Guidance</p>
                <p className="font-semibold text-gray-800">
                  {guidanceData ? 'Available' : 'Not Generated'}
                </p>
              </div>
            </div>
          </Link>

          <Link to="/map" className="card hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Map className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Map View</p>
                <p className="font-semibold text-gray-800">View</p>
              </div>
            </div>
          </Link>
        </div>

        {userProfile && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Profile</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-800">{userProfile.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Age</p>
                <p className="font-medium text-gray-800">{userProfile.age}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gender</p>
                <p className="font-medium text-gray-800">{userProfile.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">State</p>
                <p className="font-medium text-gray-800">{userProfile.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Occupation</p>
                <p className="font-medium text-gray-800">{userProfile.occupation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Income</p>
                <p className="font-medium text-gray-800">₹{userProfile.monthly_income}</p>
              </div>
            </div>
          </div>
        )}

        {selectedSchemes && selectedSchemes.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Selected Schemes</h2>
            <div className="space-y-3">
              {selectedSchemes.map((scheme) => (
                <div
                  key={scheme.scheme_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <p className="font-medium text-gray-800">{scheme.scheme_name}</p>
                  <Link
                    to="/guidance"
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View Guidance
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
