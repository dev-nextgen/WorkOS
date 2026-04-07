// SbomIcicle.ts
import * as d3 from "d3";

type Node = {
  id: string;
  parent?: string;
  hasData?: boolean;
};

type GraphData = {
  nodes: Node[];
  sbom_data?: Record<string, any>;
};

export class SbomIcicle {
  private svg: any;
  private width = window.innerWidth;
  private height = window.innerHeight;
  private data: GraphData = { nodes: [] };
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

  private injectAllSbomLeaves() {
    if (!this.data.sbom_data) return;

    Object.keys(this.data.sbom_data).forEach((key) => {
      const sbomList = this.data.sbom_data![key];
      if (!Array.isArray(sbomList)) return;

      sbomList.forEach((comp: any) => {
        const parentId = key;
        if (!this.nodeMap.has(comp.id)) {
          const newNode: Node = {
            id: comp.id,
            parent: parentId,
            hasData: false,
          };
          this.data.nodes.push(newNode);
          this.nodeMap.set(comp.id, newNode);
        }
      });
    });
  }

  update(data: GraphData) {
    // store expand state
    data.nodes.forEach((n) => {
      const existing = this.nodeMap.get(n.id);
      if (existing) n.hasData = existing.hasData;
      this.nodeMap.set(n.id, n);
    });
    this.data = data;

    this.injectAllSbomLeaves();

    // hierarchy
    const root = d3
      .stratify<Node>()
      .id((d) => d.id)
      .parentId((d) => d.parent || null)(this.data.nodes)
      .sum(() => 1) // uniform value
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const partitionLayout = d3
      .partition<Node>()
      .size([this.width, this.height]);
    partitionLayout(root as any);

    this.render(root);
  }

  private render(root: d3.HierarchyNode<Node>) {
    this.svg.selectAll("*").remove();

    const g = this.svg.append("g");

    const nodes = root.descendants();

    // rectangle for each node
    g.selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", (d: any) => d.x0)
      .attr("y", (d: any) => d.y0)
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("fill", (d: any) => {
        if (!d.children) return "#22c55e"; // leaf
        if (d.depth === 1) return "#f59e0b"; // first-level
        return "#38bdf8"; // internal
      })
      .attr("stroke", "#000")
      .on("click", (event: any, d: any) => {
        event.stopPropagation();
        alert(`Node clicked: ${d.data.id}`);
      });

    // labels
    g.selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", (d: any) => d.x0 + 5)
      .attr("y", (d: any) => d.y0 + 20)
      .attr("fill", "#fff")
      .style("font-size", "12px")
      .text((d: any) => {
        if (d.depth === 0) return d.data.id;
        if (d.depth === 1)
          return d.data.id.length > 10
            ? d.data.id.slice(0, 10) + "..."
            : d.data.id;
        return "";
      });
  }
}
