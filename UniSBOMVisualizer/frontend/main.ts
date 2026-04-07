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

  fetch("./data/normalized.json")
    .then((res) => res.json())
    .then((data) => flow.update(data));
});
