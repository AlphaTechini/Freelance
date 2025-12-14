<script>
  import { goto } from '$app/navigation';
  import { authStore, signUp, signUpWithWallet } from '$lib/stores/auth.js';
  import { walletStore, WALLET_TYPES } from '$lib/services/wallet.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import WalletConnect from '$lib/components/WalletConnect.svelte';

  let username = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let displayName = $state('');
  let role = $state('');
  let loading = $state(false);
  let error = $state('');
  let walletAuthLoading = $state(false);
  let showWalletAuth = $state(false);
  let agreedToTerms = $state(false);
  let usernameAvailable = $state(null);
  let checkingUsername = $state(false);

  // Form validation
  let usernameError = $state('');
  let emailError = $state('');
  let passwordError = $state('');
  let confirmPasswordError = $state('');
  let displayNameError = $state('');
  let roleError = $state('');
  
  // Role options
  const roleOptions = [
    { value: 'freelancer', label: 'Freelancer', description: 'Offer your services and skills' },
    { value: 'student', label: 'Student', description: 'Currently pursuing education' },
    { value: 'graduate', label: 'Graduate', description: 'Completed undergraduate education' },
    { value: 'phd', label: 'PhD Candidate', description: 'Advanced academic credentials' },
    { value: 'recruiter', label: 'Recruiter', description: 'Find and hire talent' }
  ];

  function validateUsername(value) {
    if (!value) {
      return 'Username is required';
    }
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 30) {
      return 'Username must be less than 30 characters';
    }
    const usernameRegex = /^[a-z0-9_-]+$/;
    if (!usernameRegex.test(value.toLowerCase())) {
      return 'Username can only contain lowercase letters, numbers, hyphens, and underscores';
    }
    return '';
  }

  async function checkUsernameAvailability(value) {
    if (!value || validateUsername(value)) {
      usernameAvailable = null;
      return;
    }

    try {
      checkingUsername = true;
      const response = await apiService.checkUsernameAvailability(value);
      usernameAvailable = response.available;
      
      if (!response.available) {
        usernameError = 'This username is already taken';
      }
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      checkingUsername = false;
    }
  }

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
    if (!/(?=.*[a-z])/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(value)) {
      return 'Password must contain at least one number';
    }
    return '';
  }

  function validateConfirmPassword(value) {
    if (!value) {
      return 'Please confirm your password';
    }
    if (value !== password) {
      return 'Passwords do not match';
    }
    return '';
  }
  
  function validateDisplayName(value) {
    if (!value) {
      return 'Display name is required';
    }
    if (value.length < 2) {
      return 'Display name must be at least 2 characters';
    }
    if (value.length > 50) {
      return 'Display name must be less than 50 characters';
    }
    return '';
  }
  
  function validateRole(value) {
    if (!value) {
      return 'Please select a role';
    }
    return '';
  }

  async function handleEmailRegister() {
    // Validate inputs
    usernameError = validateUsername(username);
    displayNameError = validateDisplayName(displayName);
    emailError = validateEmail(email);
    passwordError = validatePassword(password);
    confirmPasswordError = validateConfirmPassword(confirmPassword);
    roleError = validateRole(role);

    if (usernameError || displayNameError || emailError || passwordError || confirmPasswordError || roleError) {
      return;
    }

    if (usernameAvailable === false) {
      usernameError = 'This username is already taken';
      return;
    }

    if (!agreedToTerms) {
      error = 'Please agree to the Terms of Service and Privacy Policy';
      return;
    }

    try {
      loading = true;
      error = '';
      
      await signUp(username, email, password, displayName, role);
      
      // Redirect to profile creation page based on role
      if (role === 'recruiter') {
        goto('/profile/create?type=recruiter');
      } else {
        goto('/profile/create?type=candidate');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        error = 'This email is already registered. Please sign in instead.';
      } else {
        error = err.message || 'Failed to create account. Please try again.';
      }
    } finally {
      loading = false;
    }
  }

  async function handleWalletRegister() {
    if (!$walletStore.isConnected) {
      error = 'Please connect your wallet first';
      return;
    }

    // Validate inputs
    usernameError = validateUsername(username);
    displayNameError = validateDisplayName(displayName);
    emailError = validateEmail(email);
    passwordError = validatePassword(password);
    confirmPasswordError = validateConfirmPassword(confirmPassword);
    roleError = validateRole(role);

    if (usernameError || displayNameError || emailError || passwordError || confirmPasswordError || roleError) {
      return;
    }

    if (usernameAvailable === false) {
      usernameError = 'This username is already taken';
      return;
    }

    if (!agreedToTerms) {
      error = 'Please agree to the Terms of Service and Privacy Policy';
      return;
    }

    try {
      walletAuthLoading = true;
      error = '';
      
      await signUpWithWallet(username, email, password, displayName, role, WALLET_TYPES.METAMASK);
      
      // Redirect to profile creation page based on role
      if (role === 'recruiter') {
        goto('/profile/create?type=recruiter');
      } else {
        goto('/profile/create?type=candidate');
      }
    } catch (err) {
      console.error('Wallet registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        error = 'This email is already registered. Please sign in instead.';
      } else {
        error = err.message || 'Failed to create account with wallet';
      }
    } finally {
      walletAuthLoading = false;
    }
  }

  function handleWalletConnect() {
    showWalletAuth = true;
  }

  // Clear field errors on input
  $effect(() => {
    if (username) {
      usernameError = '';
      usernameAvailable = null;
      // Debounce username availability check
      const timer = setTimeout(() => {
        checkUsernameAvailability(username);
      }, 500);
      return () => clearTimeout(timer);
    }
  });

  $effect(() => {
    if (displayName) displayNameError = '';
  });
  
  $effect(() => {
    if (email) emailError = '';
  });

  $effect(() => {
    if (password) passwordError = '';
  });

  $effect(() => {
    if (confirmPassword) confirmPasswordError = '';
  });
  
  $effect(() => {
    if (role) roleError = '';
  });
</script>

<svelte:head>
  <title>Register - MeritStack</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-orange-500 mb-2">MeritStack</h1>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Create Account</h2>
      <p class="text-gray-600 dark:text-gray-400">Join the decentralized freelance marketplace</p>
    </div>

    <!-- Register Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      {#if error}
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); handleEmailRegister(e); }} class="space-y-6">
        <!-- Role Selection -->
        <fieldset>
          <legend class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Your Role *
          </legend>
          <div class="grid grid-cols-1 gap-3">
            {#each roleOptions as roleOption}
              <label 
                class="relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
                  {role === roleOption.value 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'}"
              >
                <input
                  type="radio"
                  name="role"
                  value={roleOption.value}
                  bind:group={role}
                  disabled={loading || walletAuthLoading}
                  class="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                />
                <div class="ml-3">
                  <span class="block text-sm font-medium text-gray-900 dark:text-white">
                    {roleOption.label}
                  </span>
                  <span class="block text-xs text-gray-500 dark:text-gray-400">
                    {roleOption.description}
                  </span>
                </div>
              </label>
            {/each}
          </div>
          {#if roleError}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{roleError}</p>
          {/if}
        </fieldset>
        
        <!-- Username Input -->
        <div>
          <div class="relative">
            <Input
              type="text"
              label="Username"
              placeholder="Choose a unique username"
              bind:value={username}
              error={usernameError}
              required
              disabled={loading || walletAuthLoading}
            />
            {#if checkingUsername}
              <div class="absolute right-3 top-9">
                <div class="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
              </div>
            {:else if usernameAvailable === true && username}
              <div class="absolute right-3 top-9">
                <span class="text-green-500">✓</span>
              </div>
            {:else if usernameAvailable === false && username}
              <div class="absolute right-3 top-9">
                <span class="text-red-500">✗</span>
              </div>
            {/if}
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Lowercase letters, numbers, hyphens, and underscores only
          </p>
        </div>

        <!-- Display Name Input -->
        <div>
          <Input
            type="text"
            label="Display Name"
            placeholder="Your full name"
            bind:value={displayName}
            error={displayNameError}
            required
            disabled={loading || walletAuthLoading}
          />
        </div>

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
            placeholder="Create a strong password"
            bind:value={password}
            error={passwordError}
            required
            disabled={loading || walletAuthLoading}
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Must be at least 6 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        <!-- Confirm Password Input -->
        <div>
          <Input
            type="password"
            label="Confirm Password"
            placeholder="Re-enter your password"
            bind:value={confirmPassword}
            error={confirmPasswordError}
            required
            disabled={loading || walletAuthLoading}
          />
        </div>

        <!-- Terms and Conditions -->
        <div class="flex items-start">
          <input
            type="checkbox"
            id="terms"
            bind:checked={agreedToTerms}
            disabled={loading || walletAuthLoading}
            class="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
          />
          <label for="terms" class="ml-2 text-sm text-gray-600 dark:text-gray-400">
            I agree to the 
            <a href="/terms" class="text-orange-500 hover:text-orange-600 underline">Terms of Service</a>
            and 
            <a href="/privacy" class="text-orange-500 hover:text-orange-600 underline">Privacy Policy</a>
          </label>
        </div>

        <!-- Email Register Button -->
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          disabled={loading || walletAuthLoading || !agreedToTerms}
          class="w-full"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Or register with wallet
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
            Register with Wallet
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
                disabled={loading || walletAuthLoading || !agreedToTerms}
                onclick={handleWalletRegister}
                class="w-full"
              >
                {walletAuthLoading ? 'Creating Account...' : 'Complete Registration with Wallet'}
              </Button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Sign In Link -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?
          <a 
            href="/auth/login" 
            class="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>

    <!-- Security Badge -->
    <div class="mt-6 text-center">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        🔒 Secured with Firebase Auth & Blockchain Wallet Verification
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        ✓ Dual Authentication • ✓ Crypto Payments • ✓ Decentralized
      </p>
    </div>
  </div>
</div>
