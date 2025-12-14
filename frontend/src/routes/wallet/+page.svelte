<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.js';
  import { walletStore } from '$lib/services/wallet.js';
  import Button from '$lib/components/ui/Button.svelte';
  import WalletConnect from '$lib/components/WalletConnect.svelte';
  import EarningsChart from '$lib/components/EarningsChart.svelte';

  let earnings = $state({
    totalEarnings: { ETH: 0, USDC: 0, KIRO: 0 },
    transactions: []
  });
  let exchangeRates = $state({ ETH: 2000, USDC: 1, KIRO: 0.5 });
  let loading = $state(true);
  let error = $state('');

  // Load earnings data
  const loadEarnings = async () => {
    try {
      loading = true;
      error = '';

      const { apiService } = await import('$lib/services/api.js');
      const token = localStorage.getItem('token');
      if (token) {
        apiService.setToken(token);
      }

      // Load earnings and exchange rates
      const [earningsData, ratesData] = await Promise.all([
        apiService.getUserEarnings(),
        apiService.getExchangeRates()
      ]);

      earnings = earningsData.earnings;
      exchangeRates = ratesData.rates;

    } catch (err) {
      console.error('Failed to load earnings:', err);
      error = err.message || 'Failed to load earnings data';
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    if ($authStore.user && $walletStore.isConnected) {
      loadEarnings();
    }
  });

  // Refresh earnings
  const refreshEarnings = () => {
    loadEarnings();
  };
</script>

<svelte:head>
  <title>Wallet - MeritStack</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Wallet Dashboard</h1>

    {#if !$walletStore.isConnected}
      <!-- Wallet Not Connected -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
        <div class="mb-6">
          <svg class="w-24 h-24 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        
        <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Connect Your Wallet</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Connect your crypto wallet to start making and receiving payments on MeritStack.
        </p>
        
        <div class="max-w-sm mx-auto">
          <WalletConnect showBalance={false} variant="primary" size="lg" />
        </div>

        <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">Why Connect a Wallet?</h3>
          <ul class="text-sm text-blue-700 dark:text-blue-300 text-left space-y-2">
            <li>✓ Make and receive cryptocurrency payments</li>
            <li>✓ Access escrow-protected transactions</li>
            <li>✓ Track your earnings and transaction history</li>
            <li>✓ Enjoy fast, borderless payments</li>
          </ul>
        </div>
      </div>
    {:else}
      <!-- Wallet Connected -->
      <div class="space-y-6">
        <!-- Wallet Overview -->
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-8 text-white">
          <div class="flex items-center justify-between mb-6">
            <div>
              <p class="text-orange-100 text-sm mb-1">Connected Wallet</p>
              <h2 class="text-2xl font-bold">Earnings Dashboard</h2>
            </div>
            <div class="bg-white/20 p-4 rounded-lg">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
              </svg>
            </div>
          </div>

          <div class="bg-white/10 rounded-lg p-4">
            <p class="text-orange-100 text-sm mb-1">Wallet Address</p>
            <p class="font-mono text-sm break-all">{$walletStore.address}</p>
          </div>

          <div class="flex justify-end mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onclick={refreshEarnings}
              disabled={loading}
              class="text-white border-white/30 hover:bg-white/10"
            >
              {#if loading}
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              {:else}
                Refresh
              {/if}
            </Button>
          </div>
        </div>

        <!-- Error State -->
        {#if error}
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              <p class="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        {/if}

        <!-- Earnings Dashboard -->
        {#if loading}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Loading earnings data...</p>
          </div>
        {:else}
          <EarningsChart {earnings} {exchangeRates} />
        {/if}
      </div>
    {/if}
  </div>
</div>
