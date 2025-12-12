<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  
  let payments = $state([]);
  let loading = $state(true);
  let error = $state('');
  let currentPage = $state(1);
  let totalPages = $state(1);
  let pageSize = 20;
  
  onMount(async () => {
    await loadPayments();
  });
  
  async function loadPayments(page = 1) {
    try {
      loading = true;
      error = '';
      
      const response = await apiService.getPaymentHistory($authStore.user.username, page, pageSize);
      if (response.success) {
        payments = response.payments || [];
        currentPage = response.currentPage || 1;
        totalPages = response.totalPages || 1;
      }
    } catch (err) {
      error = 'Failed to load payment history: ' + err.message;
    } finally {
      loading = false;
    }
  }
  
  function handlePageChange(page) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadPayments(page);
    }
  }
  
  function formatCurrency(amount, currency = 'USD') {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
    return `${amount.toFixed(4)} ${currency}`;
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getTokenColor(tokenType) {
    const colors = {
      ETH: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      USDC: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      KIRO: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
    };
    return colors[tokenType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  }
  
  function getStatusColor(status) {
    const colors = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  }
</script>

<svelte:head>
  <title>Payment History - CryptoGigs</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment History
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Complete history of all payments received from recruiters.
        </p>
      </div>
      <Button variant="secondary" size="sm" onclick={() => loadPayments(currentPage)} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  <!-- Payments Table -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    {#if loading}
      <div class="p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p class="text-gray-600 dark:text-gray-400 mt-4">Loading payment history...</p>
      </div>
    {:else if payments.length === 0}
      <div class="p-12 text-center">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
        </svg>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Payments Yet</h3>
        <p class="text-gray-600 dark:text-gray-400">
          Your payment history will appear here once you start receiving payments from recruiters.
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                From
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Token
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Job
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Transaction ID
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {#each payments as payment}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatDate(payment.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {payment.fromUser?.displayName || 'Unknown'}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {payment.fromUser?.email || ''}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(payment.amount, payment.tokenType)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTokenColor(payment.tokenType)}`}>
                    {payment.tokenType}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {payment.job?.title || 'N/A'}
                  </div>
                  {#if payment.metadata?.purpose}
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {payment.metadata.purpose}
                    </div>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {payment.transactionId ? payment.transactionId.substring(0, 10) + '...' : 'N/A'}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
          <div class="flex-1 flex justify-between sm:hidden">
            <Button 
              variant="secondary" 
              size="sm" 
              onclick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onclick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Showing page <span class="font-medium">{currentPage}</span> of <span class="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onclick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {#each Array(Math.min(5, totalPages)) as _, i}
                  {@const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i}
                  {#if page <= totalPages}
                    <button
                      onclick={() => handlePageChange(page)}
                      class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                      class:bg-orange-50={page === currentPage}
                      class:border-orange-500={page === currentPage}
                      class:text-orange-600={page === currentPage}
                      class:bg-white={page !== currentPage}
                      class:border-gray-300={page !== currentPage}
                      class:text-gray-500={page !== currentPage}
                      class:dark:bg-orange-900/30={page === currentPage}
                      class:dark:border-orange-600={page === currentPage}
                      class:dark:text-orange-400={page === currentPage}
                      class:dark:bg-gray-800={page !== currentPage}
                      class:dark:border-gray-600={page !== currentPage}
                      class:dark:text-gray-400={page !== currentPage}
                      class:hover:bg-gray-50={page !== currentPage}
                      class:dark:hover:bg-gray-700={page !== currentPage}
                    >
                      {page}
                    </button>
                  {/if}
                {/each}
                
                <button
                  onclick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>