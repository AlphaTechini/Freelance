<script>
  import { createEventDispatcher } from 'svelte';
  import RadarChart from './ui/RadarChart.svelte';
  import Button from './ui/Button.svelte';
  
  const dispatch = createEventDispatcher();
  
  // Props
  export let analysis = null;
  export let loading = false;
  export let error = '';
  
  // Computed values for radar chart
  $: chartData = analysis?.scores ? [
    { label: 'Overall Score', value: analysis.scores.overall || 0 },
    { label: 'Code Quality', value: analysis.scores.codeQuality || 0 },
    { label: 'Project Depth', value: analysis.scores.projectDepth || 0 },
    { label: 'Portfolio Completeness', value: analysis.scores.portfolioCompleteness || 0 }
  ] : [];
  
  $: lastAnalyzed = analysis?.analyzedAt ? new Date(analysis.analyzedAt).toLocaleDateString() : null;
  
  function handleReanalyze() {
    dispatch('reanalyze');
  }
  
  function getScoreColor(score) {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }
  
  function getScoreBadge(score) {
    if (score >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' };
    if (score >= 60) return { text: 'Good', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' };
    if (score >= 40) return { text: 'Fair', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' };
    return { text: 'Needs Work', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' };
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-bold text-gray-900 dark:text-white">AI Portfolio Analysis</h2>
    <Button 
      variant="secondary" 
      size="sm" 
      onclick={handleReanalyze}
      disabled={loading}
    >
      {loading ? 'Analyzing...' : 'Re-analyze'}
    </Button>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">Analysis Failed</span>
      </div>
      <p class="mt-1 text-sm">{error}</p>
    </div>
  {/if}

  {#if loading}
    <div class="text-center py-12">
      <div class="inline-flex items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span class="text-gray-600 dark:text-gray-400">Analyzing your portfolio and GitHub...</span>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few moments</p>
    </div>
  {:else if !analysis}
    <div class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Analysis Available</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Click "Re-analyze" to get AI-powered insights about your portfolio and GitHub profile.
      </p>
      <Button variant="primary" onclick={handleReanalyze} disabled={loading}>
        Start Analysis
      </Button>
    </div>
  {:else}
    <!-- Analysis Results -->
    <div class="space-y-6">
      <!-- Last Analyzed -->
      {#if lastAnalyzed}
        <div class="text-sm text-gray-500 dark:text-gray-400 text-center">
          Last analyzed on {lastAnalyzed}
        </div>
      {/if}

      <!-- Radar Chart -->
      <div class="flex justify-center">
        <RadarChart 
          data={chartData}
          width={280}
          height={280}
          fillColor="#8b5cf6"
          strokeColor="#7c3aed"
        />
      </div>

      <!-- Score Breakdown -->
      <div class="grid grid-cols-2 gap-4">
        {#each chartData as metric}
          {@const badge = getScoreBadge(metric.value)}
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {metric.label}
              </h4>
              <span class="text-lg font-bold {getScoreColor(metric.value)}">
                {metric.value}
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                class:bg-green-500={metric.value >= 80}
                class:bg-yellow-500={metric.value >= 60 && metric.value < 80}
                class:bg-orange-500={metric.value >= 40 && metric.value < 60}
                class:bg-red-500={metric.value < 40}
                style="width: {metric.value}%"
              ></div>
            </div>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {badge.color}">
              {badge.text}
            </span>
          </div>
        {/each}
      </div>

      <!-- GitHub Stats -->
      {#if analysis.githubData}
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">GitHub Statistics</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analysis.githubData.repositories || 0}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Repositories</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {analysis.githubData.stars || 0}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Stars</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {analysis.githubData.commits || 0}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Recent Commits</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analysis.githubData.languages?.length || 0}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Languages</div>
            </div>
          </div>
          
          {#if analysis.githubData.languages && analysis.githubData.languages.length > 0}
            <div class="mt-4">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Languages</h4>
              <div class="flex flex-wrap gap-1">
                {#each analysis.githubData.languages.slice(0, 6) as language}
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    {language}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Portfolio Stats -->
      {#if analysis.portfolioData}
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Portfolio Overview</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analysis.portfolioData.projects?.length || 0}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Projects</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {analysis.portfolioData.hasDeployment ? 'Yes' : 'No'}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Live Deployments</div>
            </div>
          </div>
          
          {#if analysis.portfolioData.technologies && analysis.portfolioData.technologies.length > 0}
            <div class="mt-4">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Technologies Used</h4>
              <div class="flex flex-wrap gap-1">
                {#each analysis.portfolioData.technologies.slice(0, 8) as tech}
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                    {tech}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>