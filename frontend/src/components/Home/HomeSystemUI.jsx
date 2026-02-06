import { Cpu, Layers, Database, ShieldCheck, Activity } from 'lucide-react'

function HomeSystemUI() {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">

      {/* GRID + SCANLINE BACKGROUND */}
      <div className="absolute inset-0 opacity-10 
        bg-[linear-gradient(to_right,#1e40af_1px,transparent_1px),
             linear-gradient(to_bottom,#1e40af_1px,transparent_1px)]
        bg-[size:48px_48px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-6 py-24">

{/* SYSTEM HUD INTRO */}
<div className="mb-24 relative grid grid-cols-1 md:grid-cols-2 gap-14 items-start">

  {/* LEFT — SYSTEM VOICE */}
  <div className="relative">

    {/* STATUS TAG */}
    <div className="inline-flex items-center gap-2 mb-4 
      px-3 py-1 rounded-full border border-blue-500/40 
      text-xs tracking-widest text-blue-300
      bg-blue-500/10">
      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
      CORE STATUS
    </div>

    {/* MAIN SYSTEM LINE */}
    <h1 className="text-3xl md:text-4xl font-semibold text-slate-200 tracking-[0.15em] mb-6">
      SYSTEM ONLINE
    </h1>

    {/* TERMINAL FEED */}
    <div className="space-y-2 text-sm text-slate-400 font-mono max-w-2xl">
      <div className="flex gap-2">
        <span className="text-blue-400">&gt;</span>
        Core intelligence stack initialized
      </div>
      <div className="flex gap-2">
        <span className="text-blue-400">&gt;</span>
        Environment scan running
      </div>
      <div className="flex gap-2 opacity-80">
        <span className="text-blue-400">&gt;</span>
        Awaiting external human signal
        <span className="animate-pulse">_</span>
      </div>
    </div>

    {/* AMBIENT LINE */}
    <div className="absolute -bottom-10 left-0 w-64 h-[1px] 
      bg-gradient-to-r from-blue-500/60 to-transparent" />
  </div>

  {/* RIGHT — LIVE SYSTEM TELEMETRY */}
  <div className="relative mt-6 md:mt-0">

    <div className="bg-slate-900/40 border border-blue-500/30 
      rounded-xl p-6 backdrop-blur">

      <div className="text-xs tracking-widest text-blue-300 mb-4">
        SYSTEM TELEMETRY
      </div>

      <div className="space-y-4 font-mono text-sm text-slate-300">

        <div className="flex justify-between">
          <span>Heartbeat</span>
          <span className="text-blue-400 animate-pulse">ACTIVE</span>
        </div>

        <div className="flex justify-between">
          <span>Agent Sync</span>
          <span className="text-blue-400">STABLE</span>
        </div>

        <div className="flex justify-between">
          <span>Memory Cache</span>
          <span className="text-blue-400">WARM</span>
        </div>

        <div className="flex justify-between">
          <span>Signal Listener</span>
          <span className="text-blue-400 animate-pulse">ARMED</span>
        </div>

      </div>

    </div>

    {/* SIDE GLOW */}
    <div className="absolute -right-6 top-10 w-1 h-32 
      bg-gradient-to-b from-blue-500/60 to-transparent" />
  </div>

</div>



        {/* SYSTEM CORE */}
        <div className="flex justify-center mb-24 relative">

          {/* OUTER PULSE */}
          <div className="absolute w-64 h-64 rounded-full bg-blue-500/10 animate-ping" />

          {/* INNER RING */}
          <div className="absolute w-58 h-68 rounded-full border border-blue-400/40 animate-spin-slow" />

          {/* CORE */}
          <div className="w-32 h-32 rounded-full bg-slate-900 border border-blue-500 
            shadow-[0_0_40px_rgba(59,130,246,0.6)]
            flex items-center justify-center animate-pulse">
            <Activity className="text-blue-400 w-10 h-10" />
          </div>

          <div className="absolute -bottom-10 text-sm text-blue-300 tracking-widest">
            SYSTEM CORE — ACTIVE
          </div>
        </div>

        {/* STATUS NODES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-28">

          {[
            { icon: Database, title: 'Policy Corpus', status: 'Indexed • Synced' },
            { icon: ShieldCheck, title: 'Eligibility Engine', status: 'Rules Loaded' },
            { icon: Cpu, title: 'Inference Core', status: 'Idle • Warm' },
            { icon: Layers, title: 'Agent Registry', status: 'Standing By' }
          ].map((item, i) => (
            <div
              key={i}
              className="relative bg-slate-900/60 border border-blue-500/30 
              rounded-xl p-6 backdrop-blur
              hover:shadow-[0_0_25px_rgba(59,130,246,0.35)]
              transition-all duration-500"
            >
              <item.icon className="text-blue-400 mb-4" />
              <div className="text-sm font-semibold mb-1">
                {item.title}
              </div>
              <div className="text-xs text-slate-400">
                {item.status}
              </div>

              {/* FLICKER LINE */}
              <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r 
                from-transparent via-blue-400/60 to-transparent animate-pulse" />
            </div>
          ))}
        </div>

        {/* AGENT CLUSTER */}
        <div>
          <h2 className="text-xl font-semibold mb-8 text-slate-300 tracking-wide">
            INTELLIGENCE AGENTS — DORMANT
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

            {[
              ['Scheme Discovery', 'Listening for intent'],
              ['Eligibility Evaluation', 'Profile buffer empty'],
              ['Document Validation', 'Schemas registered'],
              ['Pathway Generation', 'Execution locked']
            ].map(([title, desc], i) => (
              <div
                key={i}
                className="bg-slate-900/40 border border-slate-700 
                rounded-2xl p-6 opacity-70
                hover:opacity-100 transition duration-500
                hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]"
              >
                <h3 className="font-semibold mb-2 text-blue-300">
                  {title} Agent
                </h3>
                <p className="text-sm text-slate-400">
                  {desc}
                </p>
              </div>
            ))}

          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-24 text-xs text-slate-500 border-t border-white/5 pt-6 tracking-widest">
          SYSTEM STATE:
          <span className="text-blue-400 ml-2">DORMANT • OBSERVING • HEARTBEAT ACTIVE</span>
        </div>

      </div>
    </div>
  )
}

export default HomeSystemUI
