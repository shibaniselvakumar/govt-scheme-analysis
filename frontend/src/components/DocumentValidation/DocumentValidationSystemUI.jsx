import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileCheck,
  Activity,
  Zap,
  Database,
  Shield,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

function DocumentValidationSystemUI({
  validationStatus = {},
  uploadedFiles = {},
  requiredDocs = {},
  schemes = [],
  userProfile = {}
}) {
  const [expandedScheme, setExpandedScheme] = useState(null)
  const [phase, setPhase] = useState('IDLE')
  const [activeDocuments, setActiveDocuments] = useState(0)

  // Calculate metrics
  useEffect(() => {
    const totalUploaded = Object.keys(uploadedFiles).length
    setActiveDocuments(totalUploaded)

    if (totalUploaded > 0) {
      setPhase('PROCESSING')
      const timer = setTimeout(() => setPhase('ANALYZING'), 1500)
      return () => clearTimeout(timer)
    } else {
      setPhase('IDLE')
    }
  }, [uploadedFiles])

  const getValidationStats = () => {
    let total = 0
    let passed = 0
    let failed = 0

    Object.entries(validationStatus).forEach(([_, status]) => {
      total++
      if (status.status === 'valid') passed++
      else failed++
    })

    return { total, passed, failed }
  }

  const getTotalRequiredDocs = () => {
    let count = 0
    Object.values(requiredDocs).forEach(docs => {
      count += Object.keys(docs).length
    })
    return count
  }

  const stats = getValidationStats()
  const totalRequired = getTotalRequiredDocs()
  const completionRate = totalRequired > 0 ? Math.round((stats.passed / totalRequired) * 100) : 0

  const phaseStates = {
    IDLE: { text: 'IDLE', color: 'text-slate-400', bg: 'bg-slate-500/20' },
    PROCESSING: { text: 'PROCESSING', color: 'text-yellow-400', bg: 'bg-yellow-500/20', pulse: true },
    ANALYZING: { text: 'ANALYZING', color: 'text-blue-400', bg: 'bg-blue-500/20', pulse: true },
  }

  const currentPhase = phaseStates[phase] || phaseStates.IDLE

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 opacity-10 
        bg-[linear-gradient(to_right,#1e40af_1px,transparent_1px),
             linear-gradient(to_bottom,#1e40af_1px,transparent_1px)]
        bg-[size:48px_48px]" />

      {/* TOP STATUS BAR */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-7xl mx-auto px-6 py-6"
      >
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/90 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-6">
            <div className="text-xs font-mono text-blue-300">DOCUMENT VALIDATION MATRIX</div>
            <div className="text-sm font-semibold text-slate-100">{userProfile.name || 'SYSTEM'}</div>
          </div>

          <div className="flex items-center gap-6 font-mono text-sm text-slate-300">
            <div>Required: <span className="text-blue-300 ml-1">{totalRequired}</span></div>
            <div>Uploaded: <span className="text-green-300 ml-1">{stats.total}</span></div>
            <div>Valid: <span className="text-emerald-300 ml-1">{stats.passed}</span></div>
            <div>Invalid: <span className="text-red-300 ml-1">{stats.failed}</span></div>
            <div>
              Completion: <span className={`ml-1 ${completionRate === 100 ? 'text-green-300' : 'text-yellow-300'}`}>
                {completionRate}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* HEADER & PHASE INDICATOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 mb-4 
              px-3 py-1 rounded-full border border-blue-500/40 
              text-xs tracking-widest text-blue-300 bg-blue-500/10">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              VALIDATION ENGINE
            </div>

            <h1 className="text-3xl tracking-[0.2em] text-slate-200 mb-4">
              OCR PROCESSOR — {currentPhase.text}
            </h1>

            <div className="font-mono text-sm text-slate-400 space-y-2">
              <div>&gt; Tesseract OCR initialized</div>
              <div>&gt; Fuzzy matching enabled (75% threshold)</div>
              <div>&gt; {activeDocuments} document(s) in queue</div>
              <div>&gt; Processing document content...</div>
            </div>
          </motion.div>

          {/* PHASE INDICATOR CIRCLE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center items-center"
          >
            <div className="relative w-40 h-40">
              {/* Outer ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-500/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              />

              {/* Middle ring */}
              <motion.div
                className="absolute inset-2 rounded-full border border-blue-500/20"
                animate={{ rotate: -180 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              />

              {/* Center circle */}
              <div className={`absolute inset-0 rounded-full flex items-center justify-center ${currentPhase.bg} border border-blue-500/50`}>
                <FileCheck className={`w-16 h-16 ${currentPhase.color} ${currentPhase.pulse ? 'animate-pulse' : ''}`} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* METRICS GRID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16"
        >
          {[
            {
              icon: FileCheck,
              label: 'Documents Validated',
              value: stats.total,
              subtext: `of ${totalRequired} required`,
              color: 'from-blue-600 to-blue-400'
            },
            {
              icon: CheckCircle2,
              label: 'Valid Documents',
              value: stats.passed,
              subtext: `${Math.round((stats.passed / totalRequired) * 100) || 0}% success rate`,
              color: 'from-green-600 to-green-400'
            },
            {
              icon: AlertCircle,
              label: 'Invalid Documents',
              value: stats.failed,
              subtext: 'Requires resubmission',
              color: 'from-red-600 to-red-400'
            },
            {
              icon: Clock,
              label: 'Processing',
              value: activeDocuments > 0 ? 'ACTIVE' : 'IDLE',
              subtext: phase,
              color: activeDocuments > 0 ? 'from-yellow-600 to-yellow-400' : 'from-slate-600 to-slate-400'
            }
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`bg-gradient-to-br ${metric.color} bg-opacity-10 border border-blue-500/30 rounded-xl p-6`}
            >
              <metric.icon className="text-blue-300 mb-4 w-6 h-6" />
              <div className="text-xs text-slate-300 tracking-widest mb-2">{metric.label}</div>
              <div className="text-3xl font-bold text-slate-100 mb-1">{metric.value}</div>
              <div className="text-xs text-slate-400">{metric.subtext}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* DOCUMENT VALIDATION BREAKDOWN */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-mono tracking-widest text-slate-300 mb-6">SCHEME VALIDATION DETAILS</h2>

          {schemes.map((scheme, idx) => {
            const schemeId = scheme.scheme_id || scheme._id
            const schemeDocs = requiredDocs[schemeId] || {}
            const schemeValidations = Object.entries(validationStatus).filter(
              ([key]) => key.startsWith(`${schemeId}_`)
            )

            const isExpanded = expandedScheme === schemeId

            return (
              <motion.div
                key={schemeId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="bg-slate-900/60 border border-blue-500/30 rounded-xl overflow-hidden hover:border-blue-500/60 transition-colors"
              >
                {/* SCHEME HEADER */}
                <button
                  onClick={() => setExpandedScheme(isExpanded ? null : schemeId)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4 text-left flex-1">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                      <FileCheck className="text-blue-400 w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="font-mono text-sm text-blue-300 mb-1">SCHEME ID: {schemeId}</div>
                      <div className="text-lg font-semibold text-slate-100">{scheme.scheme_name}</div>
                    </div>
                  </div>

                  {/* QUICK STATS */}
                  <div className="hidden md:flex items-center gap-6 mr-4 font-mono text-sm text-slate-300">
                    <div>
                      Submitted: <span className="text-blue-300 ml-1">{schemeValidations.length}</span>
                    </div>
                    <div>
                      Valid: <span className="text-green-300 ml-1">
                        {schemeValidations.filter(([_, v]) => v.status === 'valid').length}
                      </span>
                    </div>
                  </div>

                  {/* EXPAND ICON */}
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                    {isExpanded ? (
                      <ChevronUp className="text-blue-400" />
                    ) : (
                      <ChevronDown className="text-blue-400" />
                    )}
                  </motion.div>
                </button>

                {/* EXPANDED CONTENT */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-blue-500/20 bg-slate-900/30"
                    >
                      <div className="p-6 space-y-4">
                        {Object.entries(schemeDocs).map(([docType, docInfo]) => {
                          const validationKey = `${schemeId}_${docType}`
                          const validation = validationStatus[validationKey]
                          const file = uploadedFiles[validationKey]

                          return (
                            <motion.div
                              key={docType}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex items-start justify-between"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-mono text-xs text-blue-300">{docType.toUpperCase()}</span>
                                  {docInfo.mandatory && (
                                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">MANDATORY</span>
                                  )}
                                  {file && (
                                    <span className="text-xs bg-slate-600/40 text-slate-300 px-2 py-1 rounded">UPLOADED</span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-300">{docInfo.description}</div>
                                {file && (
                                  <div className="text-xs text-slate-400 mt-2 truncate">
                                    📄 {file.name}
                                  </div>
                                )}
                              </div>

                              {/* STATUS INDICATOR */}
                              <div className="ml-4 flex flex-col items-end gap-2">
                                {validation ? (
                                  validation.status === 'valid' ? (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="text-green-400 w-5 h-5" />
                                      <span className="text-xs font-mono text-green-300">VALID</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <XCircle className="text-red-400 w-5 h-5" />
                                      <span className="text-xs font-mono text-red-300">INVALID</span>
                                    </div>
                                  )
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Clock className="text-slate-400 w-5 h-5" />
                                    <span className="text-xs font-mono text-slate-400">PENDING</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>

        {/* VALIDATION PIPELINE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-slate-900/40 border border-blue-500/30 rounded-xl p-8"
        >
          <h2 className="text-xl font-mono tracking-widest text-slate-300 mb-8">VALIDATION PIPELINE</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: 1, label: 'File Upload', desc: 'Multipart FormData' },
              { step: 2, label: 'OCR Extract', desc: 'Tesseract.js' },
              { step: 3, label: 'Text Parse', desc: 'Character extraction' },
              { step: 4, label: 'Fuzzy Match', desc: '75% similarity' },
              { step: 5, label: 'Validation', desc: 'Pass/Fail decision' }
            ].map((pipeline, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-center"
              >
                <div className="inline-block w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mb-3 mx-auto">
                  <span className="font-bold text-white">{pipeline.step}</span>
                </div>
                <div className="font-mono text-sm font-semibold text-slate-100 mb-1">{pipeline.label}</div>
                <div className="text-xs text-slate-400">{pipeline.desc}</div>
                {i < 4 && (
                  <div className="mt-3 text-blue-400">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DocumentValidationSystemUI
