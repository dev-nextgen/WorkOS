import { SbomFlowMatrix } from "./src/components/SbomFlowMatrix";
const flow = new SbomFlowMatrix();

import { SbomSunburst } from "./src/components/SbomSunburst";
const Sunflow = new SbomSunburst();

import { SbomHorizontalBar } from "./src/components/SbomHorizontalBar";
const Barflow = new SbomHorizontalBar();

function initApp() {
  /* 1 */
  flow.init("#graph");
  fetch("./src/data/normalized.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load JSON");
      return res.json();
    })
    .then((data) => {
      console.log("✅ JSON LOADED:", data);
      flow.update(data);
    })
    .catch((err) => {
      console.error("❌ DATA LOAD ERROR:", err);
    });

  /* 3 */
  Sunflow.init("#sungraph");
  fetch("./src/data/normalized.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load JSON");
      return res.json();
    })
    .then((data) => {
      console.log("✅ JSON LOADED:", data);
      Sunflow.update(data);
    })
    .catch((err) => {
      console.error("❌ DATA LOAD ERROR:", err);
    });
}

// Ensure DOM ready
document.addEventListener("DOMContentLoaded", initApp);

// NetWork Responsive handling
window.addEventListener("resize", () => {
  flow.init("#graph");
  fetch("./src/data/normalized.json")
    .then((res) => res.json())
    .then((data) => flow.update(data));
});

// SunBurst Responsive handling
window.addEventListener("resize", () => {
  Sunflow.init("#sungraph");
  fetch("./src/data/normalized.json")
    .then((res) => res.json())
    .then((data) => Sunflow.update(data));
});

//BarGraph Responsive handling
const data = {
  sbom_data: {
    AIE: { "Pkg's": "114,710" },
    OpsRamp: { "Pkg's": "3,710" },
    EDF: { "Pkg's": "7,740" },
    GLIS: { "Pkg's": "13,530" },
    GLFS: { "Pkg's": "66,010" },
    HKS: { "Pkg's": "4,710" },
  },
};
const chart = new SbomHorizontalBar();
chart.init("#bargraph");
chart.update(data);
