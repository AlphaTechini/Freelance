<script>
  import { goto } from '$app/navigation';
  import { authStore, signIn, signInWithWallet } from '$lib/stores/auth.js';
  import { walletStore, WALLET_TYPES } from '$lib/services/wallet.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import WalletConnect from '$lib/components/WalletConnect.svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');
  let walletAuthLoading = $state(false);
  let showWalletAuth = $state(false);

  // Form validation
  let emailError = $state('');
  let passwordError = $state('');

  function validateEmail(value) {
    if (!value) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  function validatePassword(value) {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  async function handleEmailLogin() {
    // Validate inputs
    emailError = validateEmail(email);
    passwordError = validatePassword(password);

    if (emailError || passwordError) {
      return;
    }

    try {
      loading = true;
      error = '';
      
      await signIn(email, password);
      
      // Redirect to home page after successful login
      goto('/');
    } catch (err) {
      console.error('Login error:', err);
      error = err.message || 'Failed to sign in. Please check your credentials.';
    } finally {
      loading = false;
    }
  }

  async function handleWalletLogin() {
    if (!$walletStore.isConnected) {
      error = 'Please connect your wallet first';
      return;
    }

    // Validate email and password
    emailError = validateEmail(email);
    passwordError = validatePassword(password);

    if (emailError || passwordError) {
      return;
    }

    try {
      walletAuthLoading = true;
      error = '';
      
      await signInWithWallet(email, password, WALLET_TYPES.METAMASK);
      
      // Redirect to home page after successful login
      goto('/');
    } catch (err) {
      console.error('Wallet login error:', err);
      error = err.message || 'Failed to authenticate with wallet';
    } finally {
      walletAuthLoading = false;
    }
  }

  function handleWalletConnect() {
    showWalletAuth = true;
  }

  // Clear field errors on input
  $effect(() => {
    if (email) emailError = '';
  });

  $effect(() => {
    if (password) passwordError = '';
  });
</script>

<svelte:head>
  <title>Login - MeritStack</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-orange-500 mb-2">MeritStack</h1>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
      <p class="text-gray-600 dark:text-gray-400">Sign in to your account</p>
    </div>

    <!-- Login Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      {#if error}
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); handleEmailLogin(e); }} class="space-y-6">
        <!-- Email Input -->
        <div>
          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            bind:value={email}
            error={emailError}
            required
            disabled={loading || walletAuthLoading}
          />
        </div>

        <!-- Password Input -->
        <div>
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            bind:value={password}
            error={passwordError}
            required
            disabled={loading || walletAuthLoading}
          />
        </div>

        <!-- Forgot Password Link -->
        <div class="flex justify-end">
          <a 
            href="/auth/forgot-password" 
            class="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
          >
            Forgot password?
          </a>
        </div>

        <!-- Email Login Button -->
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          disabled={loading || walletAuthLoading}
          class="w-full"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Or continue with wallet
          </span>
        </div>
      </div>

      <!-- Wallet Authentication -->
      <div class="space-y-4">
        {#if !showWalletAuth}
          <Button
            variant="secondary"
            size="md"
            onclick={() => showWalletAuth = true}
            disabled={loading || walletAuthLoading}
            class="w-full"
          >
            Sign In with Wallet
          </Button>
        {:else}
          <div class="space-y-4">
            <WalletConnect 
              onConnect={handleWalletConnect}
              showBalance={false}
              variant="secondary"
              size="md"
            />

            {#if $walletStore.isConnected}
              <Button
                variant="primary"
                size="md"
                loading={walletAuthLoading}
                disabled={loading || walletAuthLoading}
                onclick={handleWalletLogin}
                class="w-full"
              >
                {walletAuthLoading ? 'Authenticating...' : 'Complete Sign In with Wallet'}
              </Button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Sign Up Link -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <a 
            href="/auth/register" 
            class="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>

    <!-- Security Badge -->
    <div class="mt-6 text-center">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        🔒 Secured with Firebase Auth & Blockchain Wallet Verification
      </p>
    </div>
  </div>
</div>
