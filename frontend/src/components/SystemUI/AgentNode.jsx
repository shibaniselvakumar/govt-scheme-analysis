// src/components/AgentNode.jsx
import React from "react";
import "./system-ui.css";

const AgentNode = ({ name, status, x, y }) => {
  return (
    <div
      className={`agent-node ${status}`}
      style={{ left: x, top: y }}
    >
      {name}
    </div>
  );
};

export default AgentNode;
