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

export class SbomSunburst {
  private svg: any;
  private width = window.innerWidth;
  private radius = Math.min(this.width, window.innerHeight) / 2;

  private data: GraphData = { nodes: [], edges: [] };
  private nodeMap: Map<string, Node> = new Map();

  init(containerSelector: string) {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) throw new Error("Container not found");

    container.innerHTML = "";

    this.width = container.clientWidth;
    this.radius = Math.min(this.width, container.clientHeight) / 2;

    this.svg = d3
      .select(container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", "#0b0f17")
      .append("g")
      .attr(
        "transform",
        `translate(${this.width / 2}, ${container.clientHeight / 2})`,
      );
  }

  // ---------------- UPDATE ----------------
  update(data: GraphData) {
    data.nodes.forEach((n) => {
      const existing = this.nodeMap.get(n.id);
      if (existing) n.expanded = existing.expanded;
      this.nodeMap.set(n.id, n);
    });

    this.data = data;

    const root = this.buildHierarchy("PCFS");
    this.render(root);
  }

  // ---------------- BUILD TREE ----------------
  private buildHierarchy(rootId: string): any {
    const build = (id: string): any => {
      const node = this.nodeMap.get(id);
      if (!node) return null;

      let children: any[] = [];

      if (node.expanded) {
        const directChildren = this.data.nodes.filter((n) => n.parent === id);

        children = directChildren
          .map((child) => build(child.id))
          .filter(Boolean);
      }

      // 🔥 Inject SBOM as children
      if (this.hasSbomData(id)) {
        const key = id.split("_")[0];
        const sbomList = this.data.sbom_data?.[key] || [];

        children = children.concat(
          sbomList.map((comp: any) => ({
            id: comp.id,
            value: 1,
            isSbom: true,
          })),
        );
      }

      return {
        id,
        children: children.length ? children : null,
        value: children.length ? undefined : 1,
      };
    };

    return build(rootId);
  }

  private hasSbomData(id: string) {
    if (!id.includes("_v1.9")) return false;
    const key = id.split("_")[0];
    const sbom = this.data.sbom_data?.[key];
    return Array.isArray(sbom) && sbom.length > 0;
  }

  // ---------------- RENDER ----------------
  private render(rootData: any) {
    this.svg.selectAll("*").remove();

    const root = d3
      .hierarchy(rootData)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => b.value - a.value);

    const partition = d3.partition().size([2 * Math.PI, this.radius]);
    partition(root);

    const arc = d3
      .arc<any>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => d.y1);

    const color = (d: any) => {
      if (d.data.id === "PCFS") return "#00B388";
      if (d.depth === 1) return "#6b7280";
      if (d.data.isSbom) return "#22c55e";
      if (!d.children) return "#6b7000";
      return "#38bdf8";
    };

    const path = this.svg
      .selectAll("path")
      .data(root.descendants())
      .join("path")
      .attr("d", arc)
      .attr("fill", color)
      .attr("stroke", "#0b0f17")
      .on("click", (event: any, d: any) => {
        event.stopPropagation();

        const id = d.data.id;

        // SBOM leaf
        if (d.data.isSbom) {
          console.log("SBOM Component:", d.data);
          return;
        }

        const node = this.nodeMap.get(id);
        if (!node) return;

        // toggle expand
        node.expanded = !node.expanded;
        this.nodeMap.set(id, node);

        this.update(this.data);
      });

    // ---------------- LABELS ----------------
    this.svg
      .selectAll("text")
      .data(root.descendants().filter((d) => d.x1 - d.x0 > 0.05))
      .join("text")
      .attr("transform", (d: any) => {
        const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dx", "-10")
      .attr("dy", ".5em")
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .text((d: any) => d.data.id);
  }
}
