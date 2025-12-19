<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.js';
  import { walletStore } from '$lib/services/wallet.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';

  let localStorageData = $state({});
  let apiServiceToken = $state('');
  let profileResponse = $state(null);
  let profileError = $state('');
  let testing = $state(false);

  onMount(() => {
    loadDebugInfo();
  });

  function loadDebugInfo() {
    // Get localStorage data
    localStorageData = {
      auth_token: localStorage.getItem('auth_token'),
      auth_user: localStorage.getItem('auth_user')
    };

    // Get API service token
    apiServiceToken = apiService.token || '(not set)';
  }

  async function testProfile() {
    try {
      testing = true;
      profileError = '';
      profileResponse = null;

      const response = await apiService.getProfile();
      profileResponse = response;
    } catch (err) {
      profileError = err.message;
    } finally {
      testing = false;
    }
  }

  function clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    apiService.setToken(null);
    loadDebugInfo();
    alert('Auth data cleared!');
  }

  function copyToken() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigator.clipboard.writeText(token);
      alert('Token copied to clipboard!');
    }
  }
</script>

<svelte:head>
  <title>Auth Debug - MeritStack</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">🔍 Authentication Debug</h1>

    <!-- Auth Store -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Auth Store State</h2>
      <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-sm">{JSON.stringify($authStore, null, 2)}</pre>
    </div>

    <!-- Wallet Store -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Wallet Store State</h2>
      <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-sm">{JSON.stringify($walletStore, null, 2)}</pre>
    </div>

    <!-- LocalStorage -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">LocalStorage Data</h2>
      <div class="space-y-4">
        <div>
          <h3 class="font-medium mb-2">auth_token:</h3>
          <div class="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm break-all">
            {localStorageData.auth_token || '(not set)'}
          </div>
          {#if localStorageData.auth_token}
            <Button size="sm" variant="secondary" onclick={copyToken} class="mt-2">
              Copy Token
            </Button>
          {/if}
        </div>
        <div>
          <h3 class="font-medium mb-2">auth_user:</h3>
          <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-auto">{localStorageData.auth_user || '(not set)'}</pre>
        </div>
      </div>
    </div>

    <!-- API Service Token -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">API Service Token</h2>
      <div class="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm break-all">
        {apiServiceToken}
      </div>
    </div>

    <!-- Test Profile API -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Test Profile API</h2>
      <Button onclick={testProfile} loading={testing} disabled={testing}>
        Test GET /auth/profile
      </Button>

      {#if profileResponse}
        <div class="mt-4">
          <h3 class="font-medium mb-2 text-green-600">✅ Success:</h3>
          <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-auto">{JSON.stringify(profileResponse, null, 2)}</pre>
        </div>
      {/if}

      {#if profileError}
        <div class="mt-4">
          <h3 class="font-medium mb-2 text-red-600">❌ Error:</h3>
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm">
            {profileError}
          </div>
        </div>
      {/if}
    </div>

    <!-- Actions -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Actions</h2>
      <div class="flex gap-4">
        <Button variant="secondary" onclick={loadDebugInfo}>
          Refresh Data
        </Button>
        <Button variant="danger" onclick={clearAuth}>
          Clear Auth Data
        </Button>
        <Button variant="primary" onclick={() => window.location.href = '/auth/login'}>
          Go to Login
        </Button>
      </div>
    </div>
  </div>
</div>
