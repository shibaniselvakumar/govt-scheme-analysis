import { useState, useEffect, useMemo } from 'react'
import {
  Loader2,
  AlertCircle,
  BookOpen,
  Sparkles,
  Search,
  ExternalLink,
  Building2,
  MapPin,
  BadgeCheck,
  IndianRupee,
  ListChecks,
  FileWarning,
  Clock3,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

const FALLBACK_GUIDANCE_DATA = [
  {
    scheme_id: 'DEMO_001',
    scheme_name: 'Sample Guidance Pathway',
    description: 'Guidance will appear here when scheme pathways are generated.',
    guidance: {
      pre_application: ['Verify profile details and gather core documents.'],
      application_steps: ['Submit your application through the official channel.'],
      missing_documents: ['Upload mandatory identity and income documents if pending.'],
      post_application: ['Track status regularly and keep acknowledgement number ready.'],
    },
  },
]

const SECTION_CONFIG = {
  pre_application: {
    label: 'Pre-Application',
    subtitle: 'Preparation and checklist',
    icon: ListChecks,
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-600',
  },
  application_steps: {
    label: 'Application',
    subtitle: 'Execution workflow',
    icon: ArrowRight,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-600',
  },
  missing_documents: {
    label: 'Missing Docs',
    subtitle: 'Required before submission',
    icon: FileWarning,
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    iconBg: 'bg-rose-600',
  },
  post_application: {
    label: 'Post-Application',
    subtitle: 'Follow-up and tracking',
    icon: Clock3,
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    iconBg: 'bg-violet-600',
  },
}

function normalizeItem(item) {
  const guidance = item?.guidance || {}
  return {
    ...item,
    scheme_id: item?.scheme_id || item?._id || `SCHEME_${Math.random().toString(36).slice(2, 8)}`,
    scheme_name: item?.scheme_name || 'Unnamed Scheme',
    guidance: {
      pre_application: Array.isArray(guidance.pre_application) ? guidance.pre_application : [],
      application_steps: Array.isArray(guidance.application_steps) ? guidance.application_steps : [],
      missing_documents: Array.isArray(guidance.missing_documents) ? guidance.missing_documents : [],
      post_application: Array.isArray(guidance.post_application) ? guidance.post_application : [],
    },
  }
}

function getCompletionScore(item) {
  const g = item.guidance
  const sections = [
    g.pre_application?.length > 0,
    g.application_steps?.length > 0,
    g.post_application?.length > 0,
  ]
  const completed = sections.filter(Boolean).length
  return Math.round((completed / sections.length) * 100)
}

function GuidanceCitizen({ userProfile, eligibleSchemes = [], setSystemSnapshot, setGuidanceData }) {
  const [localGuidanceData, setLocalGuidanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchemeId, setSelectedSchemeId] = useState(null)
  const [activeSection, setActiveSection] = useState('pre_application')

  useEffect(() => {
    try {
      setLoading(true)
      setError(null)

      if (Array.isArray(eligibleSchemes) && eligibleSchemes.length > 0) {
        const cleaned = eligibleSchemes.map(normalizeItem)
        setLocalGuidanceData(cleaned)
        setGuidanceData(cleaned)
        if (cleaned[0]?._system) {
          setSystemSnapshot(cleaned[0]._system)
        }
      } else {
        setLocalGuidanceData(FALLBACK_GUIDANCE_DATA.map(normalizeItem))
        setGuidanceData(FALLBACK_GUIDANCE_DATA.map(normalizeItem))
      }
    } catch (err) {
      console.error('Error loading guidance:', err)
      setError('Failed to load guidance pathways')
    } finally {
      setLoading(false)
    }
  }, [eligibleSchemes, setGuidanceData, setSystemSnapshot])

  useEffect(() => {
    if (!selectedSchemeId && localGuidanceData.length > 0) {
      setSelectedSchemeId(localGuidanceData[0].scheme_id)
    }
  }, [localGuidanceData, selectedSchemeId])

  const filteredSchemes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return localGuidanceData
    return localGuidanceData.filter((item) => {
      const blob = [
        item.scheme_name,
        item.description,
        item.category,
        item.ministry,
        item.state,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [localGuidanceData, searchTerm])

  const selectedScheme = useMemo(
    () => filteredSchemes.find((item) => item.scheme_id === selectedSchemeId) || filteredSchemes[0] || null,
    [filteredSchemes, selectedSchemeId]
  )

  const metrics = useMemo(() => {
    const schemeCount = localGuidanceData.length
    const totalSteps = localGuidanceData.reduce((acc, item) => {
      const g = item.guidance
      return acc + g.pre_application.length + g.application_steps.length + g.post_application.length
    }, 0)
    const totalMissing = localGuidanceData.reduce((acc, item) => acc + item.guidance.missing_documents.length, 0)
    const avgReadiness = schemeCount
      ? Math.round(localGuidanceData.reduce((acc, item) => acc + getCompletionScore(item), 0) / schemeCount)
      : 0
    return { schemeCount, totalSteps, totalMissing, avgReadiness }
  }, [localGuidanceData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center px-6">
          <Loader2 className="w-14 h-14 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900">Building your guidance workspace</h2>
          <p className="text-slate-600 mt-2">Preparing deployable guidance cards and actionable pathways...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Guidance module unavailable</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-white text-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="absolute top-48 -right-20 h-72 w-72 rounded-full bg-indigo-200/70 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="bg-gradient-to-r from-blue-700 to-blue-600 border border-blue-300 rounded-3xl p-8 shadow-xl text-white">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 bg-white/15 text-white text-xs font-semibold tracking-wide mb-4">
                <Sparkles className="w-4 h-4" />
                AI GUIDANCE MODULE
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight text-white">Personalized Scheme Guidance Workspace</h1>
              <p className="text-blue-100 mt-3 max-w-3xl">
                Professional decision-ready guidance with structured pre-checks, application workflows, and post-submission actions.
              </p>
            </div>

            <div className="bg-white/15 border border-white/30 rounded-2xl p-4 min-w-[260px] backdrop-blur-sm">
              <div className="text-xs text-blue-100 mb-2">PROFILE SNAPSHOT</div>
              <div className="text-sm text-white space-y-1">
                <p><span className="text-blue-100">Citizen:</span> {userProfile?.name || 'N/A'}</p>
                <p><span className="text-blue-100">Occupation:</span> {userProfile?.occupation || 'N/A'}</p>
                <p><span className="text-blue-100">State:</span> {userProfile?.state || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <MetricCard label="Eligible Schemes" value={metrics.schemeCount} tone="blue" />
            <MetricCard label="Action Steps" value={metrics.totalSteps} tone="emerald" />
            <MetricCard label="Missing Docs" value={metrics.totalMissing} tone="rose" />
            <MetricCard label="Readiness Score" value={`${metrics.avgReadiness}%`} tone="violet" />
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <aside className="xl:col-span-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sticky top-6 shadow-sm">
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search schemes..."
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3 max-h-[68vh] overflow-auto pr-1">
                {filteredSchemes.map((item) => {
                  const isActive = selectedScheme?.scheme_id === item.scheme_id
                  const readiness = getCompletionScore(item)
                  return (
                    <button
                      key={item.scheme_id}
                      onClick={() => {
                        setSelectedSchemeId(item.scheme_id)
                        setActiveSection('pre_application')
                      }}
                      className={`w-full text-left rounded-xl p-4 border transition ${
                        isActive
                          ? 'bg-blue-50 border-blue-300 shadow-md'
                          : 'bg-white border-slate-200 hover:border-blue-200'
                      }`}
                    >
                      <h3 className="font-semibold text-sm text-slate-900">{item.scheme_name}</h3>
                      <p className="text-xs text-slate-500 mt-1">ID: {item.scheme_id}</p>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Readiness</span>
                          <span>{readiness}%</span>
                        </div>
                        <div className="h-1.5 rounded bg-slate-200 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${readiness}%` }} />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <section className="xl:col-span-8 space-y-6">
            {selectedScheme ? (
              <>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedScheme.scheme_name}</h2>
                      <p className="text-slate-600 mt-2 leading-relaxed">
                        {selectedScheme.description || 'Structured guidance for this scheme is available below.'}
                      </p>
                    </div>
                    {selectedScheme.application_url && (
                      <a
                        href={selectedScheme.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        Official portal
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                    <InfoChip icon={BadgeCheck} label="Category" value={selectedScheme.category || 'General'} />
                    <InfoChip icon={Building2} label="Ministry" value={selectedScheme.ministry || 'Not specified'} />
                    <InfoChip icon={MapPin} label="State" value={selectedScheme.state || 'All India'} />
                    <InfoChip icon={IndianRupee} label="Income cap" value={selectedScheme.max_income || 'As per norms'} />
                    <InfoChip icon={BookOpen} label="Scheme ID" value={selectedScheme.scheme_id} />
                    <InfoChip icon={CheckCircle2} label="Status" value="Guidance Ready" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SECTION_CONFIG).map(([key, config]) => {
                      const count = selectedScheme.guidance[key]?.length || 0
                      const Icon = config.icon
                      const isActive = activeSection === key
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveSection(key)}
                          className={`inline-flex items-center gap-2 border rounded-xl px-4 py-2 text-sm transition ${
                            isActive ? 'bg-blue-600 text-white border-blue-600' : `${config.badge} bg-opacity-100`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {config.label}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-black/10">{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <GuidanceSection
                  title={SECTION_CONFIG[activeSection].label}
                  subtitle={SECTION_CONFIG[activeSection].subtitle}
                  steps={selectedScheme.guidance[activeSection] || []}
                  iconBg={SECTION_CONFIG[activeSection].iconBg}
                />

                {activeSection !== 'missing_documents' && selectedScheme.guidance.missing_documents?.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2 text-rose-700">
                      <FileWarning className="w-5 h-5" />
                      <h3 className="font-semibold">Pending document actions</h3>
                    </div>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-rose-700">
                      {selectedScheme.guidance.missing_documents.map((doc, idx) => (
                        <li key={`${doc}-${idx}`}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-600 shadow-sm">
                No matching scheme found.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, tone = 'blue' }) {
  const toneMap = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-800',
    emerald: 'from-green-50 to-green-100 border-green-200 text-green-800',
    rose: 'from-rose-50 to-rose-100 border-rose-200 text-rose-800',
    violet: 'from-violet-50 to-violet-100 border-violet-200 text-violet-800',
  }
  return (
    <div className={`rounded-xl border bg-gradient-to-r p-4 ${toneMap[tone] || toneMap.blue}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1 text-slate-900">{value}</p>
    </div>
  )
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
      <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-sm text-slate-800 truncate">{value}</p>
    </div>
  )
}

function GuidanceSection({ title, subtitle, steps, iconBg }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      {steps.length > 0 ? (
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={`${step}-${idx}`} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/80">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-semibold">
                {idx + 1}
              </div>
              <p className="text-slate-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 italic">No steps available for this section.</p>
      )}
    </div>
  )
}

export default GuidanceCitizen
