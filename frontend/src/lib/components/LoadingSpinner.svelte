<script>
  export let size = 'md'; // 'sm', 'md', 'lg'
  export let color = 'primary'; // 'primary', 'secondary', 'white'
  export let text = '';
  export let inline = false;
</script>

<div class="loading-container" class:inline>
  <div class="spinner" class:spinner-sm={size === 'sm'} class:spinner-lg={size === 'lg'} class:spinner-{color}></div>
  {#if text}
    <p class="loading-text">{text}</p>
  {/if}
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
  }

  .loading-container.inline {
    flex-direction: row;
    padding: 0;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid transparent;
    border-top: 2px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner-sm {
    width: 1rem;
    height: 1rem;
    border-width: 1px;
  }

  .spinner-lg {
    width: 3rem;
    height: 3rem;
    border-width: 3px;
  }

  .spinner-primary {
    border-top-color: var(--color-primary);
  }

  .spinner-secondary {
    border-top-color: var(--color-secondary);
  }

  .spinner-white {
    border-top-color: white;
  }

  .loading-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .inline .loading-text {
    font-size: 0.75rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>