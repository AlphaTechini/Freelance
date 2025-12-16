<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';

  let loading = $state(true);

  onMount(() => {
    // Check user role and redirect to appropriate dashboard
    const unsubscribe = authStore.subscribe((auth) => {
      if (!auth.loading && auth.user) {
        const userRole = auth.user.profile?.role || auth.user.role;
        
        if (userRole === 'recruiter') {
          goto('/dashboard/recruiter');
        } else if (userRole === 'freelancer' || userRole === 'candidate') {
          goto('/dashboard/candidate');
        } else {
          // Default to candidate dashboard if role is unclear
          goto('/dashboard/candidate');
        }
      } else if (!auth.loading && !auth.user) {
        // User not authenticated, redirect to login
        goto('/auth/login');
      }
      
      loading = false;
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  <title>Dashboard - MeritStack</title>
</svelte:head>

{#if loading}
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p class="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <p class="text-gray-600 dark:text-gray-400">Redirecting...</p>
    </div>
  </div>
{/if}
</svelte:parameter>
</invoke>