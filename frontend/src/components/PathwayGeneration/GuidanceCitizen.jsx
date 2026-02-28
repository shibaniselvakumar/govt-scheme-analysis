import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, Clock, FileText, ArrowRight, Award, Zap, BookOpen } from 'lucide-react'
import api from '../../utils/api'

// MOCK GUIDANCE DATA FOR TESTING
const MOCK_GUIDANCE_DATA = [
  {
    scheme_id: 'SCHEME_001',
    scheme_name: 'Pradhan Mantri Awas Yojana (Housing for All)',
    guidance: {
      pre_application: [
        'Verify that your household income is below ₹30 lakhs annually',
        'Ensure you own a valid Aadhaar card or government-issued ID',
        'Check if you have not received any housing scheme benefit in the past',
        'Gather documents: Income certificate, property ownership papers, ID proof',
        'Identify the approved lender or housing finance company',
        'Calculate your eligible loan amount based on income'
      ],
      application_steps: [
        'Visit the official PM Awas Yojana website or nearest bank branch',
        'Fill out the application form with accurate personal and financial details',
        'Submit required documents including income certificate and ID proof',
        'Wait for document verification (usually 5-7 days)',
        'Get approval and visit the bank for loan processing',
        'Complete the KYC verification at the bank',
        'Sign the loan agreement and receive the sanction letter',
        'Submit the sanction letter to the property seller'
      ],
      missing_documents: [
        'Income Certificate from Gram Panchayat/Municipal Corporation',
        'Property ownership deed or possession certificate',
        'Bank statement for the last 6 months'
      ],
      post_application: [
        'Monitor your loan status through the online portal',
        'Maintain regular communication with your assigned bank officer',
        'Complete property registration within the specified timeline',
        'Ensure timely payment of EMI after loan disbursal',
        'Keep all documents and receipts for future reference',
        'Attend possession ceremony when property is ready'
      ]
    }
  },
  {
    scheme_id: 'SCHEME_002',
    scheme_name: 'Skill India - National Apprenticeship Promotion Scheme',
    guidance: {
      pre_application: [
        'Confirm you are between 18-35 years old and a citizen of India',
        'Have completed at least 10th standard education',
        'Identify a suitable trade or skill aligned with your interests',
        'Search for apprenticeship providers in your area',
        'Review the eligibility criteria for your chosen trade',
        'Prepare your resume and educational certificates'
      ],
      application_steps: [
        'Register on the Apprenticeship portal or visit an approved training center',
        'Browse available apprenticeship opportunities and select one',
        'Submit your application with required documents',
        'Appear for the selection interview or assessment',
        'Sign the apprenticeship agreement with the training provider',
        'Report on the designated starting date for training',
        'Complete the training period (typically 6-24 months based on trade)'
      ],
      post_application: [
        'Attend training sessions regularly and maintain 80% attendance',
        'Complete assigned projects and practical tasks',
        'Pass the competency assessment at the end of training',
        'Receive the national apprenticeship certificate',
        'Explore job opportunities with partner companies',
        'Continue updating your skills through refresher courses'
      ]
    }
  },
  {
    scheme_id: 'SCHEME_003',
    scheme_name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    guidance: {
      pre_application: [
        'Confirm you are a farmer with cultivable land in your name',
        'Verify you have not received benefits from other agricultural schemes',
        'Gather your land ownership documents or lease deed',
        'Note down your bank account details (preferably in your name)',
        'Check if your state participates in PM-KISAN scheme',
        'Prepare your Aadhaar number and mobile number for registration'
      ],
      application_steps: [
        'Visit your nearest Common Service Center (CSC) or Gram Panchayat office',
        'Provide your land details and agricultural information',
        'Submit your Aadhaar number and bank account information',
        'Fill out the PM-KISAN application form with accurate details',
        'Verify all information with the official',
        'Receive confirmation receipt with your registration details',
        'Wait for approval (usually processed within 1 month)'
      ],
      missing_documents: [],
      post_application: [
        'Check your registration status on the PM-KISAN portal using your Aadhaar',
        'Verify your bank account linkage for fund transfers',
        'Receive ₹2,000 in your account three times per year (every 4 months)',
        'Report any changes in your land ownership immediately',
        'Keep your mobile number and Aadhaar linked to avoid benefit interruption',
        'Contact your local authorities if you do not receive payment within expected time'
      ]
    }
  }
]

function GuidanceCitizen({ userProfile, eligibleSchemes = [], setSystemSnapshot, setGuidanceData }) {
  const [guidanceData, setLocalGuidanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedScheme, setExpandedScheme] = useState(null)
  const [selectedScheme, setSelectedScheme] = useState(null)

  // Load guidance data from props (passed from DocumentUpload via GuidancePage)
  useEffect(() => {
    try {
      setLoading(true)
      setError(null)

      // Use guidance data passed from DocumentUpload if available
      if (Array.isArray(eligibleSchemes) && eligibleSchemes.length > 0) {
        console.log('📋 Using guidance data from backend')
        setLocalGuidanceData(eligibleSchemes)
        setGuidanceData(eligibleSchemes)

        // Extract system snapshot from first scheme if available
        if (eligibleSchemes[0]?._system) {
          setSystemSnapshot(eligibleSchemes[0]._system)
        }
      } else {
        // Fallback to mock data if no schemes provided
        console.log('📋 Loading mock guidance data (fallback)')
        const mockData = MOCK_GUIDANCE_DATA.slice(0, 3)
        setLocalGuidanceData(mockData)
        setGuidanceData(mockData)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading guidance:', err)
      setError('Failed to load guidance pathways')
      setLoading(false)
    }
  }, [eligibleSchemes])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Generating Your Guidance
          </h2>
          <p className="text-slate-600">
            Creating personalized application roadmaps for your eligible schemes…
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-12 border border-red-200 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3 text-center">Error</h2>
          <p className="text-slate-600 text-center">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 via-blue-50 to-white min-h-screen">
      {/* SCHEME DASHBOARD BANNER */}
      {selectedScheme && (
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* LEFT: Scheme Overview */}
              <div className="md:col-span-2">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">{selectedScheme.scheme_name}</h1>
                    <p className="text-blue-100">Scheme ID: {selectedScheme.scheme_id}</p>
                  </div>
                </div>

                {/* Description */}
                {(selectedScheme.description || selectedScheme.scheme_details?.description) && (
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6 backdrop-blur-sm">
                    <p className="text-blue-50 leading-relaxed">
                      {selectedScheme.description || selectedScheme.scheme_details?.description}
                    </p>
                  </div>
                )}

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedScheme.category && (
                    <div className="bg-white bg-opacity-10 rounded-lg p-3">
                      <p className="text-blue-100 text-xs uppercase tracking-wide">Category</p>
                      <p className="text-white font-semibold">{selectedScheme.category}</p>
                    </div>
                  )}
                  {selectedScheme.ministry && (
                    <div className="bg-white bg-opacity-10 rounded-lg p-3">
                      <p className="text-blue-100 text-xs uppercase tracking-wide">Ministry</p>
                      <p className="text-white font-semibold truncate">{selectedScheme.ministry}</p>
                    </div>
                  )}
                  {selectedScheme.max_income && (
                    <div className="bg-white bg-opacity-10 rounded-lg p-3">
                      <p className="text-blue-100 text-xs uppercase tracking-wide">Max Income</p>
                      <p className="text-white font-semibold">{selectedScheme.max_income}</p>
                    </div>
                  )}
                  {selectedScheme.state && (
                    <div className="bg-white bg-opacity-10 rounded-lg p-3">
                      <p className="text-blue-100 text-xs uppercase tracking-wide">State</p>
                      <p className="text-white font-semibold">{selectedScheme.state}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Benefits Card */}
              <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm border border-white border-opacity-20">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-6 h-6 text-yellow-300" />
                  <h3 className="text-lg font-bold">Key Benefits</h3>
                </div>
                <div className="space-y-3">
                  {selectedScheme.scheme_benefits || selectedScheme.benefits_text ? (
                    <p className="text-blue-50 text-sm leading-relaxed">
                      {selectedScheme.scheme_benefits || selectedScheme.benefits_text}
                    </p>
                  ) : (
                    <p className="text-blue-100 text-sm italic">Explore the application process for detailed benefits</p>
                  )}
                </div>

                {/* CTA Button */}
                {selectedScheme.application_url && (
                  <a
                    href={selectedScheme.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg inline-flex items-center justify-center gap-2 transition"
                  >
                    Visit Official Site
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Close Banner Button */}
            <button
              onClick={() => setSelectedScheme(null)}
              className="absolute top-4 right-4 text-white opacity-70 hover:opacity-100 transition"
            >
              <AlertCircle className="w-6 h-6 rotate-45" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-6">
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-700" />
            </div>
            <span className="text-blue-700 font-semibold tracking-wide">PERSONALIZED GUIDANCE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-slate-900">
            Application Roadmaps
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Click on any scheme to view its benefits and details, then follow the personalized steps
          </p>
        </div>

        {/* GUIDANCE CARDS */}
        {guidanceData.length > 0 ? (
          <div className="space-y-8">
            {guidanceData.map((item) => (
              <div
                key={item.scheme_id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition border border-slate-200 overflow-hidden"
              >
                {/* CARD HEADER */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedScheme(item)}
                    className="flex-1 text-left cursor-pointer bg-gradient-to-r from-blue-700 to-blue-600 text-white p-8 hover:from-blue-600 hover:to-blue-500 transition rounded-t-2xl group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:translate-x-1 transition">{item.scheme_name}</h2>
                        {item.scheme_benefits || item.description ? (
                          <p className="text-sm opacity-90 line-clamp-2">
                            {item.scheme_benefits || item.description}
                          </p>
                        ) : null}
                      </div>
                      <Award className="w-6 h-6 text-blue-200 flex-shrink-0 ml-4" />
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setExpandedScheme(
                        expandedScheme === item.scheme_id ? null : item.scheme_id
                      )
                    }
                    className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-8 hover:from-blue-600 hover:to-blue-500 transition rounded-t-2xl flex-shrink-0 flex items-center justify-center"
                  >
                    {expandedScheme === item.scheme_id ? (
                      <ChevronUp className="w-7 h-7" />
                    ) : (
                      <ChevronDown className="w-7 h-7" />
                    )}
                  </button>
                </div>

                {/* EXPANDED CONTENT */}
                {expandedScheme === item.scheme_id && (
                  <div className="p-8 space-y-10">
                    {/* SCHEME DETAILS SECTION */}
                    {(item.description || item.scheme_benefits || item.scheme_details?.description) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-200">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">About This Scheme</h3>
                          <p className="text-slate-700 leading-relaxed">
                            {item.description || item.scheme_details?.description || 'Learn more about this government scheme and how it can benefit you.'}
                          </p>
                        </div>
                        {(item.scheme_benefits || item.scheme_details?.benefits_text) && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Benefits</h3>
                            <p className="text-slate-700 leading-relaxed">
                              {item.scheme_benefits || item.scheme_details?.benefits_text}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {item.guidance && Object.keys(item.guidance).length > 0 ? (
                      <>
                        <GuidanceSection
                          title="Pre-Application Checklist"
                          description="Things you must verify and prepare before starting your application."
                          data={item.guidance?.pre_application || []}
                          accent="blue"
                        />

                        <GuidanceSection
                          title="Application Process"
                          description="Step-by-step instructions to successfully apply for the scheme."
                          data={item.guidance?.application_steps || []}
                          accent="green"
                        />

                        {item.guidance?.missing_documents &&
                          item.guidance.missing_documents.length > 0 && (
                            <GuidanceSection
                              title="Missing Documents"
                              description="Documents that are commonly missing or required during verification."
                              data={item.guidance.missing_documents}
                              accent="red"
                            />
                          )}

                        <GuidanceSection
                          title="Post-Application Guidance"
                          description="What to do after submitting your application."
                          data={item.guidance?.post_application || []}
                          accent="purple"
                        />
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No guidance data available for this scheme.</p>
                        <p className="text-sm mt-2">Please try again or contact support.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-slate-200">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <p className="text-slate-600 text-lg font-medium">
              No eligible schemes found. Please go back and check your eligibility.
            </p>
            <p className="text-slate-500 mt-2">
              Try searching with different criteria or updating your profile information.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

/* ---------- GUIDANCE SECTION COMPONENT ---------- */
function GuidanceSection({ title, description, data = [], accent }) {
  const iconMap = {
    blue: { icon: FileText, color: 'text-blue-700', bg: 'bg-blue-100' },
    green: { icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-100' },
    red: { icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-100' },
    purple: { icon: Clock, color: 'text-purple-700', bg: 'bg-purple-100' },
  }

  const current = iconMap[accent] || iconMap.blue
  const Icon = current.icon

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${current.bg}`}>
          <Icon className={`w-6 h-6 ${current.color}`} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>

      <div className="space-y-4 ml-11">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">
                {index + 1}
              </div>
              <p className="text-slate-700 leading-relaxed pt-0.5">{step}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400 italic ml-4">No information available.</p>
        )}
      </div>
    </div>
  )
}

export default GuidanceCitizen
