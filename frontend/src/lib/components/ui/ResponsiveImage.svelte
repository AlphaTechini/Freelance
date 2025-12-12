<script>
  let {
    src = '',
    alt = '',
    width = 'auto',
    height = 'auto',
    aspectRatio = null,
    objectFit = 'cover',
    loading = 'lazy',
    placeholder = null,
    class: className = '',
    ...rest
  } = $props();

  let imageLoaded = $state(false);
  let imageError = $state(false);

  function handleLoad() {
    imageLoaded = true;
  }

  function handleError() {
    imageError = true;
  }

  const getImageClasses = () => {
    let classes = 'responsive-image';
    
    if (aspectRatio) {
      classes += ` aspect-${aspectRatio}`;
    }
    
    return `${classes} ${className}`;
  };

  const getImageStyles = () => {
    let styles = '';
    
    if (width !== 'auto') {
      styles += `width: ${typeof width === 'number' ? width + 'px' : width};`;
    }
    
    if (height !== 'auto') {
      styles += `height: ${typeof height === 'number' ? height + 'px' : height};`;
    }
    
    styles += `object-fit: ${objectFit};`;
    
    return styles;
  };
</script>

<div class="responsive-image-container {className}">
  {#if !imageLoaded && !imageError && placeholder}
    <div class="image-placeholder">
      {#if typeof placeholder === 'string'}
        <div class="loading-skeleton" style="width: 100%; height: 100%;"></div>
      {:else}
        {@render placeholder()}
      {/if}
    </div>
  {/if}

  {#if !imageError}
    <img
      {src}
      {alt}
      {loading}
      class={getImageClasses()}
      style={getImageStyles()}
      onload={handleLoad}
      onerror={handleError}
      {...rest}
    />
  {:else}
    <div class="image-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
        <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="body-small">Failed to load image</span>
    </div>
  {/if}
</div>

<style>
  .responsive-image-container {
    position: relative;
    overflow: hidden;
  }

  .responsive-image {
    width: 100%;
    height: auto;
    display: block;
    transition: opacity 0.3s ease;
  }

  .image-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-secondary);
  }

  .image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    min-height: 200px;
    gap: 1rem;
  }

  /* Aspect ratio utilities */
  .aspect-square {
    aspect-ratio: 1 / 1;
  }

  .aspect-video {
    aspect-ratio: 16 / 9;
  }

  .aspect-4-3 {
    aspect-ratio: 4 / 3;
  }

  .aspect-3-2 {
    aspect-ratio: 3 / 2;
  }

  .aspect-2-1 {
    aspect-ratio: 2 / 1;
  }
</style>