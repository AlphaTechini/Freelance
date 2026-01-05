<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  
  // In Svelte 5, snippet children receive props as a single object
  let props = $props();
  
  // Extract the values - these will be reactive
  let candidate = $derived(props.candidate);
  
  let earnings = $state(null);
  let earningsLoading = $state(true);
  let hasAnalysis = $state(false);
  let analysisScores = $state(null);
  
  onMount(async () => {
    await loadDashboardData();
  });
  
  async function loadDashboardData() {
    try {
      // Load earnings
      const earningsResponse = await apiService.getEarnings();
      if (earningsResponse.success && earningsResponse.earnings) {
        earnings = earningsResponse.earnings;
      }
      
      // Check if analysis exists (quick check)
      const candidateId = candidate?._id || candidate?.username || $authStore.user?.username;
      if (candidateId) {
        try {
          const analysisResponse = await apiService.getPortfolioAnalysis(candidateId);
          if (analysisResponse.success && (analysisResponse.data?.scores || analysisResponse.analysis?.scores)) {
            hasAnalysis = true;
            analysisScores = analysisResponse.data?.scores || analysisResponse.analysis?.scores;
          }
        } catch (e) {
          // No analysis yet, that's fine
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      earningsLoading = false;
    }
  }
  
  function getScoreColor(score) {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }
</script>

<svelte:head>
  <title>Dashboard - MeritStack</title>
</svelte:head>

<div class="space-y-6">
  <!-- Welcome Header with Status Badges -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        Welcome back, {$authStore.user?.displayName || 'there'}! 👋
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Here's your profile overview and AI analysis</p>
    </div>
    <div class="flex gap-2">
      {#if candidate?.isPublished}
        <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium flex items-center gap-1">
          <span class="w-2 h-2 bg-green-500 rounded-full"></span>
          Profile Published
        </span>
      {/if}
      {#if candidate?.educationLevel}
        <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium flex items-center gap-1">
          ✓ Verified {candidate.educationLevel === 'student' ? 'Student' : candidate.educationLevel === 'graduate' ? 'Graduate' : 'PhD'}
        </span>
      {/if}
    </div>
  </div>

  <!-- AI Portfolio Analysis Card - Links to dedicated page -->
  <button 
    onclick={() => goto('/dashboard/candidate/analysis')}
    class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-lg p-6 text-left transition-all hover:shadow-xl hover:scale-[1.01]"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
          <span class="text-3xl">✨</span>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            AI Portfolio Analysis
          </h2>
          <p class="text-purple-200 text-sm mt-1">
            {#if hasAnalysis && analysisScores}
              Overall Score: <span class="font-bold text-white">{analysisScores.overall}%</span>
            {:else}
              Get AI-powered insights about your portfolio
            {/if}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        {#if hasAnalysis && analysisScores}
          <div class="hidden sm:flex gap-2">
            <div class="bg-white/20 rounded-lg px-3 py-1 text-sm text-white">
              Code: {analysisScores.codeQuality}%
            </div>
            <div class="bg-white/20 rounded-lg px-3 py-1 text-sm text-white">
              Depth: {analysisScores.projectDepth}%
            </div>
          </div>
        {/if}
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </button>

  <!-- Quick Stats Row -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Earnings Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Earnings</h3>
        <span class="text-2xl">💰</span>
      </div>
      {#if earningsLoading}
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        </div>
      {:else}
        <div class="text-3xl font-bold text-green-600 dark:text-green-400">
          ${earnings?.totalEarnings?.USDC || 0}
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {earnings?.transactions?.length || 0} payments received
        </p>
      {/if}
      <button onclick={() => goto('/dashboard/candidate/earnings')} class="text-sm text-purple-600 dark:text-purple-400 hover:underline mt-3 block">
        View Details →
      </button>
    </div>

    <!-- Profile Views Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Profile Views</h3>
        <span class="text-2xl">👁️</span>
      </div>
      <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
        {candidate?.profileViews || 0}
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">This month</p>
    </div>

    <!-- Job Matches Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Job Matches</h3>
        <span class="text-2xl">🎯</span>
      </div>
      <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">
        {candidate?.jobMatches || 0}
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Potential opportunities</p>
      <button onclick={() => goto('/jobs')} class="text-sm text-purple-600 dark:text-purple-400 hover:underline mt-3 block">
        Browse Jobs →
      </button>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
    {#if earnings?.transactions && earnings.transactions.length > 0}
      <div class="space-y-3">
        {#each earnings.transactions.slice(0, 5) as transaction}
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span class="text-green-600 dark:text-green-400">💵</span>
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">
                Payment received: {transaction.amount} {transaction.tokenType}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                From {transaction.from} • {new Date(transaction.receivedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No recent activity yet</p>
        <p class="text-sm mt-1">Your payments and job matches will appear here</p>
      </div>
    {/if}
  </div>
</div>
