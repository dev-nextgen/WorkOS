/* import { SbomFlowMatrix } from "./SbomFlowMatrix";

const graph = new SbomFlowMatrix();

graph.init("#graph-container", {
  debug: true,
  callbacks: {
    onError: (e) => console.error("GRAPH ERROR:", e),
    onRenderComplete: (s) => console.log("RENDER OK:", s),
  },
});

// 🔥 HARDCODED DATA (NO FETCH)
graph.update({
  nodes: [
    {
      id: "A",
      name: "App",
      version: "1.0",
      supplier: "internal",
      type: "direct",
    },
    {
      id: "B",
      name: "Lib1",
      version: "2.0",
      supplier: "npm",
      type: "transitive",
    },
  ],
  edges: [{ source: "A", target: "B" }],
});
*/

/*
fetch("./data/normalized.json")
  .then(res => res.json())
  .then(data => {
    console.log("LOADED DATA:", data);

    if (!data.nodes || !data.edges) {
      throw new Error("Invalid structure");
    }

    if (data.nodes.length === 0) {
      throw new Error("No nodes found");
    }

    graph.update(data);
  })
  .catch(err => console.error("LOAD ERROR:", err));
  */
/*
import { SbomFlowMatrix } from "./SbomFlowMatrix";

const graph = new SbomFlowMatrix();

graph.init("#graph-container", {
  layout: "force",
  debug: true,
  callbacks: {
    onNodeClick: (node) => console.log("CLICK:", node),
    onRenderComplete: (stats) => console.log("STATS:", stats),
    onError: (e) => console.error("ERROR:", e),
  },
});

// ✅ Correct fetch path
fetch("./data/normalized.json")
  .then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then((data) => {
    console.log("✅ DATA LOADED:", data);

    if (!data.nodes || !data.edges) {
      throw new Error("Invalid normalized.json structure");
    }

    if (data.nodes.length === 0) {
      console.warn("⚠ No nodes found");
    }

    graph.update(data);
  })
  .catch((err) => {
    console.error("❌ LOAD ERROR:", err);
  });
  */

import { SbomFlowMatrix } from "./SbomFlowMatrix";

const flow = new SbomFlowMatrix();

function initApp() {
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
}

// Ensure DOM ready
document.addEventListener("DOMContentLoaded", initApp);

// Responsive handling
window.addEventListener("resize", () => {
  flow.init("#graph");

  fetch("./normalized.json")
    .then((res) => res.json())
    .then((data) => flow.update(data));
});
