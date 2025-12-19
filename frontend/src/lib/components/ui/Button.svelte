<script>
  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    onclick = undefined,
    children = undefined,
    class: className = '',
    ...rest
  } = $props();

  // Use the design system classes from app.css
  const getButtonClasses = () => {
    let classes = 'btn';
    
    // Add variant classes
    switch (variant) {
      case 'primary':
        classes += ' btn-primary';
        break;
      case 'secondary':
        classes += ' btn-secondary';
        break;
      case 'ghost':
        classes += ' btn-ghost';
        break;
      case 'danger':
        classes += ' btn-primary';
        break;
      default:
        classes += ' btn-primary';
    }
    
    // Add size classes
    switch (size) {
      case 'sm':
        classes += ' btn-small';
        break;
      case 'lg':
        classes += ' btn-large';
        break;
      default:
        // md is the default size, no additional class needed
        break;
    }
    
    // Add danger styling if needed
    if (variant === 'danger') {
      classes += ' !bg-red-500 hover:!bg-red-600';
    }
    
    return `${classes} ${className}`;
  };
</script>

<button
  {type}
  {disabled}
  class={getButtonClasses()}
  onclick={(e) => {
    if (!disabled && !loading && onclick) {
      onclick(e);
    }
  }}
  {...rest}
>
  {#if loading}
    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>
