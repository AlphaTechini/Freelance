<script>
  import PortfolioAnalysis from '$lib/components/PortfolioAnalysis.svelte';
  import ImprovementSuggestions from '$lib/components/ImprovementSuggestions.svelte';
  
  let { candidate, portfolioAnalysis, analysisLoading, handleReanalyze } = $props();
</script>

<svelte:head>
  <title>Portfolio Analysis - CryptoGigs</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      Portfolio Analysis
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      AI-powered insights about your portfolio and GitHub profile to help you improve your professional presence.
    </p>
  </div>

  <!-- Portfolio Analysis Component -->
  <PortfolioAnalysis 
    analysis={portfolioAnalysis}
    loading={analysisLoading}
    error=""
    on:reanalyze={handleReanalyze}
  />

  <!-- Improvement Suggestions -->
  {#if portfolioAnalysis?.improvements}
    <ImprovementSuggestions 
      improvements={portfolioAnalysis.improvements}
    />
  {/if}
</div>