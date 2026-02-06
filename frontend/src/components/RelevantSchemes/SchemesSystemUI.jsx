import { motion } from "framer-motion";
import { Database, Cpu, Layers, Activity } from "lucide-react";

export default function SchemesSystemUI({ stage = "idle", schemes = [] }) {
  /*
    stage values:
    idle
    profile
    semantic
    embedding
    filter
    faiss
    results
  */

  const glow = "0 0 25px rgba(59,130,246,0.6)";

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">

      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 opacity-10 
        bg-[linear-gradient(to_right,#1e40af_1px,transparent_1px),
             linear-gradient(to_bottom,#1e40af_1px,transparent_1px)]
        bg-[size:48px_48px]" />

      <div className="relative max-w-7xl mx-auto px-8 py-20">

        {/* PIPELINE */}
        <div className="grid grid-cols-6 gap-6 items-center mb-24">

          {/* PROFILE NODE */}
          <Node
            icon={Activity}
            title="Profile Node"
            active={stage !== "idle"}
            label="Profile Received"
          />

          <Flow active={stage !== "idle"} />

          {/* SEMANTIC BUILDER */}
          <Node
            icon={Layers}
            title="Semantic Builder"
            active={["semantic","embedding","filter","faiss","results"].includes(stage)}
            label="Query + Profile"
          />

          <Flow active={["embedding","filter","faiss","results"].includes(stage)} />

          {/* EMBEDDING ENGINE */}
          <Node
            icon={Cpu}
            title="Embedding Engine"
            active={["embedding","filter","faiss","results"].includes(stage)}
            pulse={stage === "embedding"}
            label="Vectorized"
          />

          <Flow active={["filter","faiss","results"].includes(stage)} />

          {/* FAISS */}
          <Node
            icon={Database}
            title="FAISS Index"
            active={["faiss","results"].includes(stage)}
            pulse={stage === "faiss"}
            label="Similarity Search"
          />
        </div>

        {/* RESULTS */}
        <div className="mt-32">
          <h2 className="text-sm tracking-widest text-blue-400 mb-6">
            TOP SCHEMES
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {schemes.map((s, i) => (
              <motion.div
                key={s.scheme_id || i}
                initial={{ opacity: 0, y: 40 }}
                animate={stage === "results" ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/60 border border-blue-500/30 rounded-xl p-5"
                style={{ boxShadow: glow }}
              >
                <div className="text-sm font-semibold text-blue-300">
                  {s.scheme_name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function Node({ icon: Icon, title, label, active, pulse }) {
  return (
    <motion.div
      className="relative bg-slate-900/60 border border-blue-500/30 rounded-xl p-6 text-center"
      animate={active ? { opacity: 1 } : { opacity: 0.4 }}
      style={{ boxShadow: active ? "0 0 20px rgba(59,130,246,0.5)" : "none" }}
    >
      <motion.div
        animate={pulse ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: pulse ? Infinity : 0, duration: 1.2 }}
        className="flex justify-center mb-3"
      >
        <Icon className="text-blue-400" />
      </motion.div>

      <div className="text-xs tracking-widest text-slate-400 mb-1">
        {title}
      </div>
      <div className="text-xs text-blue-300">
        {label}
      </div>
    </motion.div>
  );
}

function Flow({ active }) {
  return (
    <motion.div
      className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent"
      animate={active ? { opacity: [0.2, 1, 0.2] } : { opacity: 0.1 }}
      transition={{ repeat: active ? Infinity : 0, duration: 1.5 }}
    />
  );
}
