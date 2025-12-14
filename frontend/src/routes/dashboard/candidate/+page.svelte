<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import PortfolioAnalysis from '$lib/components/PortfolioAnalysis.svelte';
  import ImprovementSuggestions from '$lib/components/ImprovementSuggestions.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  let { candidate, portfolioAnalysis, analysisLoading, handleReanalyze } = $props();
  
  let earnings = $state(null);
  let earningsLoading = $state(true);
  let recentJobs = $state([]);
  let jobsLoading = $state(true);
  
  onMount(async () => {
    await loadDashboardData();
  });
  
  async function loadDashboardData() {
    try {
      // Load earnings summary
      const earningsResponse = await apiService.getEarnings($authStore.user.username);
      if (earningsResponse.success && earningsResponse.earnings) {
        earnings = earningsResponse.earnings;
      }
      earningsLoading = false;
      
      // Load recent job matches (if any)
      // This would show jobs where the candidate was shortlisted
      // For now, we'll leave this empty as it's not implemented yet
      jobsLoading = false;
      
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      earningsLoading = false;
      jobsLoading = false;
    }
  }
  
  function navigateToEarnings() {
    goto('/dashboard/candidate/earnings');
  }
  
  function navigateToPortfolio() {
    goto('/dashboard/candidate/portfolio');
  }
  
  function navigateToProfile() {
    goto('/profile/edit');
  }
  
  // Calculate total USD value for earnings
  const totalEarningsUSD = $derived(() => {
    if (!earnings?.totalEarnings) return 0;
    const rates = { ETH: 2000, USDC: 1, KIRO: 0.5 }; // Mock exchange rates
    const { ETH, USDC, KIRO } = earnings.totalEarnings;
    return (ETH * rates.ETH) + (USDC * rates.USDC) + (KIRO * rates.KIRO);
  });
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  function calculateProfileCompleteness(candidate) {
    if (!candidate) return 0;
    
    let score = 0;
    const fields = [
      candidate.bio,
      candidate.skills?.length > 0,
      candidate.portfolioUrl,
      candidate.githubUrl,
      candidate.yearsOfExperience !== undefined,
      candidate.availability,
      candidate.educationLevel,
      candidate.university,
      candidate.major
    ];
    
    fields.forEach(field => {
      if (field) score += 11.11; // 100 / 9 fields
    });
    
    return Math.round(score);
  }
</script>

<svelte:head>
  <title>Candidate Dashboard - MeritStack</title>
</svelte:head>

<div class="space-y-6">
  <!-- Welcome Header -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {$authStore.user?.displayName || 'Candidate'}!
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Here's your portfolio overview and recent activity.
        </p>
      </div>
      <div class="flex gap-3">
        <Button variant="secondary" size="sm" onclick={navigateToProfile}>
          Edit Profile
        </Button>
        <Button variant="primary" size="sm" onclick={navigateToPortfolio}>
          View Portfolio Analysis
        </Button>
      </div>
    </div>
  </div>

  <!-- Quick Stats -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Earnings Summary -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Total Earnings</h2>
        <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
        </svg>
      </div>
      
      {#if earningsLoading}
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      {:else}
        <div class="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
          {formatCurrency(totalEarningsUSD)}
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {earnings?.transactions?.length || 0} payments received
        </p>
        <button 
          onclick={navigateToEarnings}
          class="text-sm text-orange-500 hover:text-orange-600 mt-2 font-medium"
        >
          View Details →
        </button>
      {/if}
    </div>

    <!-- Portfolio Score -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Score</h2>
        <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      </div>
      
      {#if analysisLoading}
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      {:else if portfolioAnalysis?.scores}
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
          {portfolioAnalysis.scores.overall}/100
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Last analyzed {new Date(portfolioAnalysis.analyzedAt).toLocaleDateString()}
        </p>
        <button 
          onclick={navigateToPortfolio}
          class="text-sm text-orange-500 hover:text-orange-600 mt-2 font-medium"
        >
          View Analysis →
        </button>
      {:else}
        <div class="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-1">
          Not Analyzed
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Click to analyze your portfolio
        </p>
        <button 
          onclick={handleReanalyze}
          class="text-sm text-orange-500 hover:text-orange-600 mt-2 font-medium"
          disabled={analysisLoading}
        >
          {analysisLoading ? 'Analyzing...' : 'Start Analysis →'}
        </button>
      {/if}
    </div>

    <!-- Profile Completeness -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Profile Status</h2>
        <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
      </div>
      
      {#if candidate}
        {@const completeness = calculateProfileCompleteness(candidate)}
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
          {completeness}%
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Profile completeness
        </p>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
          <div 
            class="h-2 rounded-full transition-all duration-300"
            class:bg-green-500={completeness >= 80}
            class:bg-yellow-500={completeness >= 60 && completeness < 80}
            class:bg-orange-500={completeness >= 40 && completeness < 60}
            class:bg-red-500={completeness < 40}
            style="width: {completeness}%"
          ></div>
        </div>
      {:else}
        <div class="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-1">
          Loading...
        </div>
      {/if}
    </div>
  </div>

  <!-- Main Content Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Portfolio Analysis Preview -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Portfolio Analysis</h2>
        <Button variant="secondary" size="sm" onclick={navigateToPortfolio}>
          View Full Analysis
        </Button>
      </div>
      
      {#if analysisLoading}
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Analyzing your portfolio...</p>
        </div>
      {:else if portfolioAnalysis}
        <div class="space-y-4">
          <!-- Score Summary -->
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="text-lg font-bold text-purple-600 dark:text-purple-400">
                {portfolioAnalysis.scores.overall}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">Overall</div>
            </div>
            <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                {portfolioAnalysis.scores.codeQuality}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">Code Quality</div>
            </div>
          </div>
          
          <!-- Top Improvement -->
          {#if portfolioAnalysis.improvements && portfolioAnalysis.improvements.length > 0}
            <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h3 class="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Top Improvement Suggestion
              </h3>
              <p class="text-sm text-orange-700 dark:text-orange-300">
                {portfolioAnalysis.improvements[0].suggestion}
              </p>
            </div>
          {/if}
        </div>
      {:else}
        <div class="text-center py-8">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Analysis Available</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Get AI-powered insights about your portfolio and GitHub profile.
          </p>
          <Button variant="primary" onclick={handleReanalyze} disabled={analysisLoading}>
            Analyze Portfolio
          </Button>
        </div>
      {/if}
    </div>

    <!-- Recent Activity -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        <Button variant="secondary" size="sm" onclick={navigateToEarnings}>
          View All
        </Button>
      </div>
      
      {#if earningsLoading}
        <div class="space-y-3">
          {#each Array(3) as _}
            <div class="animate-pulse flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if earnings?.transactions && earnings.transactions.length > 0}
        <div class="space-y-3">
          {#each earnings.transactions.slice(0, 5) as transaction}
            <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-white">
                  Payment received: {transaction.amount} {transaction.tokenType}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  From {transaction.from} • {new Date(transaction.receivedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Recent Activity</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Your payments and job matches will appear here.
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>