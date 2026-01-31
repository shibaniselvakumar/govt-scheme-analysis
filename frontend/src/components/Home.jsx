import { Link } from 'react-router-dom'
import {
  Shield,
  Users,
  FileText,
  CheckCircle,
  Map,
  BarChart3,
  ArrowRight,
  Star
} from 'lucide-react'

function Home() {
  const features = [
    {
      icon: Users,
      title: 'Personalized Matching',
      description:
        'AI-powered algorithm matches you with schemes based on your profile, location, and eligibility criteria.'
    },
    {
      icon: FileText,
      title: 'Document Verification',
      description:
        'Upload and verify your documents securely with automated validation and guidance.'
    },
    {
      icon: CheckCircle,
      title: 'Step-by-Step Guidance',
      description:
        'Complete application walkthrough with timeline, required documents, and next steps.'
    },
    {
      icon: Map,
      title: 'Scheme Locator',
      description:
        'Find schemes available in your state and district with location-based recommendations.'
    }
  ]

  const stats = [
    { number: '500+', label: 'Government Schemes' },
    { number: '28', label: 'States & UTs Covered' },
    { number: '1M+', label: 'Citizens Helped' },
    { number: '95%', label: 'Success Rate' }
  ]

  return (
    <div className="min-h-screen bg-blue-50 py-12">
      <div className="min-h-screen">

        {/* HERO SECTION */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* LEFT CONTENT */}
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-8">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
                    <Shield className="w-12 h-12 text-blue-600" />
                  </div>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                  Government Scheme
                  <br />
                  <span className="text-blue-200">
                    Eligibility Portal
                  </span>
                </h1>

                <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto lg:mx-0">
                  Discover and apply for government welfare schemes that you qualify for.
                  Powered by AI for accurate matching and seamless application process.
                </p>

                {/* BUTTON */}
                <div className="flex justify-center lg:justify-start">
                  <Link
                    to="/profile"
                    className="
                      bg-blue-600 text-white
                      px-8 py-4 rounded-lg
                      font-semibold text-lg
                      hover:bg-blue-50 hover:text-blue-700
                      transition-all
                      inline-flex items-center gap-2
                      shadow-lg
                    "
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* RIGHT IMAGE */}
              <div className="hidden lg:block">
                <img
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2070&q=80"
                  alt="Government Schemes"
                  className="w-full h-96 object-cover rounded-xl shadow-2xl"
                />
              </div>

            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600">
                Our intelligent platform simplifies the process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-gray-800 text-center mb-12">
              What Citizens Say
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="flex justify-center mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                      className="w-16 h-16 rounded-full border-2 border-green-200"
                      alt="citizen"
                    />
                  </div>

                  <div className="flex justify-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <p className="text-gray-600 text-center mb-3">
                    “This platform helped me find schemes I never knew about.”
                  </p>

                  <div className="text-center font-semibold text-gray-800">
                    Citizen User
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default Home
