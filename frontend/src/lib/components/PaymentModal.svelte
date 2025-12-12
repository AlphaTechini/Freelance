<script>
  import Button from './ui/Button.svelte';
  import Input from './ui/Input.svelte';
  
  let {
    isOpen = false,
    candidate,
    jobId,
    onClose = () => {},
    onPaymentComplete = () => {}
  } = $props();

  let selectedToken = 'ETH';
  let amount = '';
  let isProcessing = false;
  let error = '';

  const tokenOptions = [
    { value: 'ETH', label: 'ETH (Ethereum)', symbol: 'Ξ' },
    { value: 'USDC', label: 'USDC (USD Coin)', symbol: '$' },
    { value: 'KIRO', label: 'KIRO (Platform Token)', symbol: 'K' }
  ];

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    selectedToken = 'ETH';
    amount = '';
    error = '';
    isProcessing = false;
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      error = 'Please enter a valid amount greater than 0';
      return false;
    }
    if (numAmount > 1000) {
      error = 'Maximum payment amount is 1000 tokens';
      return false;
    }
    error = '';
    return true;
  };

  const handlePayment = async () => {
    if (!validateAmount()) return;

    isProcessing = true;
    error = '';

    try {
      const { apiService } = await import('$lib/services/api.js');
      const token = localStorage.getItem('token');
      if (token) {
        apiService.setToken(token);
      }

      // Simulate payment processing
      const paymentData = {
        candidateId: candidate._id,
        amount: parseFloat(amount),
        tokenType: selectedToken,
        jobId: jobId,
        purpose: 'candidate_payment'
      };

      const result = await apiService.sendPayment(paymentData);

      // Show success message
      alert(`Payment of ${amount} ${selectedToken} sent successfully to ${candidate.name}!`);
      
      onPaymentComplete(result);
      handleClose();

    } catch (err) {
      console.error('Payment failed:', err);
      error = err.message || 'Payment failed. Please try again.';
    } finally {
      isProcessing = false;
    }
  };

  const getTokenSymbol = (tokenValue) => {
    const token = tokenOptions.find(t => t.value === tokenValue);
    return token ? token.symbol : '';
  };
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={handleClose}
  >
    <!-- Modal Content -->
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Send Payment
        </h2>
        <button 
          onclick={handleClose}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          disabled={isProcessing}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Candidate Info -->
      <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="flex items-center gap-3">
          {#if candidate.profileImage}
            <img 
              src={candidate.profileImage} 
              alt={candidate.name}
              class="w-10 h-10 rounded-full object-cover"
            />
          {:else}
            <div class="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
              {candidate.name?.charAt(0) || 'C'}
            </div>
          {/if}
          
          <div>
            <h3 class="font-medium text-gray-900 dark:text-white">
              {candidate.name || 'Candidate'}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {candidate.major || candidate.fieldOfStudy || 'Professional'}
            </p>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div class="space-y-4">
        <!-- Token Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token Type
          </label>
          <select 
            bind:value={selectedToken}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            disabled={isProcessing}
          >
            {#each tokenOptions as token}
              <option value={token.value}>{token.label}</option>
            {/each}
          </select>
        </div>

        <!-- Amount Input -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <div class="relative">
            <Input
              bind:value={amount}
              type="number"
              step="0.001"
              min="0"
              max="1000"
              placeholder="0.00"
              disabled={isProcessing}
              class="pr-12"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span class="text-gray-500 dark:text-gray-400 font-medium">
                {getTokenSymbol(selectedToken)}
              </span>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        {#if error}
          <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        {/if}

        <!-- Payment Summary -->
        {#if amount && !error}
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div class="flex justify-between items-center">
              <span class="text-sm text-blue-700 dark:text-blue-300">Total Payment:</span>
              <span class="font-semibold text-blue-900 dark:text-blue-100">
                {amount} {selectedToken}
              </span>
            </div>
            <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
              This is a test transaction using testnet tokens
            </p>
          </div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 mt-6">
        <Button 
          variant="ghost" 
          onclick={handleClose}
          disabled={isProcessing}
          class="flex-1"
        >
          Cancel
        </Button>
        
        <Button 
          variant="primary" 
          onclick={handlePayment}
          disabled={isProcessing || !amount || !!error}
          class="flex-1"
        >
          {#if isProcessing}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          {:else}
            Send Payment
          {/if}
        </Button>
      </div>
    </div>
  </div>
{/if}