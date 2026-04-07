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

export class SbomCirclePacking {
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

  update(data: GraphData) {
    // preserve expand state
    data.nodes.forEach((n) => {
      const existing = this.nodeMap.get(n.id);
      if (existing) n.expanded = existing.expanded;
      this.nodeMap.set(n.id, n);
    });

    this.data = data;

    // Convert nodes to hierarchical structure
    const root = d3
      .stratify<Node>()
      .id((d) => d.id)
      .parentId((d) => d.parent || null)(this.data.nodes)
      .sum((d) => (d.hasData ? 1 : 0)) // for size
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const packLayout = d3.pack().size([this.width, this.height]).padding(5);

    packLayout(root as any);

    this.render(root);
  }

  private hasSbomData(id: string) {
    if (!id.includes("_v1.9")) return false;

    const key = id.split("_")[0];
    const sbomList = this.data.sbom_data?.[key];

    return Array.isArray(sbomList) && sbomList.length > 0;
  }

  private injectSbomNodes(d: Node) {
    const key = d.id.split("_")[0];
    const sbomList = this.data.sbom_data?.[key];

    if (!sbomList || !Array.isArray(sbomList) || sbomList.length === 0) {
      console.warn(`No SBOM data for ${d.id}`);
      return;
    }

    sbomList.forEach((comp: any) => {
      const newId = comp.id;

      if (!this.nodeMap.has(newId)) {
        const newNode: Node = {
          id: newId,
          parent: d.id,
          hasData: false,
        };

        this.data.nodes.push(newNode);
        this.nodeMap.set(newId, newNode);
      }
    });
  }

  private render(root: d3.HierarchyNode<Node>) {
    this.svg.selectAll("*").remove();

    const focus = root;
    const nodes = root.descendants();
    const view = [0, 0, this.width, this.height];

    const g = this.svg.append("g");

    const circle = g
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("fill", (d: any) => {
        if (!d.children) return "#22c55e"; // SBOM leaf
        return d.depth === 1 ? "#f59e0b" : "#38bdf8";
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .on("click", (event: any, d: any) => {
        event.stopPropagation();

        // Inject SBOM if leaf
        if (!d.children && this.hasSbomData(d.data.id)) {
          this.injectSbomNodes(d.data);
          this.update(this.data); // re-render
        }
      });

    const label = g
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dy", "0.3em")
      .attr("fill", "#fff")
      .style("font-size", (d: any) => `${10 + 2 * d.depth}px`)
      .style("text-anchor", "middle")
      .text((d: any) => d.data.id);

    const pack = (root: any) => {
      const diameter = Math.min(this.width, this.height);
      const packLayout = d3.pack().size([diameter, diameter]).padding(5);
      packLayout(root);
    };

    pack(root as any);

    const zoom = (event: any, d: any) => {
      const focus0 = focus;
      focus = d;

      const transition = this.svg
        .transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", () => {
          const i = d3.interpolateZoom(
            [focus0.x, focus0.y, focus0.r * 2],
            [focus.x, focus.y, focus.r * 2],
          );
          return (t: any) => this.zoomTo(i(t));
        });
    };

    circle.on("click", zoom);

    this.zoomTo([root.x, root.y, root.r * 2]);
  }

  private zoomTo(v: [number, number, number]) {
    const k = this.width / v[2];
    const g = this.svg.select("g");
    g.attr(
      "transform",
      `translate(${this.width / 2 - v[0] * k},${this.height / 2 - v[1] * k}) scale(${k})`,
    );

    g.selectAll("circle").attr("r", (d: any) => d.r);
    g.selectAll("text")
      .attr("x", (d: any) => d.x)
      .attr("y", (d: any) => d.y);
  }
}
