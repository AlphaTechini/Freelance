<script>
  import { goto } from '$app/navigation';
  import { authStore, signInWithWallet } from '$lib/stores/auth.js';
  import { walletStore, WALLET_TYPES } from '$lib/services/wallet.js';
  import Button from '$lib/components/ui/Button.svelte';
  import WalletConnect from '$lib/components/WalletConnect.svelte';

  let loading = $state(false);
  let loadingMessage = $state('');
  let error = $state('');

  async function handleWalletLogin() {
    if (!$walletStore.isConnected) {
      error = 'Please connect your wallet first';
      return;
    }

    try {
      loading = true;
      error = '';
      
      loadingMessage = 'Requesting signature...';
      const user = await signInWithWallet(WALLET_TYPES.METAMASK);
      
      // Redirect immediately after successful login
      if (user) {
        goto('/dashboard', { replaceState: true });
      }
    } catch (err) {
      console.error('Wallet login error:', err);
      error = err.message || 'Failed to authenticate with wallet';
    } finally {
      loading = false;
      loadingMessage = '';
    }
  }
</script>

<svelte:head>
  <title>Login - TalentFind</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-orange-500 mb-2">TalentFind</h1>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
      <p class="text-gray-600 dark:text-gray-400">Connect your wallet to sign in</p>
    </div>

    <!-- Login Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 relative">
      <!-- Loading Overlay -->
      {#if loading}
        <div class="absolute inset-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
            <p class="text-lg font-medium text-gray-900 dark:text-white">{loadingMessage}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Please check your wallet...</p>
          </div>
        </div>
      {/if}

      {#if error}
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      {/if}

      <!-- Wallet Authentication -->
      <div class="space-y-6">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Wallet Authentication
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Connect your crypto wallet to access your account securely
          </p>
        </div>

        <WalletConnect 
          showBalance={false}
          variant="primary"
          size="lg"
          class="w-full"
        />

        {#if $walletStore.isConnected}
          <form onsubmit={(e) => { e.preventDefault(); handleWalletLogin(); }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              class="w-full"
            >
              {loading ? (loadingMessage || 'Authenticating...') : 'Sign In with Wallet'}
            </Button>
          </form>
        {/if}
      </div>

      <!-- Sign Up Link -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <a 
            href="/auth/register" 
            class="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
          >
            Create account
          </a>
        </p>
      </div>
    </div>

    <!-- Security Features -->
    <div class="mt-6 text-center space-y-2">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        🔒 Secured with Blockchain Wallet Verification
      </p>
      <div class="flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <span>✓ No Passwords</span>
        <span>✓ Crypto Payments</span>
        <span>✓ Decentralized</span>
      </div>
    </div>
  </div>
</div>
