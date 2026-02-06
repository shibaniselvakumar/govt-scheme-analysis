import {
  User,
  Database,
  ShieldCheck,
  Cpu,
  Activity
} from 'lucide-react'

function ProfileSystemUI() {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">

      {/* GRID */}
      <div className="absolute inset-0 opacity-10 
        bg-[linear-gradient(to_right,#1e40af_1px,transparent_1px),
             linear-gradient(to_bottom,#1e40af_1px,transparent_1px)]
        bg-[size:48px_48px]" />

      <div className="relative max-w-7xl mx-auto px-6 py-24">

        {/* HEADER */}
        <div className="mb-20">
          <div className="inline-flex items-center gap-2 mb-4 
            px-3 py-1 rounded-full border border-blue-500/40 
            text-xs tracking-widest text-blue-300 bg-blue-500/10">
            PROFILE INTAKE
          </div>

          <h1 className="text-3xl md:text-4xl tracking-[0.2em] text-slate-200 mb-6">
            AWAITING USER PROFILE
          </h1>

          <p className="text-slate-400 max-w-2xl font-mono text-sm">
            Identity schema loaded.  
            Validation rules armed.  
            Monitoring for structured human input.
          </p>
        </div>

        {/* CORE */}
        <div className="flex justify-center mb-24 relative">

          <div className="absolute w-64 h-64 rounded-full bg-blue-500/10 animate-ping" />

          <div className="w-32 h-32 rounded-full bg-slate-900 border border-blue-500
            shadow-[0_0_40px_rgba(59,130,246,0.6)]
            flex items-center justify-center animate-pulse">
            <User className="text-blue-400 w-10 h-10" />
          </div>

          <div className="absolute -bottom-10 text-sm text-blue-300 tracking-widest">
            PROFILE LISTENER — ACTIVE
          </div>
        </div>

        {/* SYSTEM MODULES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {[
            {
              icon: Database,
              title: 'Profile Schema',
              status: 'Loaded'
            },
            {
              icon: ShieldCheck,
              title: 'Privacy Guard',
              status: 'Consent Required'
            },
            {
              icon: Cpu,
              title: 'Inference Engine',
              status: 'Idle'
            },
            {
              icon: Activity,
              title: 'Event Stream',
              status: 'Listening'
            }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-blue-500/30 
              rounded-xl p-6 opacity-70"
            >
              <item.icon className="text-blue-400 mb-4" />
              <div className="text-sm font-semibold mb-1">
                {item.title}
              </div>
              <div className="text-xs text-slate-400">
                {item.status}
              </div>
            </div>
          ))}

        </div>

        {/* FOOTER */}
        <div className="mt-20 text-xs text-slate-500 tracking-widest">
          SYSTEM STATE — PASSIVE LISTENING
        </div>

      </div>
    </div>
  )
}

export default ProfileSystemUI
