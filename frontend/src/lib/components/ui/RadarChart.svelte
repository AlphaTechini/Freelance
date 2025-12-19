<script>
  // Props using Svelte 5 syntax
  let {
    data = [],
    width = 300,
    height = 300,
    maxValue = 100,
    levels = 5,
    strokeColor = '#8b5cf6',
    fillColor = 'rgba(139, 92, 246, 0.3)',
    fillOpacity = 0.3,
    strokeWidth = 2,
    dotRadius = 4,
    labelOffset = 25
  } = $props();
  
  let center = $derived({ x: width / 2, y: height / 2 });
  let radius = $derived(Math.min(width, height) / 2 - 50);
  
  // Calculate points for the radar chart
  let points = $derived(data.map((item, index) => {
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
  }));
  
  // Generate level circles
  let levelCircles = $derived(Array.from({ length: levels }, (_, i) => {
    return ((i + 1) / levels) * radius;
  }));
  
  // Generate axis lines
  let axisLines = $derived(data.map((item, index) => {
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
  }));
  
  // Generate path string for the filled area
  let pathString = $derived(points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`
    : '');
  
  function getScoreColor(value) {
    if (value >= 80) return '#22c55e'; // green
    if (value >= 60) return '#eab308'; // yellow
    if (value >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  }
</script>

<div class="radar-chart-container flex flex-col items-center">
  <svg {width} {height} class="overflow-visible">
    <!-- Background circles (levels) -->
    {#each levelCircles as levelRadius}
      <circle
        cx={center.x}
        cy={center.y}
        r={levelRadius}
        fill="none"
        stroke="currentColor"
        stroke-opacity="0.1"
        stroke-width="1"
        class="text-gray-400 dark:text-gray-600"
      />
    {/each}
    
    <!-- Axis lines -->
    {#each axisLines as axis}
      <line
        x1={axis.x1}
        y1={axis.y1}
        x2={axis.x2}
        y2={axis.y2}
        stroke="currentColor"
        stroke-opacity="0.2"
        stroke-width="1"
        class="text-gray-400 dark:text-gray-600"
      />
    {/each}
    
    <!-- Data area -->
    {#if points.length > 0}
      <path
        d={pathString}
        fill={fillColor}
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
        fill={strokeColor}
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
        font-size="11"
        font-weight="500"
        fill="currentColor"
        dominant-baseline="middle"
        class="text-gray-700 dark:text-gray-300"
      >
        {axis.label}
      </text>
    {/each}
  </svg>
</div>
