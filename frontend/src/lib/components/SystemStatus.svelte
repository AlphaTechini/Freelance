<script>
  import { onMount } from 'svelte';
  import { apiService } from '$lib/services/api.js';
  import Button from './ui/Button.svelte';
  
  let systemHealth = $state(null);
  let loading = $state(true);
  let error = $state('');
  let lastChecked = $state(null);
  
  onMount(async () => {
    await checkSystemHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    
    return () => clearInterval(interval);
  });
  
  async function checkSystemHealth() {
    try {
      loading = true;
      error = '';
      
      const health = await apiService.healthCheck();
      systemHealth = health;
      lastChecked = new Date();
      
    } catch (err) {
      error = err.message || 'Failed to check system health';
      systemHealth = null;
    } finally {
      loading = false;
    }
  }
  
  function getStatusColor(status) {
    switch (status) {
      case 'ok':
      case 'connected':
      case 'configured':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'degraded':
      case 'not_configured':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'error':
      case 'disconnected':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  }
  
  function getStatusIcon(status) {
    switch (status) {
      case 'ok':
      case 'connected':
      case 'configured':
        return '✅';
      case 'degraded':
      case 'not_configured':
        return '⚠️';
      case 'error':
      case 'disconnected':
        return '❌';
      default:
        return '❓';
    }
  }
  
  function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">System Status</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {#if lastChecked}
          Last checked: {formatTimestamp(lastChecked)}
        {:else}
          Checking system health...
        {/if}
      </p>
    </div>
    
    <Button 
      variant="outline" 
      size="sm" 
      onclick={checkSystemHealth}
      disabled={loading}
    >
      {loading ? 'Checking...' : 'Refresh'}
    </Button>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-2">
        <span class="text-red-500">❌</span>
        <span class="text-red-700 dark:text-red-300 font-medium">System Check Failed</span>
      </div>
      <p class="text-red-600 dark:text-red-400 mt-1">{error}</p>
    </div>
  {:else if systemHealth}
    <!-- Overall Status -->
    <div class="mb-6">
      <div class={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(systemHealth.status)}`}>
        <span>{getStatusIcon(systemHealth.status)}</span>
        <span class="capitalize">{systemHealth.status}</span>
      </div>
      
      {#if systemHealth.issues && systemHealth.issues.length > 0}
        <div class="mt-3">
          <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">Issues:</p>
          <ul class="text-sm text-red-600 dark:text-red-400 space-y-1">
            {#each systemHealth.issues as issue}
              <li>• {issue}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <!-- Service Status -->
    {#if systemHealth.services}
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Service Status</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each Object.entries(systemHealth.services) as [serviceKey, service]}
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex items-center gap-3">
                <span class="text-lg">{getStatusIcon(service.status)}</span>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {service.name || serviceKey}
                  </div>
                  <div class={`text-sm capitalize ${getStatusColor(service.status).split(' ')[0]}`}>
                    {service.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              <div class={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(service.status)}`}>
                {service.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- System Info -->
    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span class="font-medium text-gray-900 dark:text-white">Environment:</span>
          <span class="text-gray-600 dark:text-gray-400 ml-2">
            {import.meta.env.VITE_ENVIRONMENT || 'development'}
          </span>
        </div>
        
        <div>
          <span class="font-medium text-gray-900 dark:text-white">API URL:</span>
          <span class="text-gray-600 dark:text-gray-400 ml-2">
            {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}
          </span>
        </div>
        
        <div>
          <span class="font-medium text-gray-900 dark:text-white">Timestamp:</span>
          <span class="text-gray-600 dark:text-gray-400 ml-2">
            {formatTimestamp(systemHealth.timestamp)}
          </span>
        </div>
      </div>
    </div>
  {:else if loading}
    <!-- Loading State -->
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p class="text-gray-600 dark:text-gray-400">Checking system health...</p>
    </div>
  {/if}
</div>