import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ExecutionConsole from "./ExecutionConsole";
import AgentHero from "./AgentHero";


function SchemesSystemUI({ topSchemes = [], systemSnapshot, eligibleSchemes = [], rejectedSchemes = [] }) {
  const [phase, setPhase] = useState("INIT");
  const [agents, setAgents] = useState([])
  const [currentTraceIndex, setCurrentTraceIndex] = useState(-1)
  const [mover, setMover] = useState({ from: null, to: null, key: 0 })

  // Safe pulls from snapshot (backend provides query + schemes_found currently)
  const similarity = systemSnapshot?.metrics?.avg_similarity ?? 0.72
  const retrievalTime = systemSnapshot?.metrics?.retrieval_time ?? 0.84
  const schemesFound = systemSnapshot?.metrics?.schemes_found ?? topSchemes.length
  const trace = systemSnapshot?.trace || []

  useEffect(() => {
    if (!topSchemes.length) return;

    setPhase("IGNITION");

    const t1 = setTimeout(() => setPhase("SCANNING"), 1000);
    const t2 = setTimeout(() => setPhase("STABILIZING"), 3000);
    const t3 = setTimeout(() => setPhase("STABLE"), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [topSchemes]);

  // Build agent nodes from system trace
  useEffect(() => {
    const trace = systemSnapshot?.trace || []
    const unique = []
    trace.forEach(t => {
      const name = t.node || 'UNKNOWN'
      if (!unique.includes(name)) unique.push(name)
    })

    // always include active agent if present
    if (systemSnapshot?.active_agent && !unique.includes(systemSnapshot.active_agent)) {
      unique.push(systemSnapshot.active_agent)
    }

    setAgents(unique)
    setCurrentTraceIndex(-1)
  }, [systemSnapshot])

  // Step through trace events to animate interactions
  useEffect(() => {
    const trace = systemSnapshot?.trace || []
    if (!trace.length) return

    let i = 0
    setPhase('IGNITION')
    const interval = setInterval(() => {
      setCurrentTraceIndex(i)
      // kickoff mover for visible agent-to-agent transitions
      const prev = trace[i - 1]
      const cur = trace[i]
      if (prev && cur && prev.node !== cur.node) {
        setMover({ from: prev.node, to: cur.node, key: Date.now() })
      }
      i += 1
      if (i > trace.length) {
        clearInterval(interval)
        setPhase('STABLE')
      }
    }, 700)

    return () => clearInterval(interval)
  }, [systemSnapshot?.trace])

  // Define the four primary agents (always shown) and map trace nodes into them
  const mainAgents = ['POLICY_RETRIEVER_AGENT','ELIGIBILITY_AGENT','DOCUMENT_VALIDATION_AGENT','PATHWAY_GENERATION_AGENT']

  // helper: map arbitrary trace node name to one of the main agents for visualization
  const mapNodeToMain = (node) => {
    if (!node) return 'POLICY_RETRIEVER_AGENT'
    const n = node.toString().toUpperCase()
    if (n.includes('POLICY') || n.includes('RETRIEV')) return 'POLICY_RETRIEVER_AGENT'
    if (n.includes('ELIG') || n.includes('ELIGIBILITY')) return 'ELIGIBILITY_AGENT'
    if (n.includes('DOC') || n.includes('DOCUMENT')) return 'DOCUMENT_VALIDATION_AGENT'
    if (n.includes('PATH') || n.includes('PATHWAY')) return 'PATHWAY_GENERATION_AGENT'
    return 'POLICY_RETRIEVER_AGENT'
  }

  // Precompute horizontal positions for main agents (hero panel)
  const spacing = 160
  const agentPositions = mainAgents.map((name, i) => {
    const mid = (mainAgents.length - 1) / 2
    const x = (i - mid) * spacing
    const y = 0
    return { name, i, x, y }
  })

  const connectionPaths = agentPositions.map(p => {
    const x0 = 300
    const y0 = 200
    const x1 = 300 + p.x
    const y1 = 200 + p.y
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const qx = cx * 1.02
    const qy = cy * 0.92
    const d = `M ${x0} ${y0} Q ${qx} ${qy} ${x1} ${y1}`
    return { key: p.name, d }
  })

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
            <div className="text-xs font-mono text-blue-300">INTERACTION</div>
            <div className="text-sm font-semibold text-slate-100">{systemSnapshot?.interaction_id || '—'}</div>
            <div className="text-xs font-mono text-slate-400">Phase</div>
            <div className="text-sm text-blue-200">{systemSnapshot?.active_phase || 'IDLE'}</div>
          </div>

          <div className="flex items-center gap-6 font-mono text-sm text-slate-300">
            <div>Top-K: <span className="text-blue-300 ml-1">{topSchemes.length}</span></div>
            <div>Found: <span className="text-blue-300 ml-1">{schemesFound}</span></div>
            <div>Eligible: <span className="text-green-300 ml-1">{eligibleSchemes.length}</span></div>
            <div>Rejected: <span className="text-red-300 ml-1">{rejectedSchemes.length}</span></div>
            <div>Query: <span className="text-slate-200 ml-1">{systemSnapshot?.metrics?.query || '-'}</span></div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-6">

        {/* ================= HEADER ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">

          <div>
            <div className="inline-flex items-center gap-2 mb-4 
              px-3 py-1 rounded-full border border-blue-500/40 
              text-xs tracking-widest text-blue-300 bg-blue-500/10">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              RETRIEVAL ENGINE
            </div>

            <h1 className="text-3xl tracking-[0.2em] text-slate-200">
              SEMANTIC REACTOR — ACTIVE
            </h1>

            <div className="mt-6 font-mono text-sm text-slate-400 space-y-2">
              <div>&gt; Intent vector encoded</div>
              <div>&gt; Searching policy space</div>
              <div>&gt; Top-K retrieval executing</div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-blue-500/30 rounded-xl p-6 backdrop-blur">
            <div className="text-xs tracking-widest text-blue-300 mb-4">
              LIVE METRICS
            </div>

            <div className="space-y-3 font-mono text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Top-K Returned</span>
                <span className="text-blue-400">
                  {topSchemes.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Avg Similarity</span>
                <span className="text-blue-400">
                  {(similarity * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span>Retrieval Time</span>
                <span className="text-blue-400">
                  {retrievalTime}s
                </span>
              </div>
            </div>
          </div>
        </div>

     
        <div className="flex justify-center mb-12 relative">
          <div className="w-full max-w-4xl bg-gradient-to-b from-slate-900/60 to-slate-900/40 border border-blue-500/20 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#0f172a,transparent_40%)]" />

            {/* CORE */}
            <div className="relative h-56 flex items-center justify-center">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div className="w-24 h-24 rounded-full bg-slate-800 border border-blue-500 shadow-[0_0_40px_rgba(56,189,248,0.12)] flex items-center justify-center text-blue-300 font-mono text-xs"
                  animate={{ scale: phase === 'IGNITION' ? [1, 1.06, 1] : 1 }} transition={{ duration: 1.2 }}>
                  INTENT
                </motion.div>
              </div>

              {/* Render the four primary agents in a horizontal hero layout */}
              {agentPositions.map((p) => {
                const isActive = systemSnapshot?.active_agent === p.name || (systemSnapshot?.active_agent && systemSnapshot.active_agent.toUpperCase().includes('POLICY') && p.name === 'POLICY_RETRIEVER_AGENT')
                return (
                  <motion.div key={p.name}
                    className={`absolute w-28 h-20 rounded-lg flex flex-col items-center justify-center text-xs font-mono ${isActive ? 'bg-slate-800/80 border border-blue-300' : 'bg-slate-900/40 border border-slate-800'}`}
                    style={{ left: `calc(50% + ${p.x}px - 56px)`, top: `calc(50% + ${p.y}px - 36px)` }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}>
                    <div className={`text-sm ${isActive ? 'text-blue-200' : 'text-slate-300'} font-semibold`}>{p.name.replace(/_/g, ' ')}</div>
                    <div className={`text-[11px] mt-1 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{isActive ? 'ACTIVE' : 'DORMANT'}</div>
                  </motion.div>
                )
              })}

              {/* animated mover: pulse travels between mapped main agents when trace advances */}
              {mover.from && mover.to && (() => {
                const aFrom = mapNodeToMain(mover.from)
                const aTo = mapNodeToMain(mover.to)
                const idxFrom = agentPositions.findIndex(p => p.name === aFrom)
                const idxTo = agentPositions.findIndex(p => p.name === aTo)
                if (idxFrom === -1 || idxTo === -1) return null
                const from = agentPositions[idxFrom]
                const to = agentPositions[idxTo]
                const ax = from.x
                const ay = from.y
                const bx = to.x
                const by = to.y

                return (
                  <motion.div key={mover.key}
                    className="absolute w-3 h-3 bg-blue-300 rounded-full shadow-md"
                    style={{ left: `calc(50% + ${ax}px - 6px)`, top: `calc(50% + ${ay}px - 6px)` }}
                    animate={{ x: bx - ax, y: by - ay }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    onAnimationComplete={() => setMover({ from: null, to: null, key: 0 })}
                  />
                )
              })()}

              {/* subtle curved connections (non-random): between core and main agents */}
              <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                {agentPositions.map((p) => {
                  const x = p.x
                  const y = p.y
                  const x1 = 300 + x
                  const y1 = 200 + y
                  const x0 = 300
                  const y0 = 200
                  const cx = (x0 + x1) / 2
                  const cy = (y0 + y1) / 2
                  const qx = cx * 1.02
                  const qy = cy * 0.92
                  return (
                    <path key={p.name} d={`M ${x0} ${y0} Q ${qx} ${qy} ${x1} ${y1}`} stroke="url(#g1)" strokeWidth="1.2" fill="none" strokeOpacity="0.6" />
                  )
                })}
              </svg>
            </div>
          </div>
        </div>

        <AgentHero 
          activeAgent={systemSnapshot?.active_agent}
          trace={trace}
        />

        <ExecutionConsole trace={trace} />

        {/* ================= SNAPSHOT PANEL ================= */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* left: already rendered ranked grid above; this area can remain for results */}
          </div>

          <div className="bg-slate-900/50 border border-blue-500/20 rounded-xl p-6 backdrop-blur">
            <div className="text-xs tracking-widest text-blue-300 mb-3">SYSTEM SNAPSHOT</div>
            <div className="font-mono text-sm text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span>Phase</span>
                <span className="text-blue-400">{systemSnapshot?.active_phase || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Agent</span>
                <span className="text-blue-400">{systemSnapshot?.active_agent || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Query</span>
                <span className="text-blue-400">{systemSnapshot?.metrics?.query || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Schemes Found</span>
                <span className="text-blue-400">{schemesFound}</span>
              </div>
              <div className="flex justify-between">
                <span>Eligible</span>
                <span className="text-green-400">{eligibleSchemes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Rejected</span>
                <span className="text-red-400">{rejectedSchemes.length}</span>
              </div>
            </div>

            <div className="mt-4 text-xs tracking-widest text-blue-300">TRACE</div>
            <div className="mt-2 max-h-48 overflow-auto text-xs font-mono text-slate-300">
              {(systemSnapshot?.trace || []).map((t, i) => (
                <div key={i} className={`py-1 ${i === currentTraceIndex ? 'text-blue-200' : 'text-slate-400'}`}>
                  <div className="font-semibold">{t.event}</div>
                  <div className="text-xs">{t.node} • {t.details ? Object.keys(t.details).map(k=>`${k}:${t.details[k]}`).join(', ') : ''}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= TRACE FOOTER ================= */}
        <div className="mt-20 text-xs font-mono text-slate-500 border-t border-white/5 pt-6 tracking-widest">
          SYSTEM TRACE:
          <span className="text-blue-400 ml-2">
            {phase === "STABLE"
              ? "RETRIEVAL COMPLETE • RESULTS STABILIZED"
              : "SCANNING POLICY SPACE..."}
          </span>
        </div>

      </div>
    </div>
  );
}

export default SchemesSystemUI;
