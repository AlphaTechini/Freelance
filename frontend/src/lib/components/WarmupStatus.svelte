<script>
  import { onMount, onDestroy } from 'svelte';
  import { warmupService } from '$lib/services/warmup.js';
  import LoadingSpinner from './LoadingSpinner.svelte';

  let warmupStatus = $state({
    isWarming: false,
    isWarmed: false,
    retryCount: 0,
    maxRetries: 5
  });

  let statusInterval;
  let showStatus = $state(false);

  onMount(() => {
    // Check initial status
    updateStatus();
    
    // Update status every second while warming up
    statusInterval = setInterval(() => {
      updateStatus();
    }, 1000);
  });

  onDestroy(() => {
    if (statusInterval) {
      clearInterval(statusInterval);
    }
  });

  function updateStatus() {
    const status = warmupService.getStatus();
    warmupStatus = status;
    
    // Show status if warming up or if there have been retries
    showStatus = status.isWarming || (status.retryCount > 0 && !status.isWarmed);
    
    // Hide status after warmup is complete
    if (status.isWarmed && statusInterval) {
      setTimeout(() => {
        showStatus = false;
        clearInterval(statusInterval);
        statusInterval = null;
      }, 2000);
    }
  }

  function getStatusMessage() {
    if (warmupStatus.isWarmed) {
      return 'Backend ready!';
    }
    
    if (warmupStatus.isWarming) {
      if (warmupStatus.retryCount > 0) {
        return `Starting backend... (attempt ${warmupStatus.retryCount}/${warmupStatus.maxRetries})`;
      }
      return 'Starting backend...';
    }
    
    return 'Connecting...';
  }

  function getStatusColor() {
    if (warmupStatus.isWarmed) return 'text-green-600';
    if (warmupStatus.retryCount > 2) return 'text-orange-600';
    return 'text-blue-600';
  }
</script>

{#if showStatus}
  <div class="warmup-status" class:success={warmupStatus.isWarmed}>
    <div class="status-content">
      {#if !warmupStatus.isWarmed}
        <LoadingSpinner size="sm" inline />
      {:else}
        <div class="success-icon">✓</div>
      {/if}
      
      <span class="status-text {getStatusColor()}">
        {getStatusMessage()}
      </span>
    </div>
    
    {#if warmupStatus.isWarming && warmupStatus.retryCount > 0}
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          style="width: {(warmupStatus.retryCount / warmupStatus.maxRetries) * 100}%"
        ></div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .warmup-status {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 200px;
    transition: all 0.3s ease;
  }

  .warmup-status.success {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .status-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .success-icon {
    width: 1rem;
    height: 1rem;
    background: #10b981;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
  }

  .status-text {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .progress-bar {
    margin-top: 0.5rem;
    height: 2px;
    background: #e5e7eb;
    border-radius: 1px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .warmup-status {
      background: #1f2937;
      border-color: #374151;
      color: #f9fafb;
    }

    .warmup-status.success {
      background: #064e3b;
      border-color: #10b981;
    }

    .progress-bar {
      background: #374151;
    }
  }
</style>