<script>
  import { onMount } from 'svelte';
  
  // Props
  export let data = [];
  export let width = 300;
  export let height = 300;
  export let maxValue = 100;
  export let levels = 5;
  export let strokeColor = '#ff6b35';
  export let fillColor = '#ff6b35';
  export let fillOpacity = 0.2;
  export let strokeWidth = 2;
  export let dotRadius = 4;
  export let labelOffset = 20;
  
  let svgElement;
  let center = { x: width / 2, y: height / 2 };
  let radius = Math.min(width, height) / 2 - 40;
  
  // Calculate points for the radar chart
  $: points = data.map((item, index) => {
    const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
    const value = Math.min(item.value, maxValue);
    const distance = (value / maxValue) * radius;
    return {
      x: center.x + Math.cos(angle) * distance,
      y: center.y + Math.sin(angle) * distance,
      angle,
      value: item.value,
      label: item.label
    };
  });
  
  // Generate level circles
  $: levelCircles = Array.from({ length: levels }, (_, i) => {
    const levelRadius = ((i + 1) / levels) * radius;
    return levelRadius;
  });
  
  // Generate axis lines
  $: axisLines = data.map((item, index) => {
    const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
    return {
      x1: center.x,
      y1: center.y,
      x2: center.x + Math.cos(angle) * radius,
      y2: center.y + Math.sin(angle) * radius,
      labelX: center.x + Math.cos(angle) * (radius + labelOffset),
      labelY: center.y + Math.sin(angle) * (radius + labelOffset),
      label: item.label,
      anchor: Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle'
    };
  });
  
  // Generate path string for the filled area
  $: pathString = points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`
    : '';
  
  // Generate level labels
  $: levelLabels = Array.from({ length: levels }, (_, i) => {
    const value = Math.round(((i + 1) / levels) * maxValue);
    return {
      value,
      y: center.y - ((i + 1) / levels) * radius
    };
  });
  
  function getScoreColor(value) {
    if (value >= 80) return 'var(--success-color)'; // green
    if (value >= 60) return 'var(--warning-color)'; // yellow
    if (value >= 40) return 'var(--accent-color)'; // orange
    return 'var(--error-color)'; // red
  }
</script>

<div class="radar-chart-container">
  <svg bind:this={svgElement} {width} {height} class="radar-chart">
    <!-- Background circles (levels) -->
    {#each levelCircles as levelRadius}
      <circle
        cx={center.x}
        cy={center.y}
        r={levelRadius}
        fill="none"
        stroke="var(--border-color)"
        stroke-width="1"
      />
    {/each}
    
    <!-- Level labels -->
    {#each levelLabels as level}
      <text
        x={center.x + 5}
        y={level.y}
        font-size="10"
        fill="var(--text-secondary)"
      >
        {level.value}
      </text>
    {/each}
    
    <!-- Axis lines -->
    {#each axisLines as axis}
      <line
        x1={axis.x1}
        y1={axis.y1}
        x2={axis.x2}
        y2={axis.y2}
        stroke="var(--border-color)"
        stroke-width="1"
      />
    {/each}
    
    <!-- Data area -->
    {#if points.length > 0}
      <path
        d={pathString}
        fill={fillColor}
        fill-opacity={fillOpacity}
        stroke={strokeColor}
        stroke-width={strokeWidth}
        stroke-linejoin="round"
      />
    {/if}
    
    <!-- Data points -->
    {#each points as point}
      <circle
        cx={point.x}
        cy={point.y}
        r={dotRadius}
        fill={getScoreColor(point.value)}
        stroke="white"
        stroke-width="2"
      />
    {/each}
    
    <!-- Axis labels -->
    {#each axisLines as axis}
      <text
        x={axis.labelX}
        y={axis.labelY}
        text-anchor={axis.anchor}
        font-size="12"
        font-weight="500"
        fill="var(--text-primary)"
        dominant-baseline="middle"
      >
        {axis.label}
      </text>
    {/each}
  </svg>
  
  <!-- Legend -->
  <div class="mt-4 flex flex-wrap justify-center gap-4 text-sm">
    {#each data as item}
      <div class="flex items-center gap-2">
        <div 
          class="w-3 h-3 rounded-full border-2 border-white"
          style="background-color: {getScoreColor(item.value)}"
        ></div>
        <span style="color: var(--text-primary)">
          {item.label}: {item.value}
        </span>
      </div>
    {/each}
  </div>
</div>

<style>
  .radar-chart-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .radar-chart {
    overflow: visible;
  }
</style>