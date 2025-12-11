<script>
  import { walletStore, connectWallet, disconnectWallet, isMetaMaskInstalled, WALLET_TYPES } from '$lib/services/wallet.js';
  import Button from './ui/Button.svelte';

  let { 
    onConnect = () => {},
    onDisconnect = () => {},
    showBalance = true,
    variant = 'primary',
    size = 'md'
  } = $props();

  let connecting = $state(false);
  let error = $state('');

  async function handleConnect(walletType = WALLET_TYPES.METAMASK) {
    try {
      connecting = true;
      error = '';
      
      if (walletType === WALLET_TYPES.METAMASK && !isMetaMaskInstalled()) {
        error = 'MetaMask is not installed. Please install MetaMask to continue.';
        return;
      }

      await connectWallet(walletType);
      onConnect();
    } catch (err) {
      console.error('Wallet connection error:', err);
      error = err.message || 'Failed to connect wallet';
    } finally {
      connecting = false;
    }
  }

  function handleDisconnect() {
    disconnectWallet();
    onDisconnect();
  }

  function formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
</script>

<div class="wallet-connect">
  {#if $walletStore.isConnected}
    <div class="flex items-center gap-3">
      {#if showBalance}
        <div class="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">Balance</p>
          <p class="font-semibold text-gray-900 dark:text-white">
            {parseFloat($walletStore.balance).toFixed(4)} ETH
          </p>
        </div>
      {/if}
      
      <div class="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
        <p class="text-sm text-gray-600 dark:text-gray-400">Wallet</p>
        <p class="font-mono text-sm font-semibold text-gray-900 dark:text-white">
          {formatAddress($walletStore.address)}
        </p>
      </div>

      <Button 
        variant="ghost" 
        {size}
        onclick={handleDisconnect}
      >
        Disconnect
      </Button>
    </div>
  {:else}
    <div class="space-y-3">
      <Button 
        {variant}
        {size}
        loading={connecting}
        disabled={connecting}
        onclick={() => handleConnect(WALLET_TYPES.METAMASK)}
      >
        {connecting ? 'Connecting...' : 'Connect MetaMask'}
      </Button>

      {#if error}
        <p class="text-sm text-red-500">{error}</p>
      {/if}

      {#if !isMetaMaskInstalled()}
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have MetaMask? 
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-orange-500 hover:text-orange-600 underline"
          >
            Install it here
          </a>
        </p>
      {/if}
    </div>
  {/if}
</div>
