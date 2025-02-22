import React, { useState } from "react";
import ASFMap from "./assets/ASFMap";
import Sidebar from "./assets/Sidebar";

const App = () => {
  const [position, setPosition] = useState([13.9374, 120.7335]); // Default: Balayan

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <Sidebar position={position} />
      <div style={{ flex: 1 }}>
        <ASFMap position={position} setPosition={setPosition} />
      </div>
    </div>
  );
};

export default App;
