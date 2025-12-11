<script>
  import { authStore } from '$lib/stores/auth.js';
  import { walletStore } from '$lib/services/wallet.js';
  import { apiService } from '$lib/services/api.js';
  import { onMount } from 'svelte';

  let apiStatus = 'checking...';
  let backendHealth = null;

  onMount(async () => {
    // Test API connection
    try {
      backendHealth = await apiService.healthCheck();
      apiStatus = 'connected';
    } catch (error) {
      apiStatus = 'disconnected';
      console.error('Backend connection failed:', error);
    }
  });
</script>

<svelte:head>
  <title>CryptoGigs - Decentralized Freelance Marketplace</title>
  <meta name="description" content="A decentralized freelance marketplace with cryptocurrency payments" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <header class="text-center mb-12">
    <h1 class="text-4xl font-bold mb-4 text-orange-500">CryptoGigs</h1>
    <p class="text-xl text-gray-600 dark:text-gray-300">
      Decentralized Freelance Marketplace with Cryptocurrency Payments
    </p>
  </header>

  <div class="max-w-4xl mx-auto">
    <!-- System Status -->
    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4">System Status</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Frontend Status -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h3 class="font-semibold text-green-600 dark:text-green-400">Frontend</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">Svelte 5 ✓</p>
          <p class="text-sm text-gray-600 dark:text-gray-300">Tailwind CSS ✓</p>
        </div>

        <!-- Backend Status -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h3 class="font-semibold" class:text-green-600={apiStatus === 'connected'} 
              class:text-green-400={apiStatus === 'connected'} 
              class:text-red-600={apiStatus === 'disconnected'}
              class:text-red-400={apiStatus === 'disconnected'}
              class:text-yellow-600={apiStatus === 'checking...'}
              class:text-yellow-400={apiStatus === 'checking...'}>
            Backend API
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Status: {apiStatus}
          </p>
          {#if backendHealth}
            <p class="text-sm text-gray-600 dark:text-gray-300">
              Fastify ✓
            </p>
          {/if}
        </div>

        <!-- Wallet Status -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h3 class="font-semibold" class:text-green-600={$walletStore.isConnected} 
              class:text-green-400={$walletStore.isConnected}
              class:text-gray-600={!$walletStore.isConnected}
              class:text-gray-400={!$walletStore.isConnected}>
            Wallet
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {$walletStore.isConnected ? 'Connected' : 'Not Connected'}
          </p>
          {#if $walletStore.isConnected}
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {$walletStore.address}
            </p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Authentication Status -->
    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4">Authentication</h2>
      
      {#if $authStore.loading}
        <p class="text-gray-600 dark:text-gray-300">Loading authentication...</p>
      {:else if $authStore.user}
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 class="font-semibold text-green-800 dark:text-green-200">Authenticated</h3>
          <p class="text-sm text-green-700 dark:text-green-300">
            Email: {$authStore.user.email}
          </p>
          <p class="text-sm text-green-700 dark:text-green-300">
            UID: {$authStore.user.uid}
          </p>
        </div>
      {:else}
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 class="font-semibold text-yellow-800 dark:text-yellow-200">Not Authenticated</h3>
          <p class="text-sm text-yellow-700 dark:text-yellow-300">
            Please sign in to access the platform
          </p>
        </div>
      {/if}
    </div>

    <!-- Project Structure -->
    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <h2 class="text-2xl font-semibold mb-4">Project Setup Complete</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold mb-2 text-orange-600 dark:text-orange-400">Frontend Features</h3>
          <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>✓ Svelte 5 with JavaScript</li>
            <li>✓ Tailwind CSS for styling</li>
            <li>✓ Firebase Authentication</li>
            <li>✓ Wallet integration (MetaMask)</li>
            <li>✓ API service layer</li>
            <li>✓ Reactive stores</li>
          </ul>
        </div>
        
        <div>
          <h3 class="font-semibold mb-2 text-orange-600 dark:text-orange-400">Backend Features</h3>
          <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>✓ Fastify server with JavaScript</li>
            <li>✓ CORS and rate limiting</li>
            <li>✓ JWT authentication</li>
            <li>✓ Blockchain integration (Ethers.js)</li>
            <li>✓ File upload support</li>
            <li>✓ Environment configuration</li>
          </ul>
        </div>
      </div>

      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">Get Started</h4>
        <p class="text-sm text-blue-700 dark:text-blue-300 mb-4">
          The authentication system is ready! Create an account or sign in to start using CryptoGigs.
        </p>
        <div class="flex gap-3">
          <a href="/auth/register" class="inline-block px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
            Create Account
          </a>
          <a href="/auth/login" class="inline-block px-4 py-2 bg-transparent border-2 border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg font-medium transition-colors">
            Sign In
          </a>
        </div>
      </div>
    </div>
  </div>
</div>