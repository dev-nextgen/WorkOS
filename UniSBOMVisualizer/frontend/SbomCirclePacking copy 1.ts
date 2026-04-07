import * as d3 from "d3";

type Node = {
  id: string;
  parent?: string;
  expanded?: boolean;
  hasData?: boolean;
};

type GraphData = {
  nodes: Node[];
  sbom_data?: Record<string, any>;
};

export class SbomCirclePacking {
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
            hasData: false, // leaf
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
      if (existing) n.expanded = existing.expanded;
      this.nodeMap.set(n.id, n);
    });
    this.data = data;

    // inject all SBOM leaves BEFORE hierarchy creation
    this.injectAllSbomLeaves();

    // build hierarchy for circle packing
    const root = d3
      .stratify<Node>()
      .id((d) => d.id)
      .parentId((d) => d.parent || null)(this.data.nodes)
      .sum(() => 1) // uniform size
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const diameter = Math.min(this.width, this.height);
    const pack = d3.pack<Node>().size([diameter, diameter]).padding(5);
    pack(root as any);

    this.render(root);
  }

  private render(root: d3.HierarchyNode<Node>) {
    this.svg.selectAll("*").remove();

    const g = this.svg
      .append("g")
      .attr("transform", `translate(${this.width / 2},${this.height / 2})`);

    const nodes = root.descendants();

    const circle = g
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => d.r)
      .attr("cx", (d: any) => d.x - this.width / 2)
      .attr("cy", (d: any) => d.y - this.height / 2)
      .attr("fill", (d: any) => {
        if (!d.children) return "#22c55e"; // SBOM leaf
        if (d.depth === 1) return "#f59e0b"; // 1st level
        return "#38bdf8"; // other internal
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .on("click", (event: any, d: any) => {
        event.stopPropagation();
        alert(`Node clicked: ${d.data.id}`);
      });

    const label = g
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", (d: any) => d.x - this.width / 2)
      .attr("y", (d: any) => d.y - this.height / 2)
      .attr("dy", "0.3em")
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .style("font-size", (d: any) => `${10 + 2 * d.depth}px`)
      .text((d: any) => {
        if (d.depth === 1) {
          // truncate 5 chars + "..."
          return d.data.id.length > 5
            ? d.data.id.slice(0, 5) + "..."
            : d.data.id;
        }
        return d.data.id;
      });
  }
}
