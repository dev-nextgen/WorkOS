// SbomHeatmap.ts
import * as d3 from "d3";

type GraphData = {
  sbom_data: Record<string, any[]>;
};

export class SbomHeatmap {
  private svg: any;
  private width = 800;
  private height = 400;
  private margin = { top: 50, right: 50, bottom: 50, left: 60 };

  init(containerSelector: string) {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) throw new Error("Container not found");

    container.innerHTML = "";
    this.width = container.clientWidth - this.margin.left - this.margin.right;
    this.height = container.clientHeight - this.margin.top - this.margin.bottom;

    this.svg = d3
      .select(container)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  update(data: GraphData) {
    this.svg.selectAll("*").remove();

    const teams = Object.keys(data.sbom_data);
    const maxCount =
      d3.max(teams.map((t) => data.sbom_data[t]?.length || 0)) || 1;

    // Generate heatmap cells: for each team, for each count index
    const heatmapData: { team: string; level: number }[] = [];
    teams.forEach((team) => {
      const count = data.sbom_data[team]?.length || 0;
      for (let i = 1; i <= maxCount; i++) {
        heatmapData.push({ team, level: i <= count ? i : 0 });
      }
    });

    // Scales
    const x = d3.scaleBand().domain(teams).range([0, this.width]).padding(0.1);

    const y = d3
      .scaleBand()
      .domain(d3.range(1, maxCount + 1).map(String))
      .range([this.height, 0])
      .padding(0.05);

    const color = d3
      .scaleSequential(d3.interpolateGreens)
      .domain([0, maxCount]);

    // Cells
    this.svg
      .selectAll("rect")
      .data(heatmapData)
      .join("rect")
      .attr("x", (d) => x(d.team)!)
      .attr("y", (d) => y(d.level.toString())!)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", (d) => (d.level > 0 ? color(d.level) : "#1f2937"))
      .attr("stroke", "#000");

    // X Axis
    this.svg
      .append("g")
      .attr("transform", `translate(0, ${this.height})`)
      .call(d3.axisBottom(x));

    // Y Axis
    this.svg.append("g").call(d3.axisLeft(y).tickFormat(d3.format("d")));
  }
}
