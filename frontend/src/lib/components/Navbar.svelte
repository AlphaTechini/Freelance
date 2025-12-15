<script>
  import { authStore, signOutUser } from '$lib/stores/auth.js';
  import { walletStore } from '$lib/services/wallet.js';
  import { goto } from '$app/navigation';
  import { Button, ThemeToggle } from './ui';
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

<nav class="navbar">
  <div class="container">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="logo">
          <img src="/icon.png" alt="MeritStack" class="logo-icon" />
          <span class="logo-text">MeritStack</span>
        </a>
      </div>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center gap-6">
        {#if $authStore.user?.role === 'recruiter'}
          <a href="/dashboard/recruiter" class="nav-link">
            Dashboard
          </a>
          <a href="/dashboard/recruiter/jobs" class="nav-link">
            Jobs
          </a>
          <a href="/dashboard/recruiter/candidates" class="nav-link">
            Candidates
          </a>
          <a href="/dashboard/recruiter/payments" class="nav-link">
            Payments
          </a>
        {:else if $authStore.user}
          <a href="/dashboard/candidate" class="nav-link">
            Dashboard
          </a>
          <a href="/gigs" class="nav-link">
            Browse Gigs
          </a>
          <a href="/orders" class="nav-link">
            Orders
          </a>
          <a href="/messages" class="nav-link">
            Messages
          </a>
        {:else}
          <a href="/gigs" class="nav-link">
            Browse Gigs
          </a>
        {/if}
      </div>

      <!-- Right Side Actions -->
      <div class="hidden md:flex items-center gap-4">
        <!-- Theme Toggle -->
        <ThemeToggle />
        
        {#if $authStore.user}
          <!-- Wallet Connection -->
          {#if !$walletStore.isConnected}
            <WalletConnect showBalance={false} variant="secondary" size="sm" />
          {:else}
            <div class="wallet-display">
              <p class="caption">Wallet</p>
              <p class="wallet-address">
                {formatAddress($walletStore.address)}
              </p>
            </div>
          {/if}

          <!-- User Menu -->
          <div class="relative">
            <button
              onclick={toggleUserMenu}
              class="user-menu-trigger"
            >
              <div class="user-avatar">
                {$authStore.user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {#if userMenuOpen}
              <div class="user-menu slide-in-down">
                <a href="/profile" class="user-menu-item">
                  Profile
                </a>
                <a href="/wallet" class="user-menu-item">
                  Wallet
                </a>
                {#if $authStore.user?.role === 'recruiter'}
                  <a href="/dashboard/recruiter/settings" class="user-menu-item">
                    Settings
                  </a>
                  <a href="/dashboard/recruiter/jobs/create" class="user-menu-item">
                    Create Job
                  </a>
                {:else}
                  <a href="/gigs/create" class="user-menu-item">
                    Create Gig
                  </a>
                {/if}
                <hr class="menu-divider" />
                <button
                  onclick={handleSignOut}
                  class="user-menu-item text-error w-full text-left"
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
          class="text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400"
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
          {#if $authStore.user?.role === 'recruiter'}
            <a href="/dashboard/recruiter" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Dashboard
            </a>
            <a href="/dashboard/recruiter/jobs" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Jobs
            </a>
            <a href="/dashboard/recruiter/candidates" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Candidates
            </a>
            <a href="/dashboard/recruiter/payments" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Payments
            </a>
            <a href="/dashboard/recruiter/settings" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Settings
            </a>
          {:else if $authStore.user}
            <a href="/dashboard/candidate" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Dashboard
            </a>
            <a href="/gigs" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Browse Gigs
            </a>
            <a href="/orders" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Orders
            </a>
            <a href="/messages" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Messages
            </a>
            <a href="/gigs/create" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Create Gig
            </a>
          {:else}
            <a href="/gigs" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Browse Gigs
            </a>
          {/if}
          
          {#if $authStore.user}
            <a href="/profile" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Profile
            </a>
            <a href="/wallet" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              Wallet
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

<style>
  .navbar {
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(8px);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .logo:hover {
    transform: scale(1.05);
  }

  .logo-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 6px;
    object-fit: contain;
  }

  .logo-text {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--accent-color);
    transition: color 0.2s ease;
  }

  .logo:hover .logo-text {
    color: var(--accent-hover);
  }

  .nav-link {
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .nav-link:hover {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }

  .wallet-display {
    background: var(--bg-secondary);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .wallet-address {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .user-menu-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.2s ease;
    font-family: inherit;
  }

  .user-menu-trigger:hover {
    color: var(--accent-color);
  }

  .user-avatar {
    width: 2rem;
    height: 2rem;
    background: var(--accent-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .user-menu {
    position: absolute;
    right: 0;
    top: 100%;
    margin-top: 0.5rem;
    width: 12rem;
    background: var(--bg-card);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border-color);
    padding: 0.5rem 0;
    z-index: 50;
  }

  .user-menu-item {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  .user-menu-item:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .menu-divider {
    margin: 0.5rem 0;
    border: none;
    border-top: 1px solid var(--border-color);
  }

  /* Mobile styles are handled by existing Tailwind classes */
</style>