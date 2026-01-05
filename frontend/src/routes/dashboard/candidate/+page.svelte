<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import RadarChart from '$lib/components/ui/RadarChart.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  let { candidate, portfolioAnalysis, analysisLoading, handleReanalyze } = $props();
  
  // Debug: log when portfolioAnalysis changes
  $effect(() => {
    console.log('Dashboard portfolioAnalysis updated:', portfolioAnalysis);
    console.log('Has scores:', portfolioAnalysis?.scores);
  });
  
  let earnings = $state(null);
  let earningsLoading = $state(true);
  
  onMount(async () => {
    await loadDashboardData();
  });
  
  async function loadDashboardData() {
    try {
      const earningsResponse = await apiService.getEarnings();
      if (earningsResponse.success && earningsResponse.earnings) {
        earnings = earningsResponse.earnings;
      }
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      earningsLoading = false;
    }
  }
  
  // Radar chart data
  let chartData = $derived(portfolioAnalysis?.scores ? [
    { label: 'Overall', value: portfolioAnalysis.scores.overall || 0 },
    { label: 'Code Quality', value: portfolioAnalysis.scores.codeQuality || 0 },
    { label: 'Project Depth', value: portfolioAnalysis.scores.projectDepth || 0 },
    { label: 'Portfolio', value: portfolioAnalysis.scores.portfolioCompleteness || 0 }
  ] : []);
  
  function getScoreColor(score) {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }
  
  function getProgressColor(score) {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
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

  <!-- AI Portfolio Analysis Section -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span class="text-purple-500">✨</span> AI Portfolio Analysis
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">AI-powered evaluation of your profile and portfolio</p>
      </div>
      <Button 
        variant="primary" 
        size="sm" 
        onclick={handleReanalyze}
        disabled={analysisLoading}
        class="flex items-center gap-2"
      >
        <span class="text-purple-200">✨</span>
        {analysisLoading ? 'Analyzing...' : 'Re-analyze'}
      </Button>
    </div>

    {#if analysisLoading}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Analyzing your portfolio and GitHub...</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    {:else if portfolioAnalysis?.scores}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Radar Chart -->
        <div class="flex justify-center items-center">
          <RadarChart 
            data={chartData}
            width={300}
            height={300}
            fillColor="rgba(139, 92, 246, 0.3)"
            strokeColor="#8b5cf6"
          />
        </div>
        
        <!-- Score Metrics -->
        <div class="space-y-4">
          <!-- Overall Score -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-green-500">◉</span>
              <span class="text-gray-700 dark:text-gray-300 font-medium">Overall Score</span>
            </div>
            <span class="text-2xl font-bold {getScoreColor(portfolioAnalysis.scores.overall)}">{portfolioAnalysis.scores.overall}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="{getProgressColor(portfolioAnalysis.scores.overall)} h-2 rounded-full transition-all" style="width: {portfolioAnalysis.scores.overall}%"></div>
          </div>
          
          <!-- Code Quality -->
          <div class="flex items-center justify-between mt-4">
            <div class="flex items-center gap-2">
              <span class="text-blue-500">&lt;/&gt;</span>
              <span class="text-gray-700 dark:text-gray-300 font-medium">Code Quality</span>
            </div>
            <span class="text-2xl font-bold {getScoreColor(portfolioAnalysis.scores.codeQuality)}">{portfolioAnalysis.scores.codeQuality}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="{getProgressColor(portfolioAnalysis.scores.codeQuality)} h-2 rounded-full transition-all" style="width: {portfolioAnalysis.scores.codeQuality}%"></div>
          </div>
          
          <!-- Project Depth -->
          <div class="flex items-center justify-between mt-4">
            <div class="flex items-center gap-2">
              <span class="text-purple-500">📊</span>
              <span class="text-gray-700 dark:text-gray-300 font-medium">Project Depth</span>
            </div>
            <span class="text-2xl font-bold {getScoreColor(portfolioAnalysis.scores.projectDepth)}">{portfolioAnalysis.scores.projectDepth}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="{getProgressColor(portfolioAnalysis.scores.projectDepth)} h-2 rounded-full transition-all" style="width: {portfolioAnalysis.scores.projectDepth}%"></div>
          </div>
          
          <!-- Portfolio Completeness -->
          <div class="flex items-center justify-between mt-4">
            <div class="flex items-center gap-2">
              <span class="text-orange-500">📁</span>
              <span class="text-gray-700 dark:text-gray-300 font-medium">Portfolio Completeness</span>
            </div>
            <span class="text-2xl font-bold {getScoreColor(portfolioAnalysis.scores.portfolioCompleteness)}">{portfolioAnalysis.scores.portfolioCompleteness}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="{getProgressColor(portfolioAnalysis.scores.portfolioCompleteness)} h-2 rounded-full transition-all" style="width: {portfolioAnalysis.scores.portfolioCompleteness}%"></div>
          </div>
        </div>
      </div>

      <!-- AI Improvement Suggestions -->
      {#if portfolioAnalysis.improvements && portfolioAnalysis.improvements.length > 0}
        <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span class="text-yellow-500">💡</span> AI Suggestions for Improvement
          </h3>
          <div class="space-y-3">
            {#each portfolioAnalysis.improvements.slice(0, 5) as improvement, index}
              <div class="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span class="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <p class="text-gray-700 dark:text-gray-300 text-sm">{improvement.suggestion || improvement}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <!-- No Analysis State -->
      <div class="text-center py-12">
        <div class="w-20 h-20 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Analysis Available</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Get AI-powered insights about your portfolio and GitHub profile. We'll analyze your code quality, project depth, and provide personalized improvement suggestions.
        </p>
        {#if !candidate?.portfolioUrl?.trim() && !candidate?.githubUrl?.trim()}
          <p class="text-sm text-orange-600 dark:text-orange-400 mb-4">
            ⚠️ Add your GitHub or Portfolio URL in your profile to enable analysis
          </p>
          <Button variant="secondary" onclick={() => goto('/profile/edit')}>
            Complete Profile
          </Button>
        {:else}
          <Button variant="primary" onclick={handleReanalyze} disabled={analysisLoading}>
            <span class="flex items-center gap-2">
              <span>✨</span> Start Analysis
            </span>
          </Button>
        {/if}
      </div>
    {/if}
  </div>

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
