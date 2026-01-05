<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';
  
  // Declare children as a snippet prop for Svelte 5
  let { children } = $props();
  
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
      const candidateResponse = await apiService.getCandidateProfile();
      console.log('Candidate profile response:', candidateResponse);
      console.log('Candidate response type:', typeof candidateResponse);
      console.log('Candidate profile type:', typeof candidateResponse.profile);
      console.log('Candidate profile keys:', candidateResponse.profile ? Object.keys(candidateResponse.profile) : 'no profile');
      console.log('Raw profile object:', candidateResponse.profile);
      
      // Try to access fields directly
      if (candidateResponse.profile) {
        console.log('Direct field access test:');
        console.log('  - portfolioUrl:', candidateResponse.profile.portfolioUrl);
        console.log('  - githubUrl:', candidateResponse.profile.githubUrl);
        console.log('  - bio:', candidateResponse.profile.bio);
        console.log('  - major:', candidateResponse.profile.major);
        console.log('  - skills:', candidateResponse.profile.skills);
        console.log('  - _id:', candidateResponse.profile._id);
        console.log('  - userId:', candidateResponse.profile.userId);
      }
      
      if (candidateResponse.success && candidateResponse.profile) {
        candidate = candidateResponse.profile;
        console.log('Candidate URLs:', {
          portfolioUrl: candidate.portfolioUrl,
          githubUrl: candidate.githubUrl
        });
      } else if (candidateResponse.success && candidateResponse.candidate) {
        candidate = candidateResponse.candidate;
        console.log('Candidate URLs (legacy):', {
          portfolioUrl: candidate.portfolioUrl,
          githubUrl: candidate.githubUrl
        });
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
      // Use candidate._id if available, otherwise fall back to username
      const candidateId = candidate?._id || candidate?.username || $authStore.user?.username;
      if (!candidateId) {
        console.warn('No candidate ID available for portfolio analysis');
        return;
      }
      
      console.log('Loading portfolio analysis for:', candidateId);
      const analysisResponse = await apiService.getPortfolioAnalysis(candidateId);
      console.log('Portfolio analysis response:', analysisResponse);
      
      if (analysisResponse.success && analysisResponse.data) {
        portfolioAnalysis = analysisResponse.data;
        console.log('Portfolio analysis loaded successfully');
      } else if (analysisResponse.success && analysisResponse.analysis) {
        portfolioAnalysis = analysisResponse.analysis;
        console.log('Portfolio analysis loaded successfully (legacy format)');
      } else {
        console.warn('No portfolio analysis data found');
      }
    } catch (err) {
      console.error('Failed to load portfolio analysis:', err);
      // Don't show error to user for missing analysis - it's normal for new users
    }
  }
  
  async function handleReanalyze() {
    try {
      analysisLoading = true;
      // Use candidate._id if available, otherwise fall back to username
      const candidateId = candidate?._id || candidate?.username || $authStore.user?.username;
      
      // Pass the candidate's URLs to ensure real analysis is triggered
      const response = await apiService.analyzePortfolio(
        candidateId,
        candidate?.portfolioUrl || null,
        candidate?.githubUrl || null
      );
      
      if (response.success && response.data) {
        // Analysis started - wait a bit then reload the analysis
        setTimeout(async () => {
          await loadPortfolioAnalysis();
          analysisLoading = false;
        }, 3000);
      } else if (response.success && response.analysis) {
        portfolioAnalysis = response.analysis;
        analysisLoading = false;
      } else {
        analysisLoading = false;
      }
    } catch (err) {
      error = 'Failed to analyze portfolio: ' + err.message;
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
          onreanalyze={handleReanalyze}
          oneditprofile={handleEditProfile}
          onviewearnings={handleViewEarnings}
          onviewpayments={handleViewPayments}
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
      
      {#key portfolioAnalysis}
        {@render children({ candidate, portfolioAnalysis, analysisLoading, handleReanalyze })}
      {/key}
    </div>
  </div>
</div>