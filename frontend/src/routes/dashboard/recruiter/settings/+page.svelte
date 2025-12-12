<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  
  let { recruiter, loading } = $props();
  
  let profile = $state({
    company: '',
    position: '',
    bio: '',
    industry: '',
    profileImage: ''
  });
  let saving = $state(false);
  let error = $state('');
  let success = $state('');
  
  onMount(async () => {
    if (recruiter) {
      profile = {
        company: recruiter.company || '',
        position: recruiter.position || '',
        bio: recruiter.bio || '',
        industry: recruiter.industry || '',
        profileImage: recruiter.profileImage || ''
      };
    }
  });
  
  async function handleSave() {
    try {
      saving = true;
      error = '';
      success = '';
      
      const response = await apiService.updateRecruiterProfile(profile);
      if (response.success) {
        success = 'Profile updated successfully!';
        // Update the auth store with new profile data
        authStore.updateUser({ ...authStore.user, ...response.recruiter });
      } else {
        error = response.message || 'Failed to update profile';
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      error = 'Failed to update profile';
    } finally {
      saving = false;
    }
  }
  
  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiService.uploadProfileImage(formData);
      if (response.success) {
        profile.profileImage = response.imageUrl;
        success = 'Profile image uploaded successfully!';
      } else {
        error = response.message || 'Failed to upload image';
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      error = 'Failed to upload image';
    }
  }
</script>

<div class="space-y-8">
  <!-- Header -->
  <div>
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
      Account Settings
    </h1>
    <p class="mt-2 text-gray-600 dark:text-gray-400">
      Manage your recruiter profile and account preferences
    </p>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  {#if success}
    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
      {success}
    </div>
  {/if}

  <!-- Profile Settings -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">Update your public profile information</p>
    </div>
    
    <form onsubmit|preventDefault={handleSave} class="p-6 space-y-6">
      <!-- Profile Image -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profile Image
        </label>
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            {#if profile.profileImage}
              <img
                src={profile.profileImage}
                alt="Profile"
                class="w-16 h-16 rounded-full object-cover"
              />
            {:else}
              <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            {/if}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onchange={handleImageUpload}
              class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      <!-- Company -->
      <div>
        <Input
          label="Company"
          bind:value={profile.company}
          placeholder="Enter your company name"
          required
        />
      </div>

      <!-- Position -->
      <div>
        <Input
          label="Position"
          bind:value={profile.position}
          placeholder="e.g., Senior Recruiter, Talent Acquisition Manager"
          required
        />
      </div>

      <!-- Industry -->
      <div>
        <label for="industry" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Industry
        </label>
        <select
          id="industry"
          bind:value={profile.industry}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select an industry</option>
          <option value="Technology">Technology</option>
          <option value="Finance">Finance</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Education">Education</option>
          <option value="Marketing">Marketing</option>
          <option value="Consulting">Consulting</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Retail">Retail</option>
          <option value="Media">Media</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <!-- Bio -->
      <div>
        <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          bind:value={profile.bio}
          rows="4"
          placeholder="Tell candidates about yourself and your company..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        ></textarea>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This will be visible to candidates when you contact them.
        </p>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  </div>

  <!-- Account Information -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">Your account details and authentication</p>
    </div>
    
    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Username</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">{$authStore.user?.username || 'Not set'}</p>
        </div>
      </div>
      
      <div class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Wallet Address</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {$authStore.user?.walletAddress || 'Not connected'}
          </p>
        </div>
      </div>
      
      <div class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Account Type</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">{$authStore.user?.role || 'Unknown'}</p>
        </div>
      </div>
      
      <div class="flex items-center justify-between py-3">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Member Since</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {$authStore.user?.createdAt ? new Date($authStore.user.createdAt).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Preferences -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">Customize your platform experience</p>
    </div>
    
    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">Receive notifications about new candidates and applications</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer" checked>
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Auto-generate Shortlists</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">Automatically create candidate shortlists when posting jobs</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer" checked>
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  </div>
</div>