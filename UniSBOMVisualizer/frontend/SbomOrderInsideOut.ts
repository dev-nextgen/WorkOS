// SbomStackedBar.ts
import * as d3 from "d3";

type GraphData = {
  sbom_data: Record<string, any>;
};

export class SbomStackedBar {
  private svg: any;
  private width = 800;
  private height = 400;
  private margin = { top: 30, right: 30, bottom: 50, left: 60 };

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

    // Convert sbom_data to counts; handle empty objects
    const dataset = Object.keys(data.sbom_data).map((team) => {
      const entries = data.sbom_data[team];
      const count = Array.isArray(entries)
        ? entries.length
        : Object.keys(entries || {}).length;
      return { team, count };
    });

    if (dataset.length === 0) return;

    // Sort descending for inside-out
    dataset.sort((a, b) => b.count - a.count);

    // Scales
    const x = d3
      .scaleBand()
      .domain(dataset.map((d) => d.team))
      .range([0, this.width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(dataset, (d) => d.count)!])
      .nice()
      .range([this.height, 0]);

    // Bars
    this.svg
      .selectAll("rect")
      .data(dataset)
      .join("rect")
      .attr("x", (d) => x(d.team)!)
      .attr("y", (d) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => this.height - y(d.count))
      .attr("fill", "#38bdf8");

    // Labels
    this.svg
      .selectAll("text.label")
      .data(dataset)
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.team)! + x.bandwidth() / 2)
      .attr("y", (d) => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .text((d) => d.count);

    // X Axis
    this.svg
      .append("g")
      .attr("transform", `translate(0, ${this.height})`)
      .call(d3.axisBottom(x));

    // Y Axis
    this.svg.append("g").call(d3.axisLeft(y));
  }
}
