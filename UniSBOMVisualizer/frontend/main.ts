import * as d3 from "d3";
import { SbomFlowMatrix } from "./src/components/SbomFlowMatrix";
import { SbomSunburst } from "./src/components/SbomSunburst";
import { SbomHorizontalBar } from "./src/components/SbomHorizontalBar";

/* ========================================================= VIEW LOADER (SPA SAFE)
========================================================= */
class ViewLoader {
  private containerId: string;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  async load(url: string, callback?: Function) {
    try {
      const container = document.getElementById(this.containerId);
      if (!container) throw new Error("Container not found");

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load ${url}`);

      const html = await res.text();

      const temp = document.createElement("div");
      temp.innerHTML = html;

      const content =
        temp.querySelector(".content-wrapper") ||
        temp.querySelector(".content") ||
        temp;

      container.innerHTML = content.innerHTML;

      console.log("View injected:", url);

      // /CRITICAL: re-bind scripts AFTER DOM injection
      if (callback) {
        setTimeout(() => callback(), 50);
      }
    } catch (err) {
      console.error("❌ View load failed:", err);
    }
  }
}

/* ========================================================= /DATATABLE INIT (SAFE)
========================================================= */
function initDataTable() {
  console.log("Initializing DataTable");

  //@ts-ignore
  if (!window.$ || !$.fn.DataTable) {
    console.error("❌ DataTables not loaded");
    return;
  }

  //@ts-ignore
  const table = $("#ezsecopstbl");

  if (!table.length) {
    console.warn("Table not found");
    return;
  }

  //@ts-ignore
  if ($.fn.DataTable.isDataTable("#ezsecopstbl")) {
    table.DataTable().clear().destroy();
  }

  table.DataTable({
    responsive: true,
    autoWidth: false,
    destroy: true,
    searching: true,
    paging: true,
    info: true,
  });

  console.log("DataTable READY");
}

/* =========================================================
   /CALENDAR INIT (SAFE)
========================================================= */
let calendarInstance: any = null;

function initCalendar() {
  console.log("Initializing Calendar");

  //@ts-ignore
  if (!window.FullCalendar) {
    console.error("❌ FullCalendar not loaded");
    return;
  }

  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) {
    console.warn("Calendar container not found");
    return;
  }

  // /DESTROY previous instance
  if (calendarInstance) {
    calendarInstance.destroy();
    calendarInstance = null;
  }

  //@ts-ignore
  const { Calendar, Draggable } = FullCalendar;

  const containerEl = document.getElementById("external-events");
  const checkbox: any = document.getElementById("drop-remove");

  // /Rebind draggable events
  if (containerEl) {
    new Draggable(containerEl, {
      itemSelector: ".external-event",
      eventData: function (eventEl: HTMLElement) {
        return {
          title: eventEl.innerText.trim(),
          backgroundColor: getComputedStyle(eventEl).backgroundColor,
          borderColor: getComputedStyle(eventEl).backgroundColor,
          textColor: getComputedStyle(eventEl).color,
        };
      },
    });
  }

  calendarInstance = new Calendar(calendarEl, {
    initialView: "dayGridMonth",
    themeSystem: "bootstrap",

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },

    editable: true,
    droppable: true,

    drop: function (info: any) {
      if (checkbox && checkbox.checked) {
        info.draggedEl.remove();
      }
    },

    eventClick: function (info: any) {
      if (confirm(`Delete "${info.event.title}" ?`)) {
        info.event.remove();
      }
    },

    eventDidMount: function (info: any) {
      info.el.addEventListener("dblclick", () => {
        if (confirm(`Delete "${info.event.title}" ?`)) {
          info.event.remove();
        }
      });
    },

    events: [
      {
        title: "Sample Event",
        start: new Date(),
        backgroundColor: "#0073b7",
        borderColor: "#0073b7",
      },
    ],
  });

  calendarInstance.render();

  console.log("Calendar READY");
}

/* =========================================================DASHBOARD INIT (D3 VISUALS)
========================================================= */
function initDashboard() {
  console.log("Dashboard init");

  const flow = new SbomFlowMatrix();
  const sunburst = new SbomSunburst();
  const bar = new SbomHorizontalBar();

  try {
    flow.init("#graph");
    sunburst.init("#sungraph");
    bar.init("#bargraph");
  } catch (err) {
    console.error("❌ Init error:", err);
    return;
  }

  fetch("/data/normalized.json", { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => {
      flow.update(data);
      sunburst.update(data);

      bar.update({
        sbom_data: {
          AIE: { "Pkg's": "114,710" },
          OpsRamp: { "Pkg's": "3,710" },
          EDF: { "Pkg's": "7,740" },
          GLIS: { "Pkg's": "13,530" },
          GLFS: { "Pkg's": "66,010" },
        },
      });
    })
    .catch((err) => console.error("❌ Data load failed:", err));
}

/* ========================================================= VIEW → INIT RESOLVER
========================================================= */
function resolveInit(view: string) {
  switch (view) {
    case "./scheduler.html":
      return initCalendar;

    case "./datatable.html":
      return initDataTable;

    case "./index.html":
      return initDashboard;

    default:
      return undefined;
  }
}

/* ========================================================= SIDEBAR ROUTING (CORE SPA ENGINE)
========================================================= */
function initSidebarRouting() {
  console.log("Sidebar routing ready");

  document.querySelectorAll("[data-view]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();

      const target = e.currentTarget as HTMLElement;
      const view = target.getAttribute("data-view");
      if (!view) return;

      const loader = new ViewLoader("app-content");
      loader.load(view, resolveInit(view));

      setActiveMenu(target);
      history.pushState({}, "", view.replace(".html", ""));
    });
  });
}

/* ========================================================= SIDEBAR LOAD
========================================================= */
async function loadSidebar() {
  const container = document.getElementById("workos-sidebar-container");
  if (!container) return;

  const res = await fetch("./aside.html");
  container.innerHTML = await res.text();

  //@ts-ignore
  $('[data-widget="treeview"]').Treeview("init");

  // /IMPORTANT: rebind routing AFTER sidebar injected
  initSidebarRouting();
}

/* ========================================================= ACTIVE MENU
========================================================= */
function setActiveMenu(activeEl: HTMLElement) {
  document.querySelectorAll(".nav-link").forEach((el) => {
    el.classList.remove("active");
  });

  activeEl.classList.add("active");
}

/* ========================================================= APP ENTRY (CLEAN)
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("App Boot");

  await loadSidebar();
  await handleInitialRoute();
  // /Default landing
  const loader = new ViewLoader("app-content");
  loader.load("./index.html", initDashboard);
});

function handleInitialRoute() {
  const path = window.location.pathname;

  let view = "./index.html";

  if (path.includes("scheduler")) {
    view = "./scheduler.html";
  } else if (path.includes("datatable")) {
    view = "./datatable.html";
  }

  const loader = new ViewLoader("app-content");
  loader.load(view, resolveInit(view));
}

$(function () {
  const containerEl = document.getElementById("external-events");
  const calendarEl = document.getElementById("calendar");
  const checkbox = document.getElementById("drop-remove");

  // DRAGGABLE EVENTS
  new FullCalendar.Draggable(containerEl, {
    itemSelector: ".external-event",
    eventData: function (eventEl) {
      return {
        title: eventEl.innerText.trim(),
        backgroundColor: getComputedStyle(eventEl).backgroundColor,
        borderColor: getComputedStyle(eventEl).backgroundColor,
        textColor: getComputedStyle(eventEl).color,
      };
    },
  });

  // CALENDAR INIT
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    themeSystem: "bootstrap",

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },

    editable: true,
    droppable: true,

    events: [
      {
        title: "All Day Event",
        start: new Date(),
        allDay: true,
      },
      { title: "Meeting", start: new Date(), allDay: false },
    ],

    drop: function (info) {
      if (checkbox.checked) {
        alert(checkbox.checked);
        info.draggedEl.remove();
      }
    },
    eventClick: function (info) {
      const confirmDelete = confirm(
        `Do you want to remove event: "${info.event.title}" ?`,
      );

      if (confirmDelete) {
        info.event.remove();
      }
    },
  });

  calendar.render();
});
