<script>
  import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
  <title>Messages - CryptoGigs</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Messages</h1>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
      <svg class="w-24 h-24 mx-auto text-gray-400 dark:text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      
      <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Messaging System Coming Soon</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        The real-time messaging features will be implemented in upcoming tasks.
      </p>
      
      <Button variant="primary" size="md" onclick={() => window.location.href = '/'}>
        Back to Home
      </Button>
    </div>
  </div>
</div>
