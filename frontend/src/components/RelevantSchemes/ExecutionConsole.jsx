import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import "./ExecutionConsole.css"

const classifyEvent = (event = "") => {
  const e = event.toUpperCase()

  if (e.includes("FAISS") || e.includes("QUERY") || e.includes("RETRIEVE"))
    return "RETRIEVAL"

  if (e.includes("ELIGIBILITY") || e.includes("VALID") || e.includes("CHECK"))
    return "VALIDATION"

  if (e.includes("DOC") || e.includes("FORM") || e.includes("PDF"))
    return "DOCUMENT"

  if (e.includes("PATHWAY") || e.includes("ROUTE") || e.includes("ORCHESTR"))
    return "ORCHESTRATION"

  if (e.includes("ERROR") || e.includes("FAIL"))
    return "ERROR"

  return "SYSTEM"
}

const typeColors = {
  RETRIEVAL: "#00E5FF",
  VALIDATION: "#00FF94",
  DOCUMENT: "#B388FF",
  ORCHESTRATION: "#FFC107",
  ERROR: "#FF5252",
  SYSTEM: "#9E9E9E",
}

export default function ExecutionConsole({ trace = [] }) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!trace.length) return

    setCurrentIndex(-1)
    setIsRunning(true)
  }, [trace])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev < trace.length - 1) return prev + 1
        clearInterval(interval)
        return prev
      })
    }, 1100)

    return () => clearInterval(interval)
  }, [isRunning, trace.length])

  useEffect(() => {
    const activeElement = document.querySelector(".trace-row.active")
    activeElement?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }, [currentIndex])

  const activeNode = trace[currentIndex]?.node

  return (
    <div className="execution-console-container">
      {/* HEADER */}
      <div className="console-header">
        <motion.div
          className="core-brain"
          animate={{
            scale: isRunning ? [1, 1.15, 1] : 1,
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
        />
        <div>
          <h2>Intelligence Execution Console</h2>
          <p>Live Neural Orchestration Replay</p>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="trace-console">
        {trace.map((item, index) => {
          const type = classifyEvent(item.event)
          const isActive = index === currentIndex
          const color = typeColors[type]

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`trace-row ${isActive ? "active" : ""}`}
              style={{
                borderLeft: `4px solid ${color}`,
              }}
            >
              <div
                className="trace-indicator"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
                }}
              />

              <div className="trace-content">
                <div className="trace-header">
                  <span
                    className={`agent ${
                      isActive ? "agent-active" : ""
                    }`}
                  >
                    {item.node}
                  </span>

                  <span
                    className="badge"
                    style={{
                      background: `${color}22`,
                      color: color,
                      border: `1px solid ${color}`,
                    }}
                  >
                    {type}
                  </span>
                </div>

                <div className="trace-event">{item.event}</div>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="trace-details"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {typeof item.details === "string" && item.details}

                    {typeof item.details === "object" && item.details !== null && (
                    <pre className="trace-json">
                        {JSON.stringify(item.details, null, 2)}
                    </pre>
                    )}

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
