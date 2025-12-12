<script>
  let {
    earnings = {
      totalEarnings: { ETH: 0, USDC: 0, KIRO: 0 },
      transactions: []
    },
    exchangeRates = { ETH: 2000, USDC: 1, KIRO: 0.5 }
  } = $props();

  // Calculate total USD value
  const totalUSD = $derived(() => {
    const { ETH, USDC, KIRO } = earnings.totalEarnings;
    return (ETH * exchangeRates.ETH) + (USDC * exchangeRates.USDC) + (KIRO * exchangeRates.KIRO);
  });

  // Get recent transactions (last 10)
  const recentTransactions = $derived(() => {
    return earnings.transactions.slice(0, 10);
  });

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
    return `${amount.toFixed(4)} ${currency}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get token color
  const getTokenColor = (tokenType) => {
    const colors = {
      ETH: 'text-blue-600 bg-blue-100',
      USDC: 'text-green-600 bg-green-100',
      KIRO: 'text-orange-600 bg-orange-100'
    };
    return colors[tokenType] || 'text-gray-600 bg-gray-100';
  };
</script>

<div class="space-y-6">
  <!-- Total Earnings Summary -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
      Total Earnings
    </h2>
    
    <div class="text-center mb-6">
      <div class="text-3xl font-bold text-orange-500 mb-2">
        {formatCurrency(totalUSD)}
      </div>
      <p class="text-gray-600 dark:text-gray-400">Total Value (USD)</p>
    </div>

    <!-- Token Breakdown -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {earnings.totalEarnings.ETH.toFixed(4)}
        </div>
        <div class="text-sm text-blue-700 dark:text-blue-300">ETH</div>
        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
          ≈ {formatCurrency(earnings.totalEarnings.ETH * exchangeRates.ETH)}
        </div>
      </div>

      <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
          {earnings.totalEarnings.USDC.toFixed(2)}
        </div>
        <div class="text-sm text-green-700 dark:text-green-300">USDC</div>
        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
          ≈ {formatCurrency(earnings.totalEarnings.USDC * exchangeRates.USDC)}
        </div>
      </div>

      <div class="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {earnings.totalEarnings.KIRO.toFixed(4)}
        </div>
        <div class="text-sm text-orange-700 dark:text-orange-300">KIRO</div>
        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
          ≈ {formatCurrency(earnings.totalEarnings.KIRO * exchangeRates.KIRO)}
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Transactions -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Recent Transactions
      </h2>
      <span class="text-sm text-gray-600 dark:text-gray-400">
        {earnings.transactions.length} total
      </span>
    </div>

    {#if recentTransactions.length === 0}
      <div class="text-center py-8">
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
        </svg>
        <p class="text-gray-600 dark:text-gray-400">No transactions yet</p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Payments from recruiters will appear here
        </p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each recentTransactions as transaction}
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center gap-3">
              <div class={`px-2 py-1 rounded text-xs font-medium ${getTokenColor(transaction.tokenType)}`}>
                {transaction.tokenType}
              </div>
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(transaction.amount, transaction.tokenType)}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  From {transaction.from}
                </div>
                {#if transaction.jobTitle}
                  <div class="text-xs text-gray-500 dark:text-gray-500">
                    {transaction.jobTitle}
                  </div>
                {/if}
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                +{formatCurrency(transaction.amount * exchangeRates[transaction.tokenType])}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-500">
                {formatDate(transaction.receivedAt)}
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if earnings.transactions.length > 10}
        <div class="text-center mt-4">
          <button class="text-orange-500 hover:text-orange-600 text-sm font-medium">
            View All Transactions ({earnings.transactions.length})
          </button>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Earnings Statistics -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
      Statistics
    </h2>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {earnings.transactions.length}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Total Payments
        </div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {earnings.transactions.length > 0 ? formatCurrency(totalUSD / earnings.transactions.length) : '$0'}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Avg Payment
        </div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {earnings.transactions.filter(t => new Date(t.receivedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          This Month
        </div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {Math.max(...earnings.transactions.map(t => t.amount * exchangeRates[t.tokenType]), 0).toFixed(0)}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Largest Payment
        </div>
      </div>
    </div>
  </div>
</div>