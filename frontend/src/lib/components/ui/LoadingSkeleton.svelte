<script>
  let {
    width = '100%',
    height = '1rem',
    rounded = true,
    class: className = '',
    ...rest
  } = $props();

  const getSkeletonClasses = () => {
    let classes = 'loading-skeleton';
    
    if (rounded) {
      classes += ' rounded';
    }
    
    return `${classes} ${className}`;
  };
</script>

<div
  class={getSkeletonClasses()}
  style="width: {width}; height: {height};"
  {...rest}
></div>