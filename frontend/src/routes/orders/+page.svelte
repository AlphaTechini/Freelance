<script>
  import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
  <title>Orders - MeritStack</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Orders</h1>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
      <svg class="w-24 h-24 mx-auto text-gray-400 dark:text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      
      <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Order Management Coming Soon</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        The order tracking and management features will be implemented in upcoming tasks.
      </p>
      
      <Button variant="primary" size="md" onclick={() => window.location.href = '/'}>
        Back to Home
      </Button>
    </div>
  </div>
</div>
