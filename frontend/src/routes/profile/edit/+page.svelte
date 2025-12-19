<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let success = $state('');
  let uploadingImage = $state(false);
  
  // Form data
  let profile = $state({
    displayName: '',
    bio: '',
    skills: [],
    profileImage: '',
    preferences: {
      preferredTokens: [],
      notifications: true,
      emailNotifications: true
    }
  });
  
  let newSkill = $state('');
  let imageFile = $state(null);
  let imagePreview = $state('');
  
  const availableTokens = ['USDT', 'ETH', 'BTC'];
  
  onMount(async () => {
    // Check if user is authenticated
    if (!$authStore.user && !$authStore.isWalletConnected) {
      goto('/auth/login');
      return;
    }
    
    // Wait a bit for token to be set if coming from registration
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiService.setToken(token);
    }
    
    await loadProfile();
  });
  
  async function loadProfile() {
    try {
      loading = true;
      error = '';
      
      // Double-check token is set
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found. Please sign in again.');
      }
      apiService.setToken(token);
      
      // Get user info first to determine role
      const userResponse = await apiService.getProfile();
      
      if (userResponse.success && userResponse.user) {
        const user = userResponse.user;
        
        // Load basic user profile
        profile = {
          displayName: user.displayName || '',
          bio: user.bio || '',
          skills: user.skills || [],
          profileImage: user.profileImage || '',
          preferences: {
            preferredTokens: user.preferences?.preferredTokens || [],
            notifications: user.preferences?.notifications ?? true,
            emailNotifications: user.preferences?.emailNotifications ?? true
          }
        };
        imagePreview = profile.profileImage;
        
        // Try to load role-specific profile
        try {
          if (user.role === 'recruiter') {
            const recruiterResponse = await apiService.getRecruiterProfile();
            if (recruiterResponse.success && recruiterResponse.profile) {
              // Merge recruiter-specific data
              profile = {
                ...profile,
                company: recruiterResponse.profile.company || '',
                position: recruiterResponse.profile.position || '',
                industry: recruiterResponse.profile.industry || '',
                bio: recruiterResponse.profile.bio || profile.bio
              };
            }
          } else {
            const candidateResponse = await apiService.getCandidateProfile();
            if (candidateResponse.success && candidateResponse.profile) {
              // Merge candidate-specific data
              profile = {
                ...profile,
                major: candidateResponse.profile.major || '',
                fieldOfStudy: candidateResponse.profile.fieldOfStudy || '',
                educationLevel: candidateResponse.profile.educationLevel || '',
                university: candidateResponse.profile.university || '',
                yearsOfExperience: candidateResponse.profile.yearsOfExperience || 0,
                portfolioUrl: candidateResponse.profile.portfolioUrl || '',
                githubUrl: candidateResponse.profile.githubUrl || '',
                availability: candidateResponse.profile.availability || '',
                workHistory: candidateResponse.profile.workHistory || [],
                isPublished: candidateResponse.profile.isPublished || false,
                bio: candidateResponse.profile.bio || profile.bio,
                skills: candidateResponse.profile.skills || profile.skills
              };
            }
          }
        } catch (roleError) {
          // Role-specific profile doesn't exist yet, that's okay
          console.log('No role-specific profile found:', roleError.message);
        }
      }
    } catch (err) {
      error = 'Failed to load profile: ' + err.message;
      
      // If unauthorized, redirect to login
      if (err.message?.includes('Unauthorized') || err.message?.includes('No Authorization') || err.message?.includes('No authentication token')) {
        console.error('Auth error, redirecting to login');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setTimeout(() => goto('/auth/login'), 1500);
      }
    } finally {
      loading = false;
    }
  }
  
  function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        error = 'Image size must be less than 5MB';
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        error = 'Please select an image file';
        return;
      }
      
      imageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview = e.target?.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  async function uploadImage() {
    if (!imageFile) return profile.profileImage;
    
    try {
      uploadingImage = true;
      const response = await apiService.uploadFile('/users/upload-image', imageFile);
      
      if (response.success && response.imageUrl) {
        return response.imageUrl;
      }
      
      throw new Error('Failed to upload image');
    } catch (err) {
      throw new Error('Image upload failed: ' + err.message);
    } finally {
      uploadingImage = false;
    }
  }
  
  function addSkill() {
    const skill = newSkill.trim();
    if (skill && !profile.skills.includes(skill)) {
      if (profile.skills.length >= 20) {
        error = 'Maximum 20 skills allowed';
        return;
      }
      profile.skills = [...profile.skills, skill];
      newSkill = '';
    }
  }
  
  function removeSkill(skillToRemove) {
    profile.skills = profile.skills.filter(s => s !== skillToRemove);
  }
  
  function toggleToken(token) {
    const tokens = profile.preferences.preferredTokens;
    if (tokens.includes(token)) {
      profile.preferences.preferredTokens = tokens.filter(t => t !== token);
    } else {
      profile.preferences.preferredTokens = [...tokens, token];
    }
  }
  
  async function handleSubmit(event) {
    event.preventDefault();
    
    try {
      saving = true;
      error = '';
      success = '';
      
      // Validate
      if (!profile.displayName || profile.displayName.trim().length < 2) {
        error = 'Display name must be at least 2 characters';
        return;
      }
      
      if (profile.bio.length > 500) {
        error = 'Bio must not exceed 500 characters';
        return;
      }
      
      // Upload image if selected
      let imageUrl = profile.profileImage;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      
      // Update profile
      const updateData = {
        displayName: profile.displayName.trim(),
        bio: profile.bio.trim(),
        skills: profile.skills,
        profileImage: imageUrl,
        preferences: profile.preferences
      };
      
      const response = await apiService.put('/users/profile', updateData);
      
      if (response.success) {
        success = 'Profile updated successfully!';
        setTimeout(() => {
          // Redirect to dashboard after saving profile
          goto('/dashboard');
        }, 1500);
      }
    } catch (err) {
      error = 'Failed to update profile: ' + err.message;
    } finally {
      saving = false;
    }
  }
  
  function handleCancel() {
    goto('/profile');
  }
</script>

<svelte:head>
  <title>Edit Profile - MeritStack</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
      <Button variant="ghost" size="sm" onclick={handleCancel}>Cancel</Button>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="space-y-6">
        <!-- Error/Success Messages -->
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

        <!-- Profile Image -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Profile Image</h2>
          
          <div class="flex items-center space-x-6">
            <div class="relative">
              {#if imagePreview}
                <img src={imagePreview} alt="Profile" class="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
              {:else}
                <div class="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span class="text-3xl text-gray-400">👤</span>
                </div>
              {/if}
              
              {#if uploadingImage}
                <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              {/if}
            </div>
            
            <div class="flex-1">
              <input
                type="file"
                accept="image/*"
                onchange={handleImageSelect}
                class="hidden"
                id="profile-image-input"
              />
              <label for="profile-image-input">
                <Button type="button" variant="secondary" size="sm" onclick={() => document.getElementById('profile-image-input').click()}>
                  Choose Image
                </Button>
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>
        </div>

        <!-- Basic Information -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>
          
          <div class="space-y-4">
            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name *
              </label>
              <Input
                id="displayName"
                type="text"
                bind:value={profile.displayName}
                placeholder="Enter your display name"
                required
                minlength={2}
                maxlength={50}
              />
            </div>
            
            <div>
              <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                bind:value={profile.bio}
                placeholder="Tell us about yourself..."
                maxlength={500}
                rows="4"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              ></textarea>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {profile.bio.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Skills</h2>
          
          <div class="space-y-4">
            <div class="flex gap-2">
              <Input
                type="text"
                bind:value={newSkill}
                placeholder="Add a skill"
                maxlength={30}
                onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" variant="secondary" onclick={addSkill}>Add</Button>
            </div>
            
            {#if profile.skills.length > 0}
              <div class="flex flex-wrap gap-2">
                {#each profile.skills as skill}
                  <span class="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-sm">
                    {skill}
                    <button
                      type="button"
                      onclick={() => removeSkill(skill)}
                      class="hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      ×
                    </button>
                  </span>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-gray-500 dark:text-gray-400">No skills added yet</p>
            {/if}
          </div>
        </div>

        <!-- Preferences -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Preferences</h2>
          
          <div class="space-y-6">
            <!-- Preferred Tokens -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Preferred Payment Tokens
              </label>
              <div class="flex gap-3">
                {#each availableTokens as token}
                  <button
                    type="button"
                    onclick={() => toggleToken(token)}
                    class="px-4 py-2 rounded-lg border-2 transition-colors {
                      profile.preferences.preferredTokens.includes(token)
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }"
                  >
                    {token}
                  </button>
                {/each}
              </div>
            </div>
            
            <!-- Notification Settings -->
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={profile.preferences.notifications}
                  class="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  Enable in-app notifications
                </span>
              </label>
              
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={profile.preferences.emailNotifications}
                  class="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  Enable email notifications
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 justify-end">
          <Button type="button" variant="ghost" onclick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving || uploadingImage}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    {/if}
  </div>
</div>
