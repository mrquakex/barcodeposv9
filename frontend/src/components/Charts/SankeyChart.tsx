import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';

interface SankeyData {
  nodes: Array<{ name: string }>;
  links: Array<{ source: number; target: number; value: number }>;
}

interface SankeyChartProps {
  data: SankeyData;
  width?: number;
  height?: number;
}

export function SankeyChart({ data, width = 800, height = 500 }: SankeyChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create sankey generator
    const sankeyGenerator = sankey<SankeyNode<any, any>, SankeyLink<any, any>>()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([[margin.left, margin.top], [innerWidth, innerHeight]]);

    // Generate layout
    const graph = sankeyGenerator(data as any);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add links
    svg.append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any) => color(d.source.name))
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.5)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8);

        // Tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'sankey-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`${d.source.name} → ${d.target.name}<br/>Değer: ${d.value.toLocaleString()}`);

        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mousemove', function(event) {
        d3.select('.sankey-tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.5);

        d3.select('.sankey-tooltip').remove();
      });

    // Add nodes
    const nodes = svg.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => color(d.name))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add node labels
    svg.append('g')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', (d: any) => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < width / 2 ? 'start' : 'end')
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .text((d: any) => d.name);

  }, [data, width, height]);

  return (
    <div className="bg-slate-900 rounded-xl p-4">
      <svg ref={svgRef}></svg>
    </div>
  );
}


