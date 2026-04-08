// SbomIcicleWorking.ts
import * as d3 from "d3";

type GraphData = {
  sbom_data: Record<string, any[]>;
};

export class SbomIcicle {
  private svg: any;
  private width = 800;
  private height = 500;

  init(containerSelector: string) {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) throw new Error("Container not found");

    container.innerHTML = "";
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.svg = d3
      .select(container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("background", "#0b0f17");
  }

  update(data: GraphData) {
    // Prepare hierarchical structure
    const rootData: any = {
      id: "root",
      children: Object.keys(data.sbom_data).map((key) => ({
        id: key,
        children: data.sbom_data[key].map((_, i) => ({ id: `${key}-${i}` })),
      })),
    };

    const root = d3.hierarchy(rootData).sum(() => 1);

    // partition layout
    d3.partition().size([this.width, this.height])(root as any);

    this.render(root);
  }

  private render(root: d3.HierarchyNode<any>) {
    this.svg.selectAll("*").remove();

    const g = this.svg.append("g");

    const nodes = root.descendants().filter((d) => d.depth > 0); // skip root

    g.selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", (d: any) => d.x0)
      .attr("y", (d: any) => d.y0)
      .attr("width", (d: any) => Math.max(1, d.x1 - d.x0))
      .attr("height", (d: any) => Math.max(1, d.y1 - d.y0))
      .attr("fill", (d: any) => {
        if (!d.children) return "#22c55e"; // leaf
        if (d.depth === 1) return "#f59e0b"; // top level
        return "#38bdf8";
      })
      .attr("stroke", "#000")
      .on("click", (event: any, d: any) => {
        event.stopPropagation();
        alert(`Node clicked: ${d.data.id}`);
      });

    g.selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", (d: any) => d.x0 + 2)
      .attr("y", (d: any) => d.y0 + 12)
      .attr("fill", "#fff")
      .style("font-size", "12px")
      .text((d: any) => (d.children ? d.data.id : d.data.id.split("-")[1]));
  }
}
