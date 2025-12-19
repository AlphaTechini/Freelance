<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { authStore, initializeAuth } from '$lib/stores/auth.js';
  import { checkWalletConnection } from '$lib/services/wallet.js';
  import { warmupService } from '$lib/services/warmup.js';
  import { theme } from '$lib/stores/theme.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import WarmupStatus from '$lib/components/WarmupStatus.svelte';
  import '../app.css';

  // Declare children and data as props for Svelte 5
  let { children, data } = $props();

  // Check if current route is an auth page
  let isAuthPage = $derived($page.url.pathname.startsWith('/auth'));

  onMount(async () => {
    // Initialize theme system
    theme.init();
    
    // If we have server-provided user data, use it for immediate hydration
    if (data?.user) {
      authStore.set({
        user: data.user,
        walletAddress: data.user.walletAddress || null,
        isWalletConnected: false,
        loading: false,
        error: null
      });
    }
    
    // Start backend warmup immediately (don't wait for it)
    warmupService.warmupBackend().catch(error => {
      console.warn('Backend warmup failed, but app will continue:', error.message);
    });
    
    // Initialize auth (will verify cookie and update if needed)
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
    {@render children()}
  </main>
  
  <!-- Show warmup status when backend is starting -->
  <WarmupStatus />
</div>