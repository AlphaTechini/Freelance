<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { initializeAuth } from '$lib/stores/auth.js';
  import { checkWalletConnection } from '$lib/services/wallet.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import '../app.css';

  // Check if current route is an auth page
  let isAuthPage = $derived($page.url.pathname.startsWith('/auth'));

  onMount(async () => {
    // Initialize Firebase Auth
    await initializeAuth();
    
    // Check if wallet is already connected
    await checkWalletConnection();
  });
</script>

<div class="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
  {#if !isAuthPage}
    <Navbar />
  {/if}
  
  <main>
    <slot />
  </main>
</div>

<style>
  :global(html) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>