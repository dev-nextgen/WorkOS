import * as d3 from "d3";

type Node = {
  id: string;
  parent?: string;
  expanded?: boolean;
  hasData?: boolean;
};

type GraphData = {
  nodes: Node[];
  edges: any[];
  sbom_data?: Record<string, any>;
};

export class SbomFlowMatrix {
  private svg: any;
  private width = window.innerWidth;
  private height = window.innerHeight;

  private data: GraphData = { nodes: [], edges: [] };
  private nodeMap: Map<string, Node> = new Map();

  init(containerSelector: string) {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) throw new Error("Container not found");

    container.innerHTML = "";

    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.svg = d3
      .select(container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", "#0b0f17");
  }

  // ---------------- UPDATE ----------------
  update(data: GraphData) {
    // preserve expand state
    data.nodes.forEach((n) => {
      const existing = this.nodeMap.get(n.id);
      if (existing) n.expanded = existing.expanded;
      this.nodeMap.set(n.id, n);
    });

    this.data = data;

    const root = this.data.nodes.find((n) => n.id === "PCFS");
    if (!root) return;

    const nodes: Node[] = [];
    const edges: any[] = [];

    const traverse = (node: Node) => {
      nodes.push(node);

      if (node.expanded) {
        const children = this.data.nodes.filter((n) => n.parent === node.id);

        children.forEach((child) => {
          edges.push({ source: node.id, target: child.id });
          traverse(child);
        });
      }
    };

    traverse(root);
    this.render(nodes, edges);
  }

  // ---------------- HELPERS ----------------
  private hasChildren(id: string) {
    return this.data.nodes.some((n) => n.parent === id);
  }

  private hasSbomData(id: string) {
    if (!id.includes("_v1.9")) return false;

    const key = id.split("_")[0];
    const sbomList = this.data.sbom_data?.[key];

    return Array.isArray(sbomList) && sbomList.length > 0;
  }

  // ---------------- SBOM INJECTION ----------------
  private injectSbomNodes(d: Node) {
    const key = d.id.split("_")[0];
    const sbomList = this.data.sbom_data?.[key];

    if (!sbomList || !Array.isArray(sbomList) || sbomList.length === 0) {
      console.warn(`No SBOM data for ${d.id}`);
      return;
    }

    // 🔥 PRINT SBOM CHILDREN (FINAL LEVEL DEBUG / OUTPUT)
    console.log(`SBOM children for ${d.id}:`);
    console.table(
      sbomList.map((comp: any) => ({
        id: comp.id,
        name: comp.name || "N/A",
        version: comp.version || "N/A",
      })),
    );

    // 🔥 Inject real SBOM IDs
    sbomList.forEach((comp: any) => {
      const newId = comp.id;

      if (!this.nodeMap.has(newId)) {
        const newNode: Node = {
          id: newId,
          parent: d.id,
          hasData: false, // final leaf
        };

        this.data.nodes.push(newNode);
        this.nodeMap.set(newId, newNode);
      }
    });
  }

  // ---------------- RENDER ----------------
  private render(nodes: Node[], edges: any[]) {
    this.svg.selectAll("*").remove();

    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(edges)
          .id((d: any) => d.id)
          .distance(140),
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2));

    const link = this.svg
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#444")
      .attr("stroke-width", 1.5);

    const nodeGroup = this.svg
      .append("g")
      .selectAll("g")
      .data(nodes, (d: any) => d.id)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (event: any, d: Node) => {
        event.stopPropagation();

        const hasChildren = this.hasChildren(d.id);
        const hasSbom = this.hasSbomData(d.id);

        // ❌ No data case
        if (!hasChildren && !hasSbom) {
          alert("No data available");
          return;
        }

        // 🔥 Inject SBOM once
        if (!hasChildren && hasSbom) {
          this.injectSbomNodes(d);
        }

        // 🔁 Toggle expand
        d.expanded = !d.expanded;
        this.nodeMap.set(d.id, d);

        this.update(this.data);
      });

    // ---------------- NODES ----------------
    nodeGroup
      .append("circle")
      .attr("r", (d: any) => {
        if (d.id === "PCFS") return 18;
        if (d.id === "V1.9") return 14;
        if (d.id.includes("_v1.9")) return 10;
        return 6;
      })
      .attr("fill", (d: any) => {
        if (d.id === "PCFS") return "#f43f5e";
        if (d.id === "V1.9") return "#f59e0b";
        if (!this.hasChildren(d.id) && !this.hasSbomData(d.id))
          return "#6b7280"; // leaf
        if (this.hasSbomData(d.id)) return "#22c55e"; // SBOM entry
        return "#38bdf8";
      });

    nodeGroup
      .append("text")
      .text((d: any) => d.id)
      .attr("fill", "#fff")
      .attr("font-size", "11px")
      .attr("dx", 10)
      .attr("dy", 4)
      .style("pointer-events", "none");

    // ---------------- DRAG ----------------
    nodeGroup.call(
      d3
        .drag()
        .on("start", (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event: any, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );

    // ---------------- TICK ----------------
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    simulation.alpha(1).restart();
  }
}
