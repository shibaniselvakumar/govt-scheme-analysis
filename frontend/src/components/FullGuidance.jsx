import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, CheckCircle2, Clock, ArrowRight, Download, Map,
  AlertCircle, CheckCircle, XCircle, Info
} from 'lucide-react'

function FullGuidance({ data }) {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('missing-docs')

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading guidance...</p>
      </div>
    )
  }

  const {
    missing_documents = [],
    pre_application_steps = [],
    application_steps = [],
    post_application_steps = [],
    timeline = {},
    contact_info = {}
  } = data

  const sections = [
    { id: 'missing-docs', label: 'Missing Documents', icon: AlertCircle },
    { id: 'pre-application', label: 'Pre-Application', icon: Clock },
    { id: 'application', label: 'Application', icon: FileText },
    { id: 'post-application', label: 'Post-Application', icon: CheckCircle }
  ]

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Complete Pathway</h1>
          <p className="text-gray-600">Step-by-step guide to complete your application</p>
        </div>

        {/* Timeline Overview */}
        {timeline.estimated_days && (
          <div className="card bg-gradient-to-r from-blue-50 to-purple-50 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Estimated Timeline</p>
                <p className="text-2xl font-bold text-gray-800">
                  {timeline.estimated_days} days
                </p>
              </div>
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeSection === id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Missing Documents Section */}
          {activeSection === 'missing-docs' && (
            <div className="card">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                Steps to Acquire Missing Documents
              </h2>
              {missing_documents.length > 0 ? (
                <div className="space-y-4">
                  {missing_documents.map((doc, index) => (
                    <div key={index} className="border-l-4 border-orange-500 pl-4 py-2">
                      <h3 className="font-semibold text-gray-800 capitalize mb-2">
                        {doc.document_type?.replace(/_/g, ' ')}
                      </h3>
                      {doc.steps && (
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                          {doc.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      )}
                      {doc.office_location && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Office:</strong> {doc.office_location}
                        </p>
                      )}
                      {doc.estimated_time && (
                        <p className="text-sm text-gray-600">
                          <strong>Estimated Time:</strong> {doc.estimated_time}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">All required documents are ready!</p>
                </div>
              )}
            </div>
          )}

          {/* Pre-Application Steps */}
          {activeSection === 'pre-application' && (
            <div className="card">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                Pre-Application Steps
              </h2>
              <div className="space-y-4">
                {pre_application_steps.length > 0 ? (
                  pre_application_steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
                        <p className="text-gray-700">{step.description}</p>
                        {step.requirements && (
                          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
                            {step.requirements.map((req, i) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No pre-application steps required.</p>
                )}
              </div>
            </div>
          )}

          {/* Application Steps */}
          {activeSection === 'application' && (
            <div className="card">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Application Steps
              </h2>
              <div className="space-y-4">
                {application_steps.length > 0 ? (
                  application_steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
                        <p className="text-gray-700">{step.description}</p>
                        {step.location && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Location:</strong> {step.location}
                          </p>
                        )}
                        {step.documents_needed && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Documents needed:
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {step.documents_needed.map((doc, i) => (
                                <li key={i}>{doc}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No application steps available.</p>
                )}
              </div>
            </div>
          )}

          {/* Post-Application Steps */}
          {activeSection === 'post-application' && (
            <div className="card">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Post-Application Steps
              </h2>
              <div className="space-y-4">
                {post_application_steps.length > 0 ? (
                  post_application_steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
                        <p className="text-gray-700">{step.description}</p>
                        {step.timeline && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Timeline:</strong> {step.timeline}
                          </p>
                        )}
                        {step.tracking_info && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Tracking Information:
                            </p>
                            <p className="text-sm text-gray-600">{step.tracking_info}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No post-application steps available.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        {contact_info && Object.keys(contact_info).length > 0 && (
          <div className="card mt-6 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contact_info.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-800">{contact_info.phone}</p>
                </div>
              )}
              {contact_info.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-800">{contact_info.email}</p>
                </div>
              )}
              {contact_info.website && (
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <a
                    href={contact_info.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {contact_info.website}
                  </a>
                </div>
              )}
              {contact_info.address && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-800">{contact_info.address}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-end">
          <button
            onClick={() => navigate('/map')}
            className="btn-secondary flex items-center gap-2"
          >
            <Map className="w-5 h-5" />
            View Map
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default FullGuidance
