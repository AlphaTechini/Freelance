<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  
  let loading = $state(true);
  let error = $state('');
  let recruiter = $state(null);
  
  onMount(async () => {
    await loadRecruiterData();
  });
  
  async function loadRecruiterData() {
    try {
      loading = true;
      error = '';
      
      // Check if user is a recruiter
      if (!$authStore.user || $authStore.user.role !== 'recruiter') {
        goto('/dashboard/candidate');
        return;
      }
      
      // Load recruiter profile
      const recruiterResponse = await apiService.getRecruiterProfile();
      if (recruiterResponse.success && recruiterResponse.recruiter) {
        recruiter = recruiterResponse.recruiter;
      }
      
    } catch (err) {
      error = 'Failed to load recruiter data: ' + err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-7xl mx-auto">
    {#if error}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
        {error}
      </div>
    {/if}
    
    {@render children({ recruiter, loading })}
  </div>
</div>