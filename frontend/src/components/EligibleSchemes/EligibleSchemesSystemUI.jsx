import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Zap, Filter, BarChart3, ChevronDown, ChevronUp, FileText, Banknote, Users } from 'lucide-react'

function EligibleSchemesSystemUI({ userProfile = {}, schemes = [], eligibleSchemes = [], rejectedSchemes = [] }) {
  const [expandedScheme, setExpandedScheme] = useState(null)

  const totalSchemes = schemes.length
  const eligibleCount = eligibleSchemes.length
  const rejectedCount = rejectedSchemes.length

  const getEligibilityReason = (scheme) => {
    if (scheme.final_decision === 'ELIGIBLE') {
      return 'All criteria satisfied'
    }
    return scheme.reason || 'Does not meet requirements'
  }

  const getMatrixStatus = (matrix) => {
    const statuses = Object.values(matrix || {})
    const failures = statuses.filter(s => s.status === 'FAIL').length
    return {
      total: statuses.length,
      passed: statuses.length - failures,
      failed: failures
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 opacity-10 
        bg-[linear-gradient(to_right,#1e40af_1px,transparent_1px),
             linear-gradient(to_bottom,#1e40af_1px,transparent_1px)]
        bg-[size:48px_48px]" />

      {/* TOP SNAPSHOT BAR */}
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/90 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-6">
            <div className="text-xs font-mono text-blue-300">ELIGIBILITY MATRIX</div>
            <div className="text-sm font-semibold text-slate-100">{userProfile.name || 'USER'}</div>
          </div>

          <div className="flex items-center gap-6 font-mono text-sm text-slate-300">
            <div>Total: <span className="text-blue-300 ml-1">{totalSchemes}</span></div>
            <div>Eligible: <span className="text-green-300 ml-1">{eligibleCount}</span></div>
            <div>Rejected: <span className="text-red-300 ml-1">{rejectedCount}</span></div>
            <div>Match Rate: <span className="text-purple-300 ml-1">
              {totalSchemes > 0 ? Math.round((eligibleCount / totalSchemes) * 100) : 0}%
            </span></div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {/* HEADER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 mb-4 
              px-3 py-1 rounded-full border border-blue-500/40 
              text-xs tracking-widest text-blue-300 bg-blue-500/10">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              ELIGIBILITY ENGINE
            </div>

            <h1 className="text-3xl tracking-[0.2em] text-slate-200">
              VALIDATION REACTOR — ACTIVE
            </h1>

            <div className="mt-6 font-mono text-sm text-slate-400 space-y-2">
              <div>&gt; User profile loaded</div>
              <div>&gt; Eligibility analysis complete</div>
              <div>&gt; Displaying results</div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-blue-500/30 rounded-xl p-6 backdrop-blur">
            <div className="text-xs tracking-widest text-blue-300 mb-4">
              USER PROFILE SNAPSHOT
            </div>

            <div className="space-y-3 font-mono text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Age</span>
                <span className="text-blue-400">{userProfile.age || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span>Gender</span>
                <span className="text-blue-400">{userProfile.gender || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span>State</span>
                <span className="text-blue-400">{userProfile.state || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span>Income</span>
                <span className="text-blue-400">₹{userProfile.monthly_income || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROCESSING VISUALIZATION */}
        <div className="mb-12">
          <div className="text-xs tracking-widest text-blue-300 mb-6">
            SCHEME VALIDATION PIPELINE
          </div>

          <div className="space-y-4">
            {schemes.map((scheme, idx) => {
              const isEligible = eligibleSchemes.some(s => s.scheme_id === scheme.scheme_id || s._id === scheme._id)
              const schemeData = isEligible ? 
                eligibleSchemes.find(s => s.scheme_id === scheme.scheme_id || s._id === scheme._id) :
                rejectedSchemes.find(s => s.scheme_id === scheme.scheme_id || s._id === scheme._id)

              const matrixStatus = getMatrixStatus(schemeData?.eligibility_matrix)
              const schemeId = scheme.scheme_id || scheme._id
              const isExpanded = expandedScheme === schemeId

              return (
                <motion.div
                  key={schemeId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`border rounded-lg transition-all cursor-pointer ${
                    isEligible
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-red-500/40 bg-red-500/5'
                  } ${isExpanded ? 'p-6' : 'p-4'}`}
                >
                  <div className="flex items-start justify-between" onClick={() => setExpandedScheme(isExpanded ? null : schemeId)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {isEligible ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}

                        <h3 className="font-mono text-sm text-slate-200">
                          {scheme.scheme_name || 'SCHEME'}
                        </h3>
                      </div>

                      {schemeData && (
                        <div className="ml-7 text-xs text-slate-400 space-y-2">
                          <div>Status: <span className={isEligible ? 'text-green-400' : 'text-red-400'}>
                            {isEligible ? 'ELIGIBLE' : 'REJECTED'}
                          </span></div>
                          <div>Matrix: {matrixStatus.passed}/{matrixStatus.total} passed</div>
                          <div className="text-slate-500">{getEligibilityReason(schemeData)}</div>
                          
                          {/* ELIGIBILITY MATRIX */}
                          {schemeData.eligibility_matrix && (
                            <div className="mt-3 pt-2 border-t border-slate-700/40">
                              {Object.keys(schemeData.eligibility_matrix).length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(schemeData.eligibility_matrix).map(([key, value]) => (
                                    <div
                                      key={key}
                                      className={`px-2 py-1 rounded text-xs border ${
                                        value.status === 'PASS'
                                          ? 'bg-green-500/10 text-green-300 border-green-500/30'
                                          : 'bg-red-500/10 text-red-300 border-red-500/30'
                                      }`}
                                    >
                                      <span className="font-mono">{key}:</span>
                                      <span className="ml-2">{value.status}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">No matrix data available</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {schemeData && (
                        <div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EXPANDED DETAILS */}
                  {isExpanded && schemeData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 pt-6 border-t border-slate-700/40 space-y-6"
                    >
                      {/* SCHEME DESCRIPTION */}
                      {schemeData.description && (
                        <div>
                          <div className="text-xs tracking-widest text-blue-300 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            DESCRIPTION
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {schemeData.description}
                          </p>
                        </div>
                      )}

                      {/* BENEFITS */}
                      {schemeData.benefits_text && (
                        <div>
                          <div className="text-xs tracking-widest text-green-300 mb-2 flex items-center gap-2">
                            <Banknote className="w-4 h-4" />
                            BENEFITS
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {schemeData.benefits_text}
                          </p>
                        </div>
                      )}

                      {/* ELIGIBILITY DETAILS */}
                      {schemeData.eligibility_text && (
                        <div>
                          <div className="text-xs tracking-widest text-blue-300 mb-2">
                            ELIGIBILITY CRITERIA
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {schemeData.eligibility_text}
                          </p>
                        </div>
                      )}

                      {/* REQUIRED DOCUMENTS */}
                      {schemeData.documents_required_text && (
                        <div>
                          <div className="text-xs tracking-widest text-orange-300 mb-2">
                            REQUIRED DOCUMENTS
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {schemeData.documents_required_text}
                          </p>
                        </div>
                      )}

                      {/* FALLBACK: Show eligibility matrix details if no text fields */}
                      {!schemeData.description && !schemeData.benefits_text && !schemeData.eligibility_text && !schemeData.documents_required_text && (
                        <div className="text-sm text-slate-400">
                          <p className="mb-4">Detailed information not available. Eligibility matrix:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(schemeData.eligibility_matrix || {}).map(([key, value]) => (
                              <div
                                key={key}
                                className={`px-3 py-2 rounded text-xs ${
                                  value.status === 'PASS'
                                    ? 'bg-green-500/10 text-green-300 border border-green-500/30'
                                    : 'bg-red-500/10 text-red-300 border border-red-500/30'
                                }`}
                              >
                                <span className="font-mono">{key}:</span>
                                <span className="ml-2">{value.status}</span>
                                {value.reason && <div className="text-xs mt-1 opacity-80">{value.reason}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ELIGIBILITY MATRIX - Always show */}
                      {schemeData.eligibility_matrix && Object.keys(schemeData.eligibility_matrix).length > 0 && (
                        <div>
                          <div className="text-xs tracking-widest text-purple-300 mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            ELIGIBILITY MATRIX
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(schemeData.eligibility_matrix).map(([key, value]) => (
                              <div
                                key={key}
                                className={`px-3 py-2 rounded text-xs border ${
                                  value.status === 'PASS'
                                    ? 'bg-green-500/10 text-green-300 border-green-500/30'
                                    : 'bg-red-500/10 text-red-300 border-red-500/30'
                                }`}
                              >
                                <div className="font-mono font-semibold">{key}</div>
                                <div className="mt-1">{value.status}</div>
                                {value.reason && (
                                  <div className="text-xs mt-2 opacity-85">{value.reason}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="text-green-400 w-5 h-5" />
              <div className="text-xs tracking-widest text-green-300">ELIGIBLE</div>
            </div>
            <div className="text-3xl font-bold text-green-400">{eligibleCount}</div>
            <div className="text-xs text-green-400/60 mt-2">schemes match your profile</div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="text-red-400 w-5 h-5" />
              <div className="text-xs tracking-widest text-red-300">REJECTED</div>
            </div>
            <div className="text-3xl font-bold text-red-400">{rejectedCount}</div>
            <div className="text-xs text-red-400/60 mt-2">do not meet criteria</div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="text-purple-400 w-5 h-5" />
              <div className="text-xs tracking-widest text-purple-300">MATCH RATE</div>
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {totalSchemes > 0 ? Math.round((eligibleCount / totalSchemes) * 100) : 0}%
            </div>
            <div className="text-xs text-purple-400/60 mt-2">profile coverage</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EligibleSchemesSystemUI