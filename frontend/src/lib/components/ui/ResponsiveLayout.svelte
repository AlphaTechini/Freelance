<script>
  let {
    variant = 'default',
    maxWidth = 'xl',
    padding = true,
    class: className = '',
    children,
    ...rest
  } = $props();

  const getLayoutClasses = () => {
    let classes = '';
    
    // Add container class
    classes += 'container';
    
    // Add max-width class
    switch (maxWidth) {
      case 'sm':
        classes += ' container-sm';
        break;
      case 'md':
        classes += ' container-md';
        break;
      case 'lg':
        classes += ' container-lg';
        break;
      case 'xl':
        classes += ' container-xl';
        break;
      case '2xl':
        classes += ' container-2xl';
        break;
      case 'full':
        classes += ' w-full';
        break;
      default:
        classes += ' container-xl';
    }
    
    // Add variant-specific classes
    switch (variant) {
      case 'centered':
        classes += ' flex flex-col items-center justify-center min-h-screen';
        break;
      case 'sidebar':
        classes += ' flex flex-col lg:flex-row gap-6';
        break;
      case 'grid':
        classes += ' grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        break;
      default:
        // default layout
        break;
    }
    
    return `${classes} ${className}`;
  };
</script>

<div
  class={getLayoutClasses()}
  {...rest}
>
  {@render children()}
</div>