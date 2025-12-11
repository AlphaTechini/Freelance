<script>
  import { authStore } from '$lib/stores/auth.js';
  import { walletStore } from '$lib/services/wallet.js';
  import Button from '$lib/components/ui/Button.svelte';
  import WalletConnect from '$lib/components/WalletConnect.svelte';
</script>

<svelte:head>
  <title>Wallet - CryptoGigs</title>
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
          Connect your crypto wallet to start making and receiving payments on CryptoGigs.
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
              <p class="text-orange-100 text-sm mb-1">Total Balance</p>
              <h2 class="text-4xl font-bold">{parseFloat($walletStore.balance).toFixed(4)} ETH</h2>
            </div>
            <div class="bg-white/20 p-4 rounded-lg">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>

          <div class="bg-white/10 rounded-lg p-4">
            <p class="text-orange-100 text-sm mb-1">Wallet Address</p>
            <p class="font-mono text-sm break-all">{$walletStore.address}</p>
          </div>
        </div>

        <!-- Wallet Details -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Network</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              Chain {$walletStore.chainId}
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Wallet Type</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {$walletStore.walletType}
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              Connected
            </p>
          </div>
        </div>

        <!-- Transaction History Placeholder -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Transaction History</h2>
          
          <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400">No transactions yet</p>
            <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Your transaction history will appear here once you start using the platform
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="primary" size="md" onclick={() => window.location.href = '/gigs'}>
              Browse Gigs
            </Button>
            <Button variant="secondary" size="md" onclick={() => window.location.href = '/gigs/create'}>
              Create a Gig
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
