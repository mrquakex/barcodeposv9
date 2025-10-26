import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HierarchyData {
  name: string;
  value?: number;
  children?: HierarchyData[];
}

interface SunburstChartProps {
  data: HierarchyData;
  width?: number;
  height?: number;
}

export function SunburstChart({ data, width = 600, height = 600 }: SunburstChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const radius = Math.min(width, height) / 2;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create hierarchy
    const root = d3.hierarchy(data)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create partition layout
    const partition = d3.partition<HierarchyData>()
      .size([2 * Math.PI, radius]);

    partition(root);

    // Create arc generator
    const arc = d3.arc<any>()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .innerRadius((d: any) => d.y0)
      .outerRadius((d: any) => d.y1);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Add paths
    const paths = svg.selectAll('path')
      .data(root.descendants())
      .join('path')
      .attr('d', arc)
      .style('fill', (d: any) => color(d.data.name))
      .style('stroke', '#1e293b')
      .style('stroke-width', 2)
      .style('opacity', 0.8)
      .style('cursor', 'pointer');

    // Add hover effects
    paths
      .on('mouseover', function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 1)
          .style('stroke-width', 3);

        // Show tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'sunburst-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('font-size', '14px')
          .html(`<strong>${d.data.name}</strong><br/>Değer: ${d.value?.toLocaleString() || 0}`);

        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mousemove', function(event) {
        d3.select('.sunburst-tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 0.8)
          .style('stroke-width', 2);

        d3.select('.sunburst-tooltip').remove();
      });

    // Add labels for larger segments
    svg.selectAll('text')
      .data(root.descendants().filter((d: any) => d.depth && (d.x1 - d.x0) > 0.1))
      .join('text')
      .attr('transform', (d: any) => {
        const angle = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const rotate = angle - 90;
        const radius = (d.y0 + d.y1) / 2;
        return `rotate(${rotate}) translate(${radius},0) rotate(${angle > 180 ? 180 : 0})`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')
      .text((d: any) => d.data.name.length > 10 ? d.data.name.slice(0, 10) + '...' : d.data.name);

  }, [data, width, height]);

  return (
    <div className="flex items-center justify-center bg-slate-900 rounded-xl p-4">
      <svg ref={svgRef}></svg>
    </div>
  );
}


