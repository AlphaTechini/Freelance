<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import RadarChart from '$lib/components/ui/RadarChart.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  let loading = $state(true);
  let analysisLoading = $state(false);
  let error = $state('');
  let candidate = $state(null);
  let portfolioAnalysis = $state(null);
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    try {
      loading = true;
      error = '';
      
      const candidateResponse = await apiService.getCandidateProfile();
      
      if (candidateResponse.success && candidateResponse.profile) {
        candidate = candidateResponse.profile;
      } else if (candidateResponse.success && candidateResponse.candidate) {
        candidate = candidateResponse.candidate;
      }
      
      if (!candidate) {
        error = 'Could not load candidate profile';
        return;
      }
      
      await loadPortfolioAnalysis();
      
    } catch (err) {
      error = 'Failed to load data: ' + err.message;
      console.error('Load data error:', err);
    } finally {
      loading = false;
    }
  }
  
  async function loadPortfolioAnalysis() {
    try {
      const candidateId = candidate?._id || candidate?.username || $authStore.user?.username;
      if (!candidateId) return;
      
      const response = await apiService.getPortfolioAnalysis(candidateId);
      
      if (response.success && response.data) {
        portfolioAnalysis = response.data;
      } else if (response.success && response.analysis) {
        portfolioAnalysis = response.analysis;
      }
    } catch (err) {
      console.error('Failed to load portfolio analysis:', err);
    }
  }
  
  async function handleReanalyze() {
    try {
      analysisLoading = true;
      error = '';
      
      const candidateId = candidate?._id || candidate?.username || $authStore.user?.username;
      
      const response = await apiService.analyzePortfolio(
        candidateId,
        candidate?.portfolioUrl || null,
        candidate?.githubUrl || null
      );
      
      if (response.success && response.analysis) {
        portfolioAnalysis = response.analysis;
      } else if (response.success && response.data) {
        portfolioAnalysis = response.data;
      } else if (response.success) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await loadPortfolioAnalysis();
      } else {
        error = response.message || 'Analysis failed';
      }
    } catch (err) {
      error = 'Failed to analyze portfolio: ' + err.message;
      console.error('Analyze error:', err);
    } finally {
      analysisLoading = false;
    }
  }
  
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
  
  // Parse improvements from various formats
  function parseImprovements(improvements) {
    if (!improvements) return [];
    
    // If string, try to parse JSON
    if (typeof improvements === 'string') {
      try {
        let cleaned = improvements.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        improvements = JSON.parse(cleaned);
      } catch (e) {
        return improvements.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.match(/^[\[\]{}"`]/) && line.length > 10)
          .slice(0, 5);
      }
    }
    
    if (Array.isArray(improvements)) {
      return improvements.slice(0, 5).map(item => {
        if (typeof item === 'string') {
          if (item.match(/^[\[\]{}",\s]*$/) || item.length < 10) return null;
          const match = item.match(/"suggestion"\s*:\s*"([^"]+)"/);
          if (match) return match[1];
          return item.replace(/^[\d.)\s-]+/, '').trim();
        }
        if (item?.suggestion) return item.suggestion;
        if (item?.text) return item.text;
        return null;
      }).filter(Boolean);
    }
    
    return [];
  }
  
  let parsedImprovements = $derived(parseImprovements(portfolioAnalysis?.improvements));
</script>

<svelte:head>
  <title>AI Portfolio Analysis - MeritStack</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <button 
    onclick={() => goto('/dashboard/candidate')}
    class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    Back to Dashboard
  </button>

  {#if loading}
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12">
      <div class="flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-purple-500">✨</span> AI Portfolio Analysis
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">AI-powered evaluation of your profile and portfolio</p>
        </div>
        <Button variant="primary" onclick={handleReanalyze} disabled={analysisLoading}>
          <span class="flex items-center gap-2">
            <span class="text-purple-200">✨</span>
            {analysisLoading ? 'Analyzing...' : 'Re-analyze'}
          </span>
        </Button>
      </div>
      
      {#if candidate}
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex flex-wrap gap-4 text-sm">
            {#if candidate.portfolioUrl}
              <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <span>🌐</span>
                <a href={candidate.portfolioUrl} target="_blank" rel="noopener" class="text-purple-600 dark:text-purple-400 hover:underline">Portfolio</a>
              </div>
            {/if}
            {#if candidate.githubUrl}
              <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <span>📦</span>
                <a href={candidate.githubUrl} target="_blank" rel="noopener" class="text-purple-600 dark:text-purple-400 hover:underline">GitHub</a>
              </div>
            {/if}
            {#if !candidate.portfolioUrl && !candidate.githubUrl}
              <p class="text-orange-600 dark:text-orange-400">⚠️ Add your GitHub or Portfolio URL in your profile to enable analysis</p>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    {#if error}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">{error}</div>
    {/if}

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {#if analysisLoading}
        <div class="flex items-center justify-center py-16">
          <div class="text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400 text-lg">Analyzing your portfolio and GitHub...</p>
            <p class="text-sm text-gray-500 mt-2">This may take up to 30 seconds</p>
          </div>
        </div>
      {:else if portfolioAnalysis?.scores}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="flex justify-center items-center">
            <RadarChart data={chartData} width={320} height={320} fillColor="rgba(139, 92, 246, 0.3)" strokeColor="#8b5cf6" />
          </div>
          
          <div class="space-y-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-green-500 text-xl">◉</span>
                  <span class="text-gray-700 dark:text-gray-300 font-medium">Overall Score</span>
                </div>
                <span class="text-3xl font-bold {getScoreColor(portfolioAnalysis.scores.overall)}">{portfolioAnalysis.scores.overall}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div class="{getProgressColor(portfolioAnalysis.scores.overall)} h-3 rounded-full transition-all duration-500" style="width: {portfolioAnalysis.scores.overall}%"></div>
              </div>
            </div>
            
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-blue-500 text-xl">&lt;/&gt;</span>
                  <span class="text-gray-700 dark:text-gray-300 font-medium">Code Quality</span>
                </div>
                <span class="text-3xl font-bold {getScoreColor(portfolioAnalysis.scores.codeQuality)}">{portfolioAnalysis.scores.codeQuality}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div class="{getProgressColor(portfolioAnalysis.scores.codeQuality)} h-3 rounded-full transition-all duration-500" style="width: {portfolioAnalysis.scores.codeQuality}%"></div>
              </div>
            </div>
            
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-purple-500 text-xl">📊</span>
                  <span class="text-gray-700 dark:text-gray-300 font-medium">Project Depth</span>
                </div>
                <span class="text-3xl font-bold {getScoreColor(portfolioAnalysis.scores.projectDepth)}">{portfolioAnalysis.scores.projectDepth}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div class="{getProgressColor(portfolioAnalysis.scores.projectDepth)} h-3 rounded-full transition-all duration-500" style="width: {portfolioAnalysis.scores.projectDepth}%"></div>
              </div>
            </div>
            
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-orange-500 text-xl">📁</span>
                  <span class="text-gray-700 dark:text-gray-300 font-medium">Portfolio Completeness</span>
                </div>
                <span class="text-3xl font-bold {getScoreColor(portfolioAnalysis.scores.portfolioCompleteness)}">{portfolioAnalysis.scores.portfolioCompleteness}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div class="{getProgressColor(portfolioAnalysis.scores.portfolioCompleteness)} h-3 rounded-full transition-all duration-500" style="width: {portfolioAnalysis.scores.portfolioCompleteness}%"></div>
              </div>
            </div>
          </div>
        </div>

        {#if parsedImprovements.length > 0}
          <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span class="text-yellow-500">💡</span> AI Suggestions for Improvement
            </h3>
            <div class="space-y-4">
              {#each parsedImprovements as improvement, index}
                <div class="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span class="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-bold">{index + 1}</span>
                  <p class="text-gray-700 dark:text-gray-300">{improvement}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if portfolioAnalysis.analyzedAt}
          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center">Last analyzed: {new Date(portfolioAnalysis.analyzedAt).toLocaleString()}</p>
          </div>
        {/if}
      {:else}
        <div class="text-center py-16">
          <div class="w-24 h-24 mx-auto mb-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-3">No Analysis Available</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">Get AI-powered insights about your portfolio and GitHub profile.</p>
          {#if !candidate?.portfolioUrl?.trim() && !candidate?.githubUrl?.trim()}
            <p class="text-sm text-orange-600 dark:text-orange-400 mb-6">⚠️ Add your GitHub or Portfolio URL in your profile to enable analysis</p>
            <Button variant="secondary" onclick={() => goto('/profile/edit')}>Complete Profile</Button>
          {:else}
            <Button variant="primary" onclick={handleReanalyze} disabled={analysisLoading}>
              <span class="flex items-center gap-2"><span>✨</span> Start Analysis</span>
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
