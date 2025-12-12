<script>
  let {
    columns = { sm: 1, md: 2, lg: 3, xl: 4 },
    gap = 4,
    class: className = '',
    children,
    ...rest
  } = $props();

  const getGridClasses = () => {
    let classes = 'grid';
    
    // Add gap class
    classes += ` gap-${gap}`;
    
    // Add responsive column classes
    classes += ` grid-cols-${columns.sm || 1}`;
    
    if (columns.md) {
      classes += ` md:grid-cols-${columns.md}`;
    }
    
    if (columns.lg) {
      classes += ` lg:grid-cols-${columns.lg}`;
    }
    
    if (columns.xl) {
      classes += ` xl:grid-cols-${columns.xl}`;
    }
    
    return `${classes} ${className}`;
  };
</script>

<div
  class={getGridClasses()}
  {...rest}
>
  {@render children()}
</div>