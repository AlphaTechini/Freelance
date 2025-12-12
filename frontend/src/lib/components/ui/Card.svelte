<script>
  let {
    variant = 'default',
    size = 'default',
    clickable = false,
    class: className = '',
    onclick = null,
    children,
    ...rest
  } = $props();

  const getCardClasses = () => {
    let classes = 'card';
    
    // Add size classes
    switch (size) {
      case 'compact':
        classes += ' card-compact';
        break;
      case 'large':
        classes += ' card-large';
        break;
      default:
        // default size, no additional class needed
        break;
    }
    
    // Add clickable class if needed
    if (clickable || onclick) {
      classes += ' card-clickable';
    }
    
    return `${classes} ${className}`;
  };
</script>

<div
  class={getCardClasses()}
  onclick={onclick}
  role={clickable || onclick ? 'button' : undefined}
  tabindex={clickable || onclick ? 0 : undefined}
  {...rest}
>
  {@render children()}
</div>