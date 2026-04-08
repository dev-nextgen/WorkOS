import { SbomFlowMatrix } from "./SbomFlowMatrix";
const flow = new SbomFlowMatrix();

import { SbomSunburst } from "./SbomSunburst";
const Sunflow = new SbomSunburst();

import { SbomHorizontalBar } from "./SbomHorizontalBar";
const Barflow = new SbomHorizontalBar();

/*

import { SbomCirclePacking } from "./SbomCirclePacking";
const Crlflow = new SbomCirclePacking();

import { SbomIcicle } from "./SbomIcicle";
const Iclflow = new SbomIcicle();

import { SbomPieChart } from "./SbomPieChart";
const Pieflow = new SbomPieChart();

import { SbomHeatMap } from "./SbomHeatMap";
const HeatMapflow = new SbomHeatMap();
const heatMapdata = {
  sbom_data: {
    AIE: [{}],
    OpsRamp: [{}],
    EDF: [{}],
    GLIS: [{}],
    GLFS: [{}, {}],
    HKS: [{}],
  },
};
HeatMapflow.init("#heatmapgraph");
HeatMapflow.update(heatMapdata);

import { SbomOrderInsideOut } from "./SbomOrderInsideOut";
const stkflow = new SbomOrderInsideOut();
*/

function initApp() {
  /*1*/
  flow.init("#graph");
  fetch("./data/normalized.json")
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

  fetch("./data/normalized.json")
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

  /*3
  Crlflow.init("#crlgraph");
  fetch("./data/normalized.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load JSON");
      return res.json();
    })
    .then((data) => {
      console.log("✅ JSON LOADED:", data);
      Crlflow.update(data);
    })
    .catch((err) => {
      console.error("❌ DATA LOAD ERROR:", err);
    });
    */
  /*5
  Iclflow.init("#iclgraph");
  fetch("./data/normalized.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load JSON");
      return res.json();
    })
    .then((data) => {
      console.log("✅ JSON LOADED:", data);
      Iclflow.update(data);
    })
    .catch((err) => {
      console.error("❌ DATA LOAD ERROR:", err);
    });
*/
  /* 4 */
  Sunflow.init("#sungraph");
  fetch("./data/normalized.json")
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

/*1
Pieflow.init("#piegraph");
fetch("./data/normalized.json")
  .then((res) => {
    if (!res.ok) throw new Error("Failed to load JSON");
    return res.json();
  })
  .then((data) => {
    console.log("✅ JSON LOADED:", data);
    Pieflow.update(data);
  })
  .catch((err) => {
    console.error("❌ DATA LOAD ERROR:", err);
  });
*/
/*2
stkflow.init("#stkgraph");
fetch("./data/normalized.json")
  .then((res) => {
    if (!res.ok) throw new Error("Failed to load JSON");
    return res.json();
  })
  .then((data) => {
    console.log("✅ JSON LOADED:", data);
    stkflow.update(data);
  })
  .catch((err) => {
    console.error("❌ DATA LOAD ERROR:", err);
  });*/

// Ensure DOM ready
document.addEventListener("DOMContentLoaded", initApp);

// Responsive handling
window.addEventListener("resize", () => {
  flow.init("#graph");
  fetch("./data/normalized.json")
    .then((res) => res.json())
    .then((data) => flow.update(data));
});

// Responsive handling
window.addEventListener("resize", () => {
  Sunflow.init("#sungraph");
  fetch("./data/normalized.json")
    .then((res) => res.json())
    .then((data) => Sunflow.update(data));
});
/*
// Responsive handling
window.addEventListener("resize", () => {
  Crlflow.init("#crlgraph");
  fetch("./data/normalized.json")
    .then((res) => res.json())
    .then((data) => Crlflow.update(data));
});

// Responsive handling
window.addEventListener("resize", () => {
  Iclflow.init("#iclgraph");
  fetch("./data/normalized.json")
    .then((res) => res.json())
    .then((data) => Iclflow.update(data));
});

// Responsive handling
window.addEventListener("resize", () => {
  Pieflow.init("#piegraph");
  fetch("./data/normalized.json")
    .then((res) => res.json())
    .then((data) => Pieflow.update(data));
});

// Responsive handling
window.addEventListener("resize", () => {
  stkflow.init("#stkgraph");
  fetch("./data/normalized.json")
    .then((res) => res.json())
    .then((data) => stkflow.update(data));
    });
*/
// Responsive handling

/*2*/
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
