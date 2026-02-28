import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, FileText, CheckCircle2, AlertCircle, BarChart3, ChevronDown, ChevronUp, Activity, Gauge, Shield, Clock, TrendingUp } from 'lucide-react'

// Helper component for displaying metrics
function MetricCard({ label, value, color = 'slate' }) {
  const colorStyles = {
    green: 'bg-green-500/10 border-green-500/30 text-green-300',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    red: 'bg-red-500/10 border-red-500/30 text-red-300',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    slate: 'bg-slate-900/40 border-slate-500/30 text-slate-300'
  }

  return (
    <div className={`${colorStyles[color]} border rounded-lg p-4`}>
      <div className="text-xs text-slate-400 mb-2 font-mono">{label}</div>
      <div className="text-lg font-semibold font-mono">{value}</div>
    </div>
  )
}

function GuidanceSystemUI({
  userProfile = {},
  systemSnapshot = {},
  guidanceData = [],
  eligibleSchemes = []
}) {
  const [expandedScheme, setExpandedScheme] = useState(null)
  const [phase, setPhase] = useState('INIT')
  const [agents, setAgents] = useState([])
  const [currentTraceIndex, setCurrentTraceIndex] = useState(-1)

  // Extract metrics from system snapshot
  const interaction_id = systemSnapshot?.interaction_id || '—'
  const active_phase = systemSnapshot?.active_phase || 'PATHWAY_GENERATION'
  const status = systemSnapshot?.status || 'PROCESSING'
  const metrics = systemSnapshot?.metrics || {}
  const trace = systemSnapshot?.trace || []
  const execution_log = systemSnapshot?.execution_log || {}
  const document_validation = systemSnapshot?.document_validation || {}
  
  const processing_time = metrics.processing_time_s || '0.00'
  const total_schemes = eligibleSchemes.length
  const guidance_generated = guidanceData.length
  const total_steps = metrics.total_steps || 0
  const guidance_sections = metrics.guidance_sections || 0

  // Initialize phase animation
  useEffect(() => {
    if (!guidanceData.length) return

    setPhase('IGNITION')

    const t1 = setTimeout(() => setPhase('PROCESSING'), 1000)
    const t2 = setTimeout(() => setPhase('GENERATING'), 3000)
    const t3 = setTimeout(() => setPhase('COMPLETE'), 5000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [guidanceData])

  // Build agent list from trace
  useEffect(() => {
    const traceAgents = []
    trace.forEach(t => {
      const agent = t.node || 'UNKNOWN'
      if (!traceAgents.includes(agent)) {
        traceAgents.push(agent)
      }
    })

    if (systemSnapshot?.active_agent && !traceAgents.includes(systemSnapshot.active_agent)) {
      traceAgents.push(systemSnapshot.active_agent)
    }

    setAgents(traceAgents.length > 0 ? traceAgents : ['PATHWAY_GENERATION_AGENT'])
    setCurrentTraceIndex(-1)
  }, [systemSnapshot])

  // Animate trace progression
  useEffect(() => {
    if (!trace.length) return

    let i = 0
    setPhase('IGNITION')

    const interval = setInterval(() => {
      setCurrentTraceIndex(i)
      i += 1

      if (i >= trace.length) {
        clearInterval(interval)
        setPhase('COMPLETE')
      }
    }, 600)

    return () => clearInterval(interval)
  }, [trace])

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* GRID BACKGROUND */}
      <div
        className="absolute inset-0 opacity-10 
        bg-[linear-gradient(to_right,#1e40af_1px,transparent_1px),
             linear-gradient(to_bottom,#1e40af_1px,transparent_1px)]
        bg-[size:48px_48px]"
      />

      {/* TOP SNAPSHOT BAR */}
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/90 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg overflow-x-auto">
          <div className="flex items-center gap-6 min-w-fit">
            <div className="text-xs font-mono text-blue-300">PATHWAY</div>
            <div className="text-sm font-semibold text-slate-100">{interaction_id}</div>
            <div className="text-xs font-mono text-slate-400">Phase</div>
            <div className="text-sm text-blue-200">{active_phase}</div>
          </div>

          <div className="flex items-center gap-6 font-mono text-sm text-slate-300 min-w-fit ml-4">
            <div>Schemes: <span className="text-blue-300 ml-1">{total_schemes}</span></div>
            <div>Guidance: <span className="text-green-300 ml-1">{guidance_generated}</span></div>
            <div>Time: <span className="text-purple-300 ml-1">{processing_time}</span></div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {/* HEADER SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <div
              className="inline-flex items-center gap-2 mb-4 
              px-3 py-1 rounded-full border border-blue-500/40 
              text-xs tracking-widest text-blue-300 bg-blue-500/10"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              GUIDANCE GENERATOR
            </div>

            <h1 className="text-3xl tracking-[0.2em] text-slate-200">
              PATHWAY ENGINE — ACTIVE
            </h1>

            <div className="mt-6 font-mono text-sm text-slate-400 space-y-2">
              <div>&gt; User profile loaded</div>
              <div>&gt; Eligible schemes identified</div>
              <div>&gt; Pathways generated</div>
              <div>&gt; System ready</div>
            </div>
          </div>

          {/* USER PROFILE SNAPSHOT */}
          <div className="bg-slate-900/40 border border-blue-500/30 rounded-xl p-6 backdrop-blur">
            <div className="text-xs tracking-widest text-blue-300 mb-4">
              USER PROFILE SNAPSHOT
            </div>

            <div className="space-y-3 font-mono text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Name</span>
                <span className="text-blue-400">{userProfile.name || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span>Age</span>
                <span className="text-blue-400">{userProfile.age || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span>State</span>
                <span className="text-blue-400">{userProfile.state || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span>Occupation</span>
                <span className="text-blue-400">{userProfile.occupation || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span>Income</span>
                <span className="text-blue-400">₹{userProfile.monthly_income || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AGENT TRACE VISUALIZATION */}
        <div className="mb-12">
          <div className="text-xs tracking-widest text-blue-300 mb-6">
            PROCESSING TRACE
          </div>

          <div className="flex items-center gap-3">
            {agents.length > 0 ? (
              agents.map((agent, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: currentTraceIndex >= idx ? 1 : 0.8,
                    opacity: currentTraceIndex >= idx ? 1 : 0.4
                  }}
                  transition={{ duration: 0.3 }}
                  className={`px-4 py-2 rounded-lg font-mono text-xs border transition-all ${
                    currentTraceIndex >= idx
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                      : 'bg-slate-800/40 border-slate-700 text-slate-500'
                  }`}
                >
                  {agent.split('_').pop()}
                </motion.div>
              ))
            ) : (
              <div className="text-slate-500 text-sm">No trace data available</div>
            )}
          </div>
        </div>

        {/* PHASE STATUS */}
        <div className="mb-12">
          <div className="text-xs tracking-widest text-purple-300 mb-4">
            SYSTEM PHASE
          </div>

          <div className="bg-slate-900/40 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  phase === 'COMPLETE' ? 'bg-green-400' : 'bg-yellow-400'
                }`}
              />
              <span className="font-mono text-sm text-slate-300">{phase}</span>
            </div>
          </div>
        </div>

        {/* GUIDANCE PATHWAYS DISPLAY */}
        <div className="mb-12">
          <div className="text-xs tracking-widest text-green-300 mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            GENERATED PATHWAYS
          </div>

          <div className="space-y-4">
            {guidanceData.length > 0 ? (
              guidanceData.map((item, idx) => {
                const schemeId = item.scheme_id
                const isExpanded = expandedScheme === schemeId
                const hasGuidance =
                  item.guidance &&
                  (item.guidance.pre_application?.length > 0 ||
                    item.guidance.application_steps?.length > 0 ||
                    item.guidance.post_application?.length > 0)

                return (
                  <motion.div
                    key={schemeId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`border rounded-lg transition-all cursor-pointer ${
                      hasGuidance
                        ? 'border-green-500/40 bg-green-500/5'
                        : 'border-yellow-500/40 bg-yellow-500/5'
                    } ${isExpanded ? 'p-6' : 'p-4'}`}
                    onClick={() =>
                      setExpandedScheme(isExpanded ? null : schemeId)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {hasGuidance ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                          )}

                          <h3 className="font-mono text-sm text-slate-200">
                            {item.scheme_name || 'SCHEME'}
                          </h3>
                        </div>

                        <div className="ml-7 text-xs text-slate-400 space-y-2">
                          <div>
                            Status:{' '}
                            <span className={hasGuidance ? 'text-green-400' : 'text-yellow-400'}>
                              {hasGuidance ? 'GENERATED' : 'PROCESSING'}
                            </span>
                          </div>

                          {/* GUIDANCE SUMMARY */}
                          {item.guidance && (
                            <div className="mt-3 pt-2 border-t border-slate-700/40">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                  <span className="font-mono">
                                    Pre: {item.guidance.pre_application?.length || 0}
                                  </span>
                                </div>
                                <div className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-300 border border-green-500/30">
                                  <span className="font-mono">
                                    App: {item.guidance.application_steps?.length || 0}
                                  </span>
                                </div>
                                <div className="px-2 py-1 rounded text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30">
                                  <span className="font-mono">
                                    Post: {item.guidance.post_application?.length || 0}
                                  </span>
                                </div>
                              </div>
                              {item.guidance.missing_documents?.length > 0 && (
                                <div className="mt-2 px-2 py-1 rounded text-xs bg-red-500/10 text-red-300 border border-red-500/30">
                                  <span className="font-mono">
                                    Missing: {item.guidance.missing_documents.length}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-blue-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                    </div>

                    {/* EXPANDED GUIDANCE DETAILS */}
                    {isExpanded && item.guidance && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-6 border-t border-slate-700/40 space-y-6"
                      >
                        {/* PRE-APPLICATION */}
                        <GuidanceBlock
                          title="PRE-APPLICATION"
                          icon={FileText}
                          data={item.guidance.pre_application}
                          color="blue"
                        />

                        {/* APPLICATION STEPS */}
                        <GuidanceBlock
                          title="APPLICATION STEPS"
                          icon={Zap}
                          data={item.guidance.application_steps}
                          color="green"
                        />

                        {/* MISSING DOCUMENTS */}
                        {item.guidance.missing_documents?.length > 0 && (
                          <GuidanceBlock
                            title="MISSING DOCUMENTS"
                            icon={AlertCircle}
                            data={item.guidance.missing_documents}
                            color="red"
                          />
                        )}

                        {/* POST-APPLICATION */}
                        <GuidanceBlock
                          title="POST-APPLICATION"
                          icon={CheckCircle2}
                          data={item.guidance.post_application}
                          color="purple"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })
            ) : (
              <div className="text-sm text-slate-400">No guidance data available</div>
            )}
          </div>
        </div>

        {/* DETAILED METRICS PANELS */}
        {Object.keys(metrics).length > 0 && (
          <div className="mb-12 space-y-6">
            {/* Performance Metrics */}
            <div>
              <div className="text-xs tracking-widest text-green-300 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                PERFORMANCE METRICS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="Processing Time" value={`${metrics.processing_time_s || 0}s`} color="green" />
                <MetricCard label="Agent Time" value={`${metrics.agent_time_s || 0}s`} color="green" />
                <MetricCard label="System Health" value={metrics.system_health || '—'} color="green" />
              </div>
            </div>

            {/* Guidance Quality Metrics */}
            <div>
              <div className="text-xs tracking-widest text-blue-300 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                GUIDANCE QUALITY
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard label="Sections" value={metrics.guidance_sections || 0} color="blue" />
                <MetricCard label="Total Steps" value={metrics.total_steps || 0} color="blue" />
                <MetricCard label="Characters" value={metrics.total_characters || 0} color="blue" />
                <MetricCard label="Avg Step Length" value={`${metrics.avg_step_length || 0} chars`} color="blue" />
              </div>
            </div>

            {/* Document Validation Metrics */}
            <div>
              <div className="text-xs tracking-widest text-purple-300 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                DOCUMENT VALIDATION
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard label="Total Docs" value={metrics.total_documents || 0} color="purple" />
                <MetricCard label="Passed" value={metrics.passed_documents || 0} color="green" />
                <MetricCard label="Failed" value={metrics.failed_documents || 0} color="red" />
                <MetricCard label="Pass Rate" value={`${metrics.document_pass_rate || 0}%`} color="purple" />
              </div>
            </div>

            {/* Scheme & User Information */}
            <div>
              <div className="text-xs tracking-widest text-cyan-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                SCHEME & USER INFORMATION
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-cyan-500/30 rounded-lg p-4">
                  <div className="text-xs text-cyan-300 mb-2 font-mono">SCHEME</div>
                  <div className="space-y-1 text-sm text-slate-300">
                    <div><span className="text-slate-500">ID:</span> {metrics.scheme_id}</div>
                    <div><span className="text-slate-500">Name:</span> {metrics.scheme_name}</div>
                    <div><span className="text-slate-500">Complexity:</span> {metrics.pathway_complexity}</div>
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-cyan-500/30 rounded-lg p-4">
                  <div className="text-xs text-cyan-300 mb-2 font-mono">USER PROFILE</div>
                  <div className="space-y-1 text-sm text-slate-300">
                    <div><span className="text-slate-500">Age:</span> {metrics.user_profile?.age}</div>
                    <div><span className="text-slate-500">State:</span> {metrics.user_profile?.state}</div>
                    <div><span className="text-slate-500">Occupation:</span> {metrics.user_profile?.occupation}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility & Pathway Analysis */}
            <div>
              <div className="text-xs tracking-widest text-yellow-300 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                PATHWAY ANALYSIS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="Eligibility Status" value={metrics.eligibility_status || '—'} color="yellow" />
                <MetricCard label="Eligibility Score" value={metrics.eligibility_score || 0} color="yellow" />
                <MetricCard label="Completeness" value={`${metrics.guidance_completeness || 0}%`} color="yellow" />
              </div>
            </div>

            {/* Execution Log */}
            {Object.keys(execution_log).length > 0 && (
              <div>
                <div className="text-xs tracking-widest text-indigo-300 mb-4">EXECUTION LOG</div>
                <div className="bg-slate-900/40 border border-indigo-500/30 rounded-lg p-4 space-y-2">
                  {Object.entries(execution_log).map(([phase, desc]) => (
                    <div key={phase} className="text-sm text-slate-300 font-mono">
                      <span className="text-indigo-300">{phase}:</span> {desc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Validation Matrix */}
            {document_validation.matrix && Object.keys(document_validation.matrix).length > 0 && (
              <div>
                <div className="text-xs tracking-widest text-pink-300 mb-4">DOCUMENT VALIDATION MATRIX</div>
                <div className="bg-slate-900/40 border border-pink-500/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(document_validation.matrix).map(([name, details]) => (
                      <div key={name} className={`p-3 rounded border text-xs ${
                        details.status === 'PASS' 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <div className="font-mono font-semibold text-slate-200">{name}</div>
                        <div className={details.status === 'PASS' ? 'text-green-300' : 'text-red-300'}>
                          {details.status}
                        </div>
                        {details.reason && <div className="text-slate-400 mt-1">{details.reason}</div>}
                      </div>
                    ))}
                  </div>
                  {document_validation.summary && (
                    <div className="mt-4 text-xs text-slate-300 border-t border-slate-700 pt-3">
                      {document_validation.summary}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* GUIDANCE BLOCK COMPONENT */
function GuidanceBlock({ title, icon: Icon, data = [], color }) {
  const colorMap = {
    blue: 'text-blue-300',
    green: 'text-green-300',
    red: 'text-red-300',
    purple: 'text-purple-300'
  }

  return (
    <div>
      <div className={`text-xs tracking-widest ${colorMap[color]} mb-3 flex items-center gap-2`}>
        <Icon className="w-4 h-4" />
        {title}
      </div>

      <div className="space-y-2">
        {data && data.length > 0 ? (
          data.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
              <div className="text-slate-500 font-mono flex-shrink-0">
                {idx + 1}.
              </div>
              <div>{item}</div>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-500">No data available</div>
        )}
      </div>
    </div>
  )
}

export default GuidanceSystemUI
