<script>
  import { createEventDispatcher } from 'svelte';
  
  let {
    open = false,
    title = '',
    size = 'md',
    closable = true,
    class: className = '',
    children,
    ...rest
  } = $props();

  const dispatch = createEventDispatcher();

  function closeModal() {
    if (closable) {
      dispatch('close');
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && closable) {
      closeModal();
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && closable) {
      closeModal();
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-2xl';
    }
  };
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 fade-in"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div
      class="card w-full {getSizeClasses()} max-h-[90vh] overflow-y-auto scale-in {className}"
      {...rest}
    >
      {#if title || closable}
        <div class="flex items-center justify-between mb-6">
          {#if title}
            <h2 id="modal-title" class="heading-3">{title}</h2>
          {/if}
          
          {#if closable}
            <button
              class="btn-ghost !p-2 !min-h-auto ml-auto"
              onclick={closeModal}
              aria-label="Close modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          {/if}
        </div>
      {/if}
      
      <div class="modal-content">
        {@render children()}
      </div>
    </div>
  </div>
{/if}