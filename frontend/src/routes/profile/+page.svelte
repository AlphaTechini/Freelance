<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { walletStore } from '$lib/services/wallet.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  import WalletConnect from '$lib/components/WalletConnect.svelte';
  
  let loading = $state(true);
  let error = $state('');
  let profile = $state(null);
  
  onMount(async () => {
    await loadProfile();
  });
  
  async function loadProfile() {
    try {
      loading = true;
      error = '';
      
      const response = await apiService.getProfile();
      
      if (response.success && response.user) {
        profile = response.user;
      }
    } catch (err) {
      error = 'Failed to load profile: ' + err.message;
    } finally {
      loading = false;
    }
  }
  
  function handleEditProfile() {
    goto('/profile/edit');
  }
</script>

<svelte:head>
  <title>Profile - MeritStack</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
      <Button variant="primary" size="md" onclick={handleEditProfile}>
        Edit Profile
      </Button>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
        {error}
      </div>
    {:else if profile}
      <!-- Profile Header -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-start gap-6">
          <!-- Profile Image -->
          <div class="flex-shrink-0">
            {#if profile.profileImage}
              <img src={profile.profileImage} alt={profile.displayName} class="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
            {:else}
              <div class="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span class="text-4xl text-gray-400">👤</span>
              </div>
            {/if}
          </div>
          
          <!-- Profile Info -->
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {profile.displayName}
              {#if profile.isVerified}
                <span class="text-blue-500 ml-2" title="Verified">✓</span>
              {/if}
            </h2>
            
            <p class="text-gray-600 dark:text-gray-400 mb-4">{profile.email}</p>
            
            {#if profile.bio}
              <p class="text-gray-700 dark:text-gray-300 mb-4">{profile.bio}</p>
            {/if}
            
            <!-- Stats -->
            <div class="flex gap-6 text-sm">
              <div>
                <span class="text-gray-600 dark:text-gray-400">Rating:</span>
                <span class="font-semibold text-gray-900 dark:text-white ml-1">
                  {profile.rating > 0 ? profile.rating.toFixed(1) : 'N/A'} ⭐
                </span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Orders:</span>
                <span class="font-semibold text-gray-900 dark:text-white ml-1">{profile.totalOrders}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Member since:</span>
                <span class="font-semibold text-gray-900 dark:text-white ml-1">
                  {new Date(profile.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills -->
      {#if profile.skills && profile.skills.length > 0}
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Skills</h2>
          <div class="flex flex-wrap gap-2">
            {#each profile.skills as skill}
              <span class="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-sm">
                {skill}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Preferences -->
      {#if profile.preferences}
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Preferences</h2>
          
          <div class="space-y-4">
            {#if profile.preferences.preferredTokens && profile.preferences.preferredTokens.length > 0}
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Preferred Payment Tokens</p>
                <div class="flex gap-2">
                  {#each profile.preferences.preferredTokens as token}
                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium">
                      {token}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
            
            <div class="flex gap-6 text-sm">
              <div>
                <span class="text-gray-600 dark:text-gray-400">In-app notifications:</span>
                <span class="font-medium text-gray-900 dark:text-white ml-1">
                  {profile.preferences.notifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Email notifications:</span>
                <span class="font-medium text-gray-900 dark:text-white ml-1">
                  {profile.preferences.emailNotifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Account Information -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Account Information</h2>
        
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Wallet Address</p>
            <p class="text-sm font-mono text-gray-900 dark:text-white break-all">{profile.walletAddress}</p>
          </div>

          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Email Verified</p>
            <p class="text-lg font-medium text-gray-900 dark:text-white">
              {$authStore.user?.emailVerified ? '✓ Verified' : '✗ Not Verified'}
            </p>
          </div>
          
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Account Status</p>
            <p class="text-lg font-medium text-gray-900 dark:text-white">
              {profile.isActive ? '✓ Active' : '✗ Inactive'}
            </p>
          </div>
        </div>
      </div>

      <!-- Wallet Information -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Wallet Connection</h2>
        
        {#if $walletStore.isConnected}
          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Connected Wallet</p>
              <p class="text-sm font-mono text-gray-900 dark:text-white break-all">{$walletStore.address}</p>
            </div>

            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Balance</p>
              <p class="text-lg font-medium text-gray-900 dark:text-white">
                {parseFloat($walletStore.balance).toFixed(4)} tBNB
              </p>
            </div>

            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Chain ID</p>
              <p class="text-lg font-medium text-gray-900 dark:text-white">{$walletStore.chainId}</p>
            </div>

            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Wallet Type</p>
              <p class="text-lg font-medium text-gray-900 dark:text-white capitalize">{$walletStore.walletType}</p>
            </div>
          </div>
        {:else}
          <div class="space-y-4">
            <p class="text-gray-600 dark:text-gray-400">
              Connect your wallet to enable cryptocurrency payments and access all platform features.
            </p>
            
            <WalletConnect showBalance={false} variant="primary" size="md" />
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
