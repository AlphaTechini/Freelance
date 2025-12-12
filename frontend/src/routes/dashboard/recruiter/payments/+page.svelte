<script>
  import { onMount } from 'svelte';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  
  let payments = $state([]);
  let stats = $state({
    totalPayments: 0,
    totalSpent: { ETH: 0, USDC: 0, KIRO: 0 },
    thisMonth: { ETH: 0, USDC: 0, KIRO: 0 }
  });
  let loading = $state(true);
  let error = $state('');
  let filters = $state({
    type: 'sent',
    page: 1,
    limit: 20
  });
  let pagination = $state({
    page: 1,
    pages: 1,
    total: 0
  });
  
  onMount(async () => {
    await Promise.all([
      loadPayments(),
      loadStats()
    ]);
  });
  
  async function loadPayments() {
    try {
      loading = true;
      error = '';
      
      const response = await apiService.getPaymentHistory(filters);
      if (response.success) {
        payments = response.payments || [];
        pagination = response.pagination || { page: 1, pages: 1, total: 0 };
      } else {
        error = response.message || 'Failed to load payments';
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
      error = 'Failed to load payments';
    } finally {
      loading = false;
    }
  }
  
  async function loadStats() {
    try {
      const response = await apiService.getPaymentStats();
      if (response.success) {
        stats = response.stats || stats;
      }
    } catch (err) {
      console.error('Failed to load payment stats:', err);
    }
  }
  
  async function handleFilterChange() {
    filters.page = 1;
    await loadPayments();
  }
  
  async function handlePageChange(newPage) {
    filters.page = newPage;
    await loadPayments();
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
  
  function formatCurrency(amount, currency) {
    return `${amount.toFixed(4)} ${currency}`;
  }
  
  function getStatusColor(status) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Payment History
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Track all your payments to candidates and freelancers
      </p>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  <!-- Payment Stats -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalPayments}</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total ETH Spent</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalSpent.ETH.toFixed(4)}</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total USDC Spent</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalSpent.USDC.toFixed(2)}</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total KIRO Spent</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalSpent.KIRO.toFixed(2)}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
      <div>
        <label for="type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Payment Type
        </label>
        <select
          id="type"
          bind:value={filters.type}
          onchange={handleFilterChange}
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="sent">Sent Payments</option>
          <option value="all">All Payments</option>
        </select>
      </div>
      
      <div>
        <label for="limit" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Per Page
        </label>
        <select
          id="limit"
          bind:value={filters.limit}
          onchange={handleFilterChange}
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Payments List -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    {#if loading}
      <div class="p-6">
        <div class="space-y-4">
          {#each Array(5) as _}
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          {/each}
        </div>
      </div>
    {:else if payments.length === 0}
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payments found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your payment history will appear here once you start paying candidates.
        </p>
      </div>
    {:else}
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each payments as payment}
          <div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                    Payment to {payment.recipient?.displayName || 'Candidate'}
                  </h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(payment.status)}">
                    {payment.status}
                  </span>
                </div>
                
                <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatCurrency(payment.amount, payment.tokenType)}</span>
                  <span>•</span>
                  <span>{formatDate(payment.createdAt)}</span>
                  {#if payment.job}
                    <span>•</span>
                    <span class="text-blue-600 dark:text-blue-400">
                      <a href="/jobs/{payment.job._id}" class="hover:underline">
                        {payment.job.title}
                      </a>
                    </span>
                  {/if}
                </div>
                
                {#if payment.notes}
                  <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {payment.notes}
                  </p>
                {/if}
                
                {#if payment.transactionId}
                  <div class="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    TX: {payment.transactionId}
                  </div>
                {/if}
              </div>
              
              <div class="ml-6 text-right">
                <p class="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(payment.amount, payment.tokenType)}
                </p>
                {#if payment.status === 'completed' && payment.completedAt}
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Completed {formatDate(payment.completedAt)}
                  </p>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Pagination -->
      {#if pagination.pages > 1}
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.page - 1) * filters.limit) + 1} to {Math.min(pagination.page * filters.limit, pagination.total)} of {pagination.total} payments
            </div>
            
            <div class="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onclick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onclick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>