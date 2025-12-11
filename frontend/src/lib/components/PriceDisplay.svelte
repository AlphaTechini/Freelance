<script>
  import { onMount } from 'svelte';
  import { apiService } from '$lib/services/api.js';
  
  let {
    amount,
    currency,
    showUSD = true,
    class: className = ''
  } = $props();
  
  let usdValue = $state(null);
  let loading = $state(true);
  let error = $state(false);
  
  onMount(() => {
    loadPrice();
    
    // Refresh price every minute
    const interval = setInterval(loadPrice, 60000);
    
    return () => clearInterval(interval);
  });
  
  async function loadPrice() {
    if (!showUSD) {
      loading = false;
      return;
    }
    
    try {
      const response = await apiService.convertToUSD(amount, currency);
      
      if (response.success) {
        usdValue = response.usdValue;
        error = false;
      } else {
        error = true;
      }
    } catch (err) {
      error = true;
    } finally {
      loading = false;
    }
  }
  
  function formatUSD(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
</script>

<div class={className}>
  <div class="font-bold text-orange-500">
    {amount} {currency}
  </div>
  {#if showUSD}
    {#if loading}
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Loading USD value...
      </div>
    {:else if error}
      <div class="text-sm text-gray-500 dark:text-gray-400">
        USD value unavailable
      </div>
    {:else if usdValue !== null}
      <div class="text-sm text-gray-600 dark:text-gray-400">
        ≈ {formatUSD(usdValue)}
      </div>
    {/if}
  {/if}
</div>
