<script>
  let { suggestions = [] } = $props();
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    AI Improvement Suggestions
  </h3>
  
  {#if suggestions.length > 0}
    <div class="space-y-3">
      {#each suggestions as suggestion, index}
        <div class="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {index + 1}
          </div>
          <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {suggestion}
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8">
      <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
      </div>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        No suggestions available yet. Run a portfolio analysis to get personalized recommendations.
      </p>
    </div>
  {/if}
</div>