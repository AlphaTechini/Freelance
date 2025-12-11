<script>
  import { authStore, signOutUser } from '$lib/stores/auth.js';
  import { walletStore } from '$lib/services/wallet.js';
  import { goto } from '$app/navigation';
  import Button from './ui/Button.svelte';
  import WalletConnect from './WalletConnect.svelte';

  let mobileMenuOpen = $state(false);
  let userMenuOpen = $state(false);

  async function handleSignOut() {
    try {
      await signOutUser();
      goto('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
  }

  function formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
</script>

<nav class="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="text-2xl font-bold text-orange-500 hover:text-orange-600 transition-colors">
          CryptoGigs
        </a>
      </div>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-6">
        <a href="/gigs" class="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
          Browse Gigs
        </a>
        
        {#if $authStore.user}
          <a href="/orders" class="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            Orders
          </a>
          <a href="/messages" class="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            Messages
          </a>
        {/if}
      </div>

      <!-- Right Side Actions -->
      <div class="hidden md:flex items-center space-x-4">
        {#if $authStore.user}
          <!-- Wallet Connection -->
          {#if !$walletStore.isConnected}
            <WalletConnect showBalance={false} variant="secondary" size="sm" />
          {:else}
            <div class="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
              <p class="text-xs text-gray-600 dark:text-gray-400">Wallet</p>
              <p class="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                {formatAddress($walletStore.address)}
              </p>
            </div>
          {/if}

          <!-- User Menu -->
          <div class="relative">
            <button
              onclick={toggleUserMenu}
              class="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                {$authStore.user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {#if userMenuOpen}
              <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                <a href="/profile" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Profile
                </a>
                <a href="/wallet" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Wallet
                </a>
                <a href="/gigs/create" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Create Gig
                </a>
                <hr class="my-2 border-gray-200 dark:border-gray-700" />
                <button
                  onclick={handleSignOut}
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <Button variant="ghost" size="sm" onclick={() => goto('/auth/login')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onclick={() => goto('/auth/register')}>
            Get Started
          </Button>
        {/if}
      </div>

      <!-- Mobile Menu Button -->
      <div class="md:hidden">
        <button
          onclick={toggleMobileMenu}
          class="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if mobileMenuOpen}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            {/if}
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    {#if mobileMenuOpen}
      <div class="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
        <div class="space-y-2">
          <a href="/gigs" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            Browse Gigs
          </a>
          
          {#if $authStore.user}
            <a href="/orders" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Orders
            </a>
            <a href="/messages" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Messages
            </a>
            <a href="/profile" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Profile
            </a>
            <a href="/wallet" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Wallet
            </a>
            <a href="/gigs/create" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Create Gig
            </a>
            
            <div class="px-4 py-2">
              <WalletConnect showBalance={false} variant="secondary" size="sm" />
            </div>
            
            <button
              onclick={handleSignOut}
              class="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              Sign Out
            </button>
          {:else}
            <div class="px-4 py-2 space-y-2">
              <Button variant="ghost" size="sm" onclick={() => goto('/auth/login')} class="w-full">
                Sign In
              </Button>
              <Button variant="primary" size="sm" onclick={() => goto('/auth/register')} class="w-full">
                Get Started
              </Button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</nav>

<!-- Click outside to close menus -->
<svelte:window 
  onclick={(e) => {
    if (userMenuOpen && !e.target.closest('.relative')) {
      userMenuOpen = false;
    }
  }}
/>
