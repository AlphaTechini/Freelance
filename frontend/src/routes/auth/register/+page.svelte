<script>
  import { goto } from '$app/navigation';
  import { authStore, signUpWithWallet } from '$lib/stores/auth.js';
  import { walletStore, WALLET_TYPES } from '$lib/services/wallet.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import WalletConnect from '$lib/components/WalletConnect.svelte';

  let username = $state('');
  let email = $state('');
  let displayName = $state('');
  let role = $state('');
  let loading = $state(false);
  let error = $state('');
  let agreedToTerms = $state(false);
  let usernameAvailable = $state(null);
  let emailAvailable = $state(null);
  let checkingUsername = $state(false);
  let checkingEmail = $state(false);

  // Form validation
  let usernameError = $state('');
  let emailError = $state('');
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

  async function checkEmailAvailability(value) {
    if (!value || validateEmail(value)) {
      emailAvailable = null;
      return;
    }

    try {
      checkingEmail = true;
      const response = await apiService.checkEmailAvailability(value);
      emailAvailable = response.available;
      
      if (!response.available) {
        emailError = 'This email is already registered';
      }
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      checkingEmail = false;
    }
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

  async function handleWalletRegister() {
    if (!$walletStore.isConnected) {
      error = 'Please connect your wallet first';
      return;
    }

    // Validate inputs
    usernameError = validateUsername(username);
    displayNameError = validateDisplayName(displayName);
    emailError = validateEmail(email);
    roleError = validateRole(role);

    if (usernameError || displayNameError || emailError || roleError) {
      return;
    }

    if (usernameAvailable === false) {
      usernameError = 'This username is already taken';
      return;
    }

    if (emailAvailable === false) {
      emailError = 'This email is already registered';
      return;
    }

    if (!agreedToTerms) {
      error = 'Please agree to the Terms of Service and Privacy Policy';
      return;
    }

    try {
      loading = true;
      error = '';
      
      await signUpWithWallet(username, email, displayName, role, WALLET_TYPES.METAMASK);
      
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
      loading = false;
    }
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
    if (email) {
      emailError = '';
      emailAvailable = null;
      // Debounce email availability check
      const timer = setTimeout(() => {
        checkEmailAvailability(email);
      }, 500);
      return () => clearTimeout(timer);
    }
  });

  $effect(() => {
    if (displayName) displayNameError = '';
  });
  
  $effect(() => {
    if (role) roleError = '';
  });
</script>

<svelte:head>
  <title>Register - TalentFind</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-orange-500 mb-2">TalentFind</h1>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Create Account</h2>
      <p class="text-gray-600 dark:text-gray-400">Join the universal talent platform</p>
    </div>

    <!-- Register Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      {#if error}
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      {/if}

      <!-- Wallet Connection First -->
      <div class="mb-8">
        <div class="text-center mb-4">
          <div class="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            First, connect your crypto wallet to secure your account
          </p>
        </div>

        <WalletConnect 
          showBalance={false}
          variant="primary"
          size="lg"
          class="w-full"
        />
      </div>

      {#if $walletStore.isConnected}
        <!-- Registration Form -->
        <form onsubmit={(e) => { e.preventDefault(); handleWalletRegister(); }} class="space-y-6">
          <!-- Role Selection -->
          <fieldset>
            <legend class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                    disabled={loading}
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
                disabled={loading}
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

          <!-- Email Input -->
          <div>
            <div class="relative">
              <Input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                bind:value={email}
                error={emailError}
                required
                disabled={loading}
              />
              {#if checkingEmail}
                <div class="absolute right-3 top-9">
                  <div class="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                </div>
              {:else if emailAvailable === true && email}
                <div class="absolute right-3 top-9">
                  <span class="text-green-500">✓</span>
                </div>
              {:else if emailAvailable === false && email}
                <div class="absolute right-3 top-9">
                  <span class="text-red-500">✗</span>
                </div>
              {/if}
            </div>
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
              disabled={loading}
            />
          </div>

          <!-- Terms and Conditions -->
          <div class="flex items-start">
            <input
              type="checkbox"
              id="terms"
              bind:checked={agreedToTerms}
              disabled={loading}
              class="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label for="terms" class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              I agree to the 
              <a href="/terms" class="text-orange-500 hover:text-orange-600 underline">Terms of Service</a>
              and 
              <a href="/privacy" class="text-orange-500 hover:text-orange-600 underline">Privacy Policy</a>
            </label>
          </div>

          <!-- Register Button -->
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading || !agreedToTerms}
            class="w-full"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      {/if}

      <!-- Sign In Link -->
      <div class="mt-8 text-center">
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

    <!-- Security Features -->
    <div class="mt-6 text-center space-y-2">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        🔒 Secured with Blockchain Wallet Verification
      </p>
      <div class="flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <span>✓ No Passwords</span>
        <span>✓ Crypto Payments</span>
        <span>✓ Decentralized</span>
      </div>
    </div>
  </div>
</div>
