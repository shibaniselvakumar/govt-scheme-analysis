import { motion } from "framer-motion";

const NODES = [
  { id: "POLICY", x: -220, y: -60 },
  { id: "ELIGIBILITY", x: 220, y: -60 },
  { id: "DOCUMENT", x: -180, y: 120 },
  { id: "PATHWAY", x: 180, y: 120 }
];

export default function AgentHero({ activeAgent }) {
  const normalize = (agent) => {
    if (!agent) return "POLICY";
    const a = agent.toUpperCase();
    if (a.includes("POLICY")) return "POLICY";
    if (a.includes("ELIG")) return "ELIGIBILITY";
    if (a.includes("DOC")) return "DOCUMENT";
    if (a.includes("PATH")) return "PATHWAY";
    return "POLICY";
  };

  const current = normalize(activeAgent);

  return (
    <div className="flex justify-center mb-24">
      <div className="relative w-full max-w-5xl h-[500px] overflow-hidden rounded-3xl bg-black border border-cyan-500/20">

        {/* GRID BACKGROUND */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* CORE */}
        <motion.div
          className="absolute left-1/2 top-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400 flex items-center justify-center text-cyan-300 font-mono text-xs shadow-[0_0_80px_rgba(0,255,255,0.4)]"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          INTENT CORE
        </motion.div>

        {/* CONNECTION LINES */}
        <svg className="absolute inset-0 pointer-events-none">
          {NODES.map((node) => (
            <line
              key={node.id}
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${node.x}px)`}
              y2={`calc(50% + ${node.y}px)`}
              stroke="rgba(0,255,255,0.2)"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* NODES */}
        {NODES.map((node) => {
          const isActive = node.id === current;

          return (
            <motion.div
              key={node.id}
              className={`absolute w-44 h-20 rounded-xl flex items-center justify-center text-xs font-mono tracking-wider transition-all duration-500
                ${
                  isActive
                    ? "border border-cyan-300 text-cyan-200 shadow-[0_0_40px_rgba(0,255,255,0.6)] bg-cyan-500/10"
                    : "border border-slate-800 text-slate-500 bg-slate-900/40"
                }`}
              style={{
                left: `calc(50% + ${node.x}px - 88px)`,
                top: `calc(50% + ${node.y}px - 40px)`
              }}
              animate={{
                y: [0, -6, 0],
                opacity: isActive ? 1 : 0.7
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              {node.id}
            </motion.div>
          );
        })}

        {/* ACTIVE ENERGY BEAM */}
        {NODES.map((node) =>
          node.id === current ? (
            <motion.div
              key="beam"
              className="absolute w-2 h-2 rounded-full bg-cyan-400 blur-md"
              initial={{ x: 0, y: 0 }}
              animate={{
                x: node.x,
                y: node.y
              }}
              transition={{ duration: 0.8 }}
              style={{
                left: "50%",
                top: "50%"
              }}
            />
          ) : null
        )}
      </div>
    </div>
  );
}
