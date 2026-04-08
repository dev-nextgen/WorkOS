import * as d3 from "d3";

type SbomData = {
  sbom_data: Record<string, any[]>;
};

type Transformed = {
  team: string;
  count: number;
};

export class SbomHorizontalBar {
  private svg: any;
  private width = 800;
  private height = 400;

  private margin = { top: 20, right: 40, bottom: 40, left: 120 };

  init(containerSelector: string) {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) throw new Error("Container not found");

    container.innerHTML = "";

    this.width = container.clientWidth || 800;
    this.height = container.clientHeight || 400;

    this.svg = d3
      .select(container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("background", "#0b0f17");
  }

  update(data: SbomData) {
    if (!data?.sbom_data) return;

    //Transform data
    const transformed: Transformed[] = Object.entries(data.sbom_data).map(
      ([team, arr]) => ({
        team,
        count: Array.isArray(arr) ? arr.length : 0,
      }),
    );

    // OPTIONAL: sort descending
    transformed.sort((a, b) => b.count - a.count);

    this.render(transformed);
  }

  private render(data: Transformed[]) {
    this.svg.selectAll("*").remove();

    const { top, right, bottom, left } = this.margin;

    const innerWidth = this.width - left - right;
    const innerHeight = this.height - top - bottom;

    const g = this.svg
      .append("g")
      .attr("transform", `translate(${left},${top})`);

    //Scales
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) || 1])
      .range([0, innerWidth]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.team))
      .range([0, innerHeight])
      .padding(0.2);

    //Bars
    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("y", (d) => y(d.team)!)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", 0) // start from 0 for animation
      .attr("fill", "#38bdf8")
      .transition()
      .duration(800)
      .attr("width", (d) => x(d.count));

    //Value Labels
    g.selectAll(".label")
      .data(data)
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.count) + 5)
      .attr("y", (d) => y(d.team)! + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("fill", "#ffffff")
      .style("font-size", "12px")
      .text((d) => d.count);

    //X Axis
    g.append("g")
      .call(d3.axisTop(x).ticks(5))
      .selectAll("text")
      .attr("fill", "#ffffff");

    g.selectAll(".domain, .tick line").attr("stroke", "#555");

    //Y Axis
    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "#ffffff");

    g.selectAll(".domain, .tick line").attr("stroke", "#555");
  }
}
