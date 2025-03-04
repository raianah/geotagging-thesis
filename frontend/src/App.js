import React, { useState } from "react";
import ASFMap from "./assets/ASFMap";
import Sidebar from "./assets/Sidebar";
import SPM from "./assets/SPM";
import MapFixer from "./assets/MapFixer";
import RegistrationForm from "./assets/Registration";

const App = () => {
  const [position, setPosition] = useState([13.9374, 120.7335]); // Default: Balayan

  return (
    <div style={{ margin: 0, padding: 0 }}>
        {/* <SPM /> */}
        {/* <RegistrationForm /> */}
        <Sidebar position={position} />
        <div style={{ flex: 1 }}>
          <ASFMap position={position} setPosition={setPosition} />
        </div>
      </div>
  );
};

export default App;
