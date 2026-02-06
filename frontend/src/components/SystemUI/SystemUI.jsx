// src/components/SystemUI.jsx
import React, { useEffect, useState } from "react";
import AgentNode from "./AgentNode";
import "./system-ui.css";

const agentPositions = {
  SCHEME_DISCOVERY_AGENT: { x: "50px", y: "50px" },
  ELIGIBILITY_AGENT: { x: "250px", y: "50px" },
  DOCUMENT_VALIDATION_AGENT: { x: "450px", y: "50px" },
  PATHWAY_GENERATION_AGENT: { x: "650px", y: "50px" },
};

const SystemUI = ({ systemData }) => {
  const [activeAgents, setActiveAgents] = useState([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= systemData.agents_ran.length) {
        clearInterval(interval);
        return;
      }
      setActiveAgents((prev) => [...prev, systemData.agents_ran[i]]);
      i++;
    }, 800); // 0.8s delay

    return () => clearInterval(interval);
  }, [systemData]);

  return (
    <div className="system-ui-container">
      {Object.keys(agentPositions).map((agentName) => (
        <AgentNode
          key={agentName}
          name={agentName}
          status={activeAgents.includes(agentName) ? "active" : "idle"}
          x={agentPositions[agentName].x}
          y={agentPositions[agentName].y}
        />
      ))}
    </div>
  );
};

export default SystemUI;
