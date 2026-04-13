import * as d3 from "d3";

type SbomData = {
  sbom_data: Record<string, { ["Pkg's"]: number | string }>;
};

type Transformed = {
  team: string;
  count: number;
};

export class SbomHorizontalBar {
  private svg: any;
  private width = "100%";
  private height = "100%";

  private margin = { top: 20, right: 40, bottom: 40, left: 120 };

  init(containerSelector: string) {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) throw new Error("Container not found");

    container.innerHTML = "";
    if (container.style.height || container.clientHeight === 0) {
      container.style.height = "100%";
    }
    this.width = container.clientWidth;
    this.radius = Math.min(this.width, container.clientHeight) / 2;

    this.width = container.clientWidth || 800;
    this.height = container.clientHeight || 400;

    this.svg = d3
      .select(container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("background", "#000000");
  }

  update(data: SbomData) {
    if (!data?.sbom_data) return;

    //Transform data (handle "4,710" → 4710)
    const transformed: Transformed[] = Object.entries(data.sbom_data).map(
      ([team, obj]) => {
        let raw = obj["Pkg's"];

        let count =
          typeof raw === "string" ? parseInt(raw.replace(/,/g, ""), 10) : raw;

        return {
          team,
          count: count || 0,
        };
      },
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
      .attr("width", 0)
      .attr("fill", "#00B388")
      .transition()
      .duration(800)
      .attr("width", (d) => x(d.count));

    //Value Labels (formatted back with commas)
    g.selectAll(".label")
      .data(data)
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.count) + 5)
      .attr("y", (d) => y(d.team)! + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("fill", "#fff")
      .style("font-size", "10px")
      .text((d) => d3.format(",")(d.count));

    //X Axis (formatted)
    g.append("g")
      .call(d3.axisTop(x).ticks(5).tickFormat(d3.format(",")))
      .selectAll("text")
      .attr("fill", "#fff");

    g.selectAll(".domain, .tick line").attr("stroke", "#555");

    //Y Axis
    g.append("g").call(d3.axisLeft(y)).selectAll("text").attr("fill", "orange");

    g.selectAll(".domain, .tick line").attr("stroke", "#555");
  }
}
