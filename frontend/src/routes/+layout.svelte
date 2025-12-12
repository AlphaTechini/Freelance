<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { initializeAuth } from '$lib/stores/auth.js';
  import { checkWalletConnection } from '$lib/services/wallet.js';
  import { theme } from '$lib/stores/theme.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import '../app.css';

  // Check if current route is an auth page
  let isAuthPage = $derived($page.url.pathname.startsWith('/auth'));

  onMount(async () => {
    // Initialize theme system
    theme.init();
    
    // Initialize Firebase Auth
    await initializeAuth();
    
    // Check if wallet is already connected
    await checkWalletConnection();
  });
</script>

<div class="min-h-screen" style="background-color: var(--bg-primary); color: var(--text-primary);">
  {#if !isAuthPage}
    <Navbar />
  {/if}
  
  <main>
    <slot />
  </main>
</div>