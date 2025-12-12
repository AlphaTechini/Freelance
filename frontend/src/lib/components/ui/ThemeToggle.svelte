<script>
  import { theme } from '$lib/stores/theme.js';
  import { onMount } from 'svelte';

  let mounted = false;

  onMount(() => {
    theme.init();
    mounted = true;
  });

  function toggleTheme() {
    theme.toggle();
  }
</script>

{#if mounted}
  <button
    class="theme-toggle"
    onclick={toggleTheme}
    aria-label="Toggle theme"
    title="Toggle between light and dark mode"
  >
    {#if $theme === 'light'}
      <!-- Moon icon for dark mode -->
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    {:else}
      <!-- Sun icon for light mode -->
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    {/if}
  </button>
{/if}