import React, { useEffect, useState } from "react";
import SystemUI from "./SystemUI";

const SystemUIPage = () => {
  const [systemData, setSystemData] = useState(null);

  useEffect(() => {
    fetch("/api/search-schemes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "education", userProfile: {} }),
    })
      .then((res) => res.json())
      .then((data) => setSystemData(data._system));
  }, []);

  if (!systemData) return <div>Loading System UI...</div>;

  return <SystemUI systemData={systemData} />;
};

export default SystemUIPage;
