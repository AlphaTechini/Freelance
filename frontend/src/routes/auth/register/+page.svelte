<script>
  import { goto } from '$app/navigation';
  import { authStore, signUpWithWallet } from '$lib/stores/auth.js';
  import { walletStore, connectWallet, switchNetwork, WALLET_TYPES } from '$lib/services/wallet.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  // BNB Testnet chain ID
  const BNB_TESTNET_CHAIN_ID = 97;

  let username = $state('');
  let email = $state('');
  let role = $state('');
  let loading = $state(false);
  let error = $state('');
  let agreedToTerms = $state(false);
  let usernameAvailable = $state(null);
  let emailAvailable = $state(null);
  let checkingUsername = $state(false);
  let checkingEmail = $state(false);
  
  // Step management: Step 1 = Details, Step 2 = Role + Connect Wallet & Register
  let currentStep = $state(1);
  const totalSteps = 2;

  // Form validation
  let usernameError = $state('');
  let emailError = $state('');
  let roleError = $state('');
  
  // Role options
  const roleOptions = [
    { value: 'freelancer', label: 'Freelancer', description: 'Offer your services and skills', icon: '💼' },
    { value: 'student', label: 'Student', description: 'Currently pursuing education', icon: '📚' },
    { value: 'graduate', label: 'Graduate', description: 'Completed undergraduate education', icon: '🎓' },
    { value: 'recruiter', label: 'Recruiter', description: 'Find and hire talent', icon: '🔍' }
  ];

  function validateUsername(value) {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 30) return 'Username must be less than 30 characters';
    const usernameRegex = /^[a-z0-9_-]+$/;
    if (!usernameRegex.test(value.toLowerCase())) {
      return 'Only lowercase letters, numbers, hyphens, and underscores';
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
      if (!response.available) usernameError = 'Username already taken';
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      checkingUsername = false;
    }
  }

  function validateEmail(value) {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email';
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
      if (!response.available) emailError = 'Email already registered';
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      checkingEmail = false;
    }
  }

  function nextStep() {
    usernameError = validateUsername(username);
    emailError = validateEmail(email);
    
    if (usernameError || emailError) return;
    if (usernameAvailable === false) {
      usernameError = 'Username already taken';
      return;
    }
    if (emailAvailable === false) {
      emailError = 'Email already registered';
      return;
    }
    if (!agreedToTerms) {
      error = 'Please agree to the Terms of Service';
      return;
    }
    
    currentStep = 2;
    error = '';
  }
  
  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      error = '';
    }
  }

  async function handleRegister() {
    if (!role) {
      roleError = 'Please select a role';
      return;
    }

    try {
      loading = true;
      error = '';
      
      // Step 1: Connect wallet (this will prompt MetaMask)
      const { address, chainId } = await connectWallet(WALLET_TYPES.METAMASK);
      
      // Step 2: Switch to BNB Testnet if needed
      if (chainId !== BNB_TESTNET_CHAIN_ID) {
        try {
          await switchNetwork(BNB_TESTNET_CHAIN_ID);
        } catch (switchErr) {
          console.warn('Could not auto-switch network:', switchErr.message);
        }
      }
      
      // Step 3: Register with wallet
      await signUpWithWallet(username, email, username, role, WALLET_TYPES.METAMASK);
      
      // Small delay to ensure token is fully stored before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect to profile edit
      goto('/profile/edit');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message?.includes('already exists') || err.message?.includes('already registered')) {
        if (err.message?.includes('Redirecting to dashboard')) {
          // User is already registered and logged in, redirect them
          error = 'You are already registered! Redirecting...';
          setTimeout(() => goto('/dashboard'), 1500);
        } else {
          error = 'This wallet/email is already registered. Please sign in instead.';
          setTimeout(() => goto('/auth/login'), 2000);
        }
      } else if (err.message?.includes('rejected')) {
        error = 'Wallet connection was rejected. Please try again.';
      } else if (err.message?.includes('USERNAME_TAKEN')) {
        error = 'This username is already taken. Please choose another.';
        currentStep = 1; // Go back to step 1
      } else if (err.message?.includes('EMAIL_TAKEN')) {
        error = 'This email is already registered. Please use another or sign in.';
        currentStep = 1; // Go back to step 1
      } else {
        error = err.message || 'Failed to create account';
      }
    } finally {
      loading = false;
    }
  }

  // Debounce timers
  let usernameTimer;
  let emailTimer;

  function handleUsernameChange() {
    usernameError = '';
    usernameAvailable = null;
    clearTimeout(usernameTimer);
    if (username) {
      usernameTimer = setTimeout(() => checkUsernameAvailability(username), 500);
    }
  }

  function handleEmailChange() {
    emailError = '';
    emailAvailable = null;
    clearTimeout(emailTimer);
    if (email) {
      emailTimer = setTimeout(() => checkEmailAvailability(email), 500);
    }
  }
</script>

<svelte:head>
  <title>Sign Up - MeritStack</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-orange-500 mb-2">MeritStack</h1>
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

      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-center">
          <div class="flex items-center">
            <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 
              {currentStep >= 1 ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 text-gray-300'}">
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <div class="w-16 h-0.5 mx-2 {currentStep > 1 ? 'bg-orange-500' : 'bg-gray-300'}"></div>
            <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 
              {currentStep === 2 ? 'border-orange-500 text-orange-500' : 'border-gray-300 text-gray-300'}">
              2
            </div>
          </div>
        </div>
        <div class="flex justify-center mt-2 text-xs text-gray-500 gap-12">
          <span>Details</span>
          <span>Role & Wallet</span>
        </div>
      </div>

      <!-- Step 1: Account Details -->
      {#if currentStep === 1}
        <div class="space-y-5">
          <!-- Email Input -->
          <div>
            <div class="relative">
              <Input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                bind:value={email}
                oninput={handleEmailChange}
                error={emailError}
                required
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

          <!-- Username Input -->
          <div>
            <div class="relative">
              <Input
                type="text"
                label="Username"
                placeholder="Choose a unique username"
                bind:value={username}
                oninput={handleUsernameChange}
                error={usernameError}
                required
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
              This will also be your display name
            </p>
          </div>

          <!-- Terms and Conditions -->
          <div class="flex items-start pt-2">
            <input
              type="checkbox"
              id="terms"
              bind:checked={agreedToTerms}
              class="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label for="terms" class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              I agree to the 
              <a href="/terms" class="text-orange-500 hover:text-orange-600 underline">Terms</a>
              and 
              <a href="/privacy" class="text-orange-500 hover:text-orange-600 underline">Privacy Policy</a>
            </label>
          </div>

          <!-- Continue Button -->
          <Button
            type="button"
            onclick={(e) => { e.preventDefault(); nextStep(); }}
            variant="primary"
            size="lg"
            class="w-full"
            disabled={!email || !username || !agreedToTerms}
          >
            Continue
          </Button>
        </div>
      {/if}

      <!-- Step 2: Role Selection + Wallet Connect -->
      {#if currentStep === 2}
        <div class="space-y-6">
          <div class="text-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Choose Your Role
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              What best describes you?
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3">
            {#each roleOptions as roleOption}
              <button
                type="button"
                onclick={() => { role = roleOption.value; roleError = ''; }}
                class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all text-left
                  {role === roleOption.value 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'}"
              >
                <span class="text-2xl mr-3">{roleOption.icon}</span>
                <div>
                  <span class="block text-sm font-medium text-gray-900 dark:text-white">
                    {roleOption.label}
                  </span>
                  <span class="block text-xs text-gray-500 dark:text-gray-400">
                    {roleOption.description}
                  </span>
                </div>
                {#if role === roleOption.value}
                  <span class="absolute right-4 text-orange-500">✓</span>
                {/if}
              </button>
            {/each}
          </div>
          {#if roleError}
            <p class="text-sm text-red-600 dark:text-red-400">{roleError}</p>
          {/if}

          <!-- Info about wallet connection -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <span class="font-medium">🔗 Next:</span> Clicking "Create Account" will connect your MetaMask wallet to BNB Testnet and complete registration.
            </p>
          </div>

          <div class="flex space-x-4 pt-2">
            <Button
              type="button"
              onclick={(e) => { e.preventDefault(); prevStep(); }}
              variant="secondary"
              size="lg"
              class="flex-1"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              type="button"
              onclick={(e) => { e.preventDefault(); handleRegister(); }}
              variant="primary"
              size="lg"
              class="flex-1"
              loading={loading}
              disabled={loading || !role}
            >
              {loading ? 'Connecting...' : 'Create Account'}
            </Button>
          </div>
        </div>
      {/if}

      <!-- Sign In Link -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?
          <a href="/auth/login" class="text-orange-500 hover:text-orange-600 font-medium">
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
        <span>✓ BNB Testnet</span>
      </div>
    </div>
  </div>
</div>
