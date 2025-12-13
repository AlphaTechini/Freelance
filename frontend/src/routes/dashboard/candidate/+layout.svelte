<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';
  
  let loading = $state(true);
  let error = $state('');
  let candidate = $state(null);
  let portfolioAnalysis = $state(null);
  let analysisLoading = $state(false);
  
  onMount(async () => {
    await loadCandidateData();
  });
  
  async function loadCandidateData() {
    try {
      loading = true;
      error = '';
      
      // Check if user is a candidate
      if (!$authStore.user || $authStore.user.role === 'recruiter') {
        goto('/dashboard/recruiter');
        return;
      }
      
      // Load candidate profile
      const candidateResponse = await apiService.getCandidateProfile($authStore.user.username);
      if (candidateResponse.success && candidateResponse.candidate) {
        candidate = candidateResponse.candidate;
      }
      
      // Load portfolio analysis if available
      await loadPortfolioAnalysis();
      
    } catch (err) {
      error = 'Failed to load candidate data: ' + err.message;
    } finally {
      loading = false;
    }
  }
  
  async function loadPortfolioAnalysis() {
    try {
      if (!candidate?.username) return;
      
      const analysisResponse = await apiService.getPortfolioAnalysis(candidate.username);
      if (analysisResponse.success && analysisResponse.analysis) {
        portfolioAnalysis = analysisResponse.analysis;
      }
    } catch (err) {
      console.error('Failed to load portfolio analysis:', err);
    }
  }
  
  async function handleReanalyze() {
    try {
      analysisLoading = true;
      
      const response = await apiService.analyzePortfolio(candidate.username);
      if (response.success && response.analysis) {
        portfolioAnalysis = response.analysis;
      }
    } catch (err) {
      error = 'Failed to analyze portfolio: ' + err.message;
    } finally {
      analysisLoading = false;
    }
  }
  
  function handleEditProfile() {
    goto('/profile/edit');
  }
  
  function handleViewEarnings() {
    goto('/dashboard/candidate/earnings');
  }
  
  function handleViewPayments() {
    goto('/dashboard/candidate/payments');
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex gap-8">
    <!-- Fixed Sidebar -->
    <div class="w-80 flex-shrink-0">
      {#if loading}
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="animate-pulse space-y-4">
            <div class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div class="space-y-2">
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      {:else if candidate}
        <ProfileSidebar 
          {candidate}
          user={$authStore.user}
          loading={analysisLoading}
          on:reanalyze={handleReanalyze}
          on:editProfile={handleEditProfile}
          on:viewEarnings={handleViewEarnings}
          on:viewPayments={handleViewPayments}
        />
      {/if}
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 min-w-0">
      {#if error}
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      {/if}
      
      {@render children({ candidate, portfolioAnalysis, analysisLoading, handleReanalyze })}
    </div>
  </div>
</div>