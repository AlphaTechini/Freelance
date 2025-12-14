<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import CandidateProfileForm from '$lib/components/CandidateProfileForm.svelte';
  import RecruiterProfileForm from '$lib/components/RecruiterProfileForm.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  let loading = $state(false);
  let error = $state('');
  let success = $state('');
  let userRole = $state('');
  let profileType = $state('');
  
  onMount(async () => {
    // Check if user is authenticated
    if (!$authStore.isAuthenticated) {
      goto('/auth/login');
      return;
    }
    
    // Get profile type from URL params or user role
    const urlProfileType = $page.url.searchParams.get('type');
    const user = $authStore.user;
    
    if (urlProfileType) {
      profileType = urlProfileType;
    } else if (user?.role) {
      // Determine profile type based on user role
      if (user.role === 'recruiter') {
        profileType = 'recruiter';
      } else {
        profileType = 'candidate';
      }
    }
    
    userRole = user?.role || '';
    
    // Check if user already has a profile
    await checkExistingProfile();
  });
  
  async function checkExistingProfile() {
    try {
      const endpoint = profileType === 'recruiter' 
        ? '/users/recruiter-profile' 
        : '/users/candidate-profile';
      
      const response = await apiService.get(endpoint);
      
      if (response.success && response.profile) {
        // User already has a profile, redirect to edit page
        goto('/profile/edit');
        return;
      }
    } catch (err) {
      // Profile doesn't exist, which is expected for new users
      console.log('No existing profile found, proceeding with creation');
    }
  }
  
  async function handleCandidateSubmit(event) {
    const formData = event.detail;
    
    try {
      loading = true;
      error = '';
      success = '';
      
      const response = await apiService.createCandidateProfile(formData);
      
      if (response.success) {
        success = 'Candidate profile created successfully!';
        setTimeout(() => {
          goto('/profile');
        }, 1500);
      }
    } catch (err) {
      error = err.message || 'Failed to create candidate profile';
    } finally {
      loading = false;
    }
  }
  
  async function handleRecruiterSubmit(event) {
    const formData = event.detail;
    
    try {
      loading = true;
      error = '';
      success = '';
      
      const response = await apiService.createRecruiterProfile(formData);
      
      if (response.success) {
        success = 'Recruiter profile created successfully!';
        setTimeout(() => {
          goto('/profile');
        }, 1500);
      }
    } catch (err) {
      error = err.message || 'Failed to create recruiter profile';
    } finally {
      loading = false;
    }
  }
  
  function handleFormError(event) {
    error = event.detail;
  }
  
  function handleCancel() {
    goto('/profile');
  }
</script>

<svelte:head>
  <title>Create Profile - MeritStack</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Create Your {profileType === 'recruiter' ? 'Recruiter' : 'Candidate'} Profile
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {#if profileType === 'recruiter'}
          Set up your company profile to start finding and hiring talent
        {:else}
          Complete your profile to be discovered by recruiters and showcase your skills
        {/if}
      </p>
    </div>

    <!-- Success Message -->
    {#if success}
      <div class="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg text-center">
        {success}
      </div>
    {/if}

    <!-- Profile Creation Form -->
    {#if profileType === 'recruiter'}
      <RecruiterProfileForm
        {loading}
        {error}
        onsubmit={handleRecruiterSubmit}
        onerror={handleFormError}
      />
    {:else if profileType === 'candidate'}
      <CandidateProfileForm
        {loading}
        {error}
        onsubmit={handleCandidateSubmit}
        onerror={handleFormError}
      />
    {:else}
      <!-- Role Selection if not determined -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          What type of profile would you like to create?
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button
            onclick={() => profileType = 'candidate'}
            class="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
          >
            <div class="text-4xl mb-3">👨‍💻</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Candidate Profile
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Showcase your skills, experience, and portfolio to be discovered by recruiters
            </p>
          </button>
          
          <button
            onclick={() => profileType = 'recruiter'}
            class="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
          >
            <div class="text-4xl mb-3">🏢</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Recruiter Profile
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Set up your company profile to find and hire talented candidates
            </p>
          </button>
        </div>
      </div>
    {/if}

    <!-- Cancel Button -->
    {#if profileType}
      <div class="mt-8 text-center">
        <Button variant="ghost" onclick={handleCancel}>
          Cancel
        </Button>
      </div>
    {/if}
  </div>
</div>