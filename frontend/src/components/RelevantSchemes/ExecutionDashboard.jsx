import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ExecutionDashboard.css";

const ExecutionDashboard = ({ trace = [] }) => {
  const [mode, setMode] = useState("presentation");
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [latency, setLatency] = useState(0);

  // 🔥 Remove duplicate events
  const uniqueTrace = useMemo(() => {
    return Array.from(
      new Map(trace.map((t) => [`${t.step}-${t.event}`, t])).values()
    );
  }, [trace]);

  const totalLatency = (steps) =>
    steps.reduce((acc, s) => acc + (s.latency_ms || 0), 0);

  useEffect(() => {
    if (mode === "presentation") {
      setVisibleSteps(uniqueTrace);
      setLatency(totalLatency(uniqueTrace));
    } else {
      runReplay();
    }
  }, [mode, uniqueTrace]);

  const runReplay = async () => {
    setVisibleSteps([]);
    setLatency(0);

    for (let i = 0; i < uniqueTrace.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setVisibleSteps((prev) => [...prev, uniqueTrace[i]]);
      setLatency((prev) => prev + (uniqueTrace[i].latency_ms || 0));
    }
  };

  return (
    <div className="dashboard">
      <Header mode={mode} setMode={setMode} />

      <ExecutionSummary
        latency={latency}
        steps={uniqueTrace.length}
      />

      <PipelineFlow
        trace={uniqueTrace}
        visibleSteps={visibleSteps}
      />

      <ExecutionTimeline steps={visibleSteps} />

      <FinalResultCard trace={uniqueTrace} />
    </div>
  );
};

/* ========================= HEADER ========================= */

const Header = ({ mode, setMode }) => (
  <div className="dashboard-header">
    <div>
      <h2>Retrieval Intelligence Engine</h2>
      <p>Semantic Multi-Agent Execution Console</p>
    </div>

    <div className="mode-toggle">
      <button
        className={mode === "presentation" ? "active-btn" : ""}
        onClick={() => setMode("presentation")}
      >
        Presentation
      </button>

      <button
        className={mode === "replay" ? "active-btn" : ""}
        onClick={() => setMode("replay")}
      >
        Replay
      </button>
    </div>
  </div>
);

/* ========================= SUMMARY ========================= */

const ExecutionSummary = ({ latency, steps }) => (
  <div className="execution-summary">
    <div className="summary-card">
      <h3>Total Execution</h3>
      <p>{latency.toFixed(2)} ms</p>
    </div>

    <div className="summary-card">
      <h3>Signals Processed</h3>
      <p>{steps}</p>
    </div>

    <div className="summary-card">
      <h3>Status</h3>
      <p className="success">Completed ✓</p>
    </div>
  </div>
);

/* ========================= PIPELINE ========================= */

const PipelineFlow = ({ trace, visibleSteps }) => {
  return (
    <div className="pipeline">
      {trace.map((step) => {
        const isActive = visibleSteps.includes(step);

        return (
          <motion.div
            key={step.step}
            className={`pipeline-node ${isActive ? "active" : ""}`}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: isActive ? 1 : 0.4 }}
          >
            {step.node}
          </motion.div>
        );
      })}
    </div>
  );
};

/* ========================= TIMELINE ========================= */

const ExecutionTimeline = ({ steps }) => {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="timeline">
      <AnimatePresence>
        {steps.map((step) => (
          <motion.div
            key={step.step}
            className="timeline-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="timeline-header"
              onClick={() =>
                setExpanded(expanded === step.step ? null : step.step)
              }
            >
              <div>
                <h4>{step.event}</h4>
                <span className="node-tag">{step.node}</span>
              </div>

              <div className="latency-badge">
                {step.latency_ms?.toFixed(2) || 0} ms
              </div>
            </div>

            {expanded === step.step && (
              <div className="timeline-body">
                {Object.entries(step)
                  .filter(
                    ([key]) =>
                      !["step", "event", "node", "latency_ms"].includes(key)
                  )
                  .map(([key, value]) => (
                    <div key={key} className="kv-row">
                      <span className="kv-key">{key}</span>
                      <span className="kv-value">
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : value}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/* ========================= FINAL RESULT ========================= */

const FinalResultCard = ({ trace }) => {
  if (!trace || trace.length === 0) return null;

  const result = trace.find(
    (t) => t.event === "SCHEMES_MATERIALIZED"
  );

  if (!result || !result.ranked_results) return null;

  let scheme = null;

  // Case 1: ranked_results is an array
  if (Array.isArray(result.ranked_results)) {
    scheme = result.ranked_results[0];
  }

  // Case 2: ranked_results is single object
  else if (typeof result.ranked_results === "object") {
    scheme = result.ranked_results;
  }

  // If still nothing, don't render
  if (!scheme) return null;

  return (
    <div className="result-card">
      <h3>Top Recommended Scheme</h3>

      <h2>{scheme.scheme_name || "Unnamed Scheme"}</h2>

      <div className="result-meta">
        {scheme.rank && <span>Rank: #{scheme.rank}</span>}
        {scheme.similarity_score && (
          <span>
            Similarity: {scheme.similarity_score.toFixed(3)}
          </span>
        )}
      </div>

      {scheme.description && (
        <p className="scheme-description">
          {scheme.description}
        </p>
      )}
    </div>
  );
};

export default ExecutionDashboard;