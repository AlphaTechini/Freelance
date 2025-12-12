<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import Navbar from '$lib/components/Navbar.svelte';
  
  let loading = $state(true);
  let error = $state('');
  
  onMount(async () => {
    // Check if user is authenticated (either Firebase user or wallet connected)
    if (!$authStore.user && !$authStore.isWalletConnected) {
      goto('/auth/login');
      return;
    }
    
    // Load user profile if not already loaded
    if ($authStore.user && !$authStore.user.profile) {
      try {
        const response = await apiService.getProfile();
        if (response.success && response.user) {
          authStore.update(store => ({
            ...store,
            user: { ...store.user, profile: response.user }
          }));
        }
      } catch (err) {
        error = 'Failed to load profile: ' + err.message;
      }
    }
    
    loading = false;
  });
</script>

<svelte:head>
  <title>Dashboard - CryptoGigs</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <Navbar />
  
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  {:else if error}
    <div class="container mx-auto px-4 py-8">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
        {error}
      </div>
    </div>
  {:else}
    <slot />
  {/if}
</div>