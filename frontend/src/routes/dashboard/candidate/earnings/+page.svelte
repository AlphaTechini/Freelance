<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import EarningsChart from '$lib/components/EarningsChart.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  let earnings = $state(null);
  let loading = $state(true);
  let error = $state('');
  let exchangeRates = $state({ ETH: 2000, USDC: 1, KIRO: 0.5 });
  
  onMount(async () => {
    await loadEarnings();
  });
  
  async function loadEarnings() {
    try {
      loading = true;
      error = '';
      
      const response = await apiService.getEarnings();
      if (response.success && response.earnings) {
        earnings = response.earnings;
      }
    } catch (err) {
      error = 'Failed to load earnings: ' + err.message;
    } finally {
      loading = false;
    }
  }
  
  function handleRefresh() {
    loadEarnings();
  }
</script>

<svelte:head>
  <title>Earnings - MeritStack</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Earnings Dashboard
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Track your payments and earnings from recruiters across different tokens.
        </p>
      </div>
      <Button variant="secondary" size="sm" onclick={handleRefresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  {:else if earnings}
    <EarningsChart {earnings} {exchangeRates} />
  {:else}
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
      </svg>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Earnings Yet</h3>
      <p class="text-gray-600 dark:text-gray-400">
        Your payments from recruiters will appear here once you start receiving them.
      </p>
    </div>
  {/if}
</div>