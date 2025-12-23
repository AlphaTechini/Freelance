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
    // Candidate-specific fields
    githubUrl: '',
    portfolioUrl: '',
    university: '',
    major: '',
    educationLevel: '',
    yearsOfExperience: 0,
    availability: '',
    isPublished: false,
    preferences: {
      preferredTokens: [],
      notifications: true,
      emailNotifications: true
    }
  });
  
  // Education level options
  const educationLevels = [
    { value: 'student', label: 'Student' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'phd', label: 'PhD Candidate' }
  ];
  
  // Availability options
  const availabilityOptions = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: '6 Months', label: '6 Months' },
    { value: '3 Months', label: '3 Months' }
  ];
  
  // Suggested skills for quick add
  const suggestedSkills = ['Python', 'React', 'Java', 'C++', 'Go', 'Rust', 'SQL', 'Kubernetes'];
  
  // Check if user is a candidate (not recruiter)
  let isCandidate = $derived($authStore.user?.role !== 'recruiter');
  
  let newSkill = $state('');
  let imageFile = $state(null);
  let imagePreview = $state('');
  
  const availableTokens = ['USDT', 'ETH', 'BTC'];
  
  onMount(async () => {
    if ($authStore.loading) {
      const unsubscribe = authStore.subscribe(store => {
        if (!store.loading) {
          unsubscribe();
          checkAuthAndLoad();
        }
      });
    } else {
      await checkAuthAndLoad();
    }
  });
  
  async function checkAuthAndLoad() {
    if (!$authStore.user && !$authStore.isWalletConnected) {
      goto('/auth/login');
      return;
    }
    await loadProfile();
  }

  async function loadProfile() {
    try {
      loading = true;
      error = '';
      
      console.log('Loading profile...');
      const userResponse = await apiService.getProfile();
      console.log('User response:', userResponse);
      
      if (userResponse.success && userResponse.user) {
        const user = userResponse.user;
        
        // Initialize profile with user data
        profile = {
          displayName: user.displayName || '',
          bio: user.bio || '',
          skills: user.skills || [],
          profileImage: user.profileImage || '',
          // Candidate fields
          githubUrl: '',
          portfolioUrl: '',
          university: '',
          major: '',
          educationLevel: '',
          yearsOfExperience: 0,
          availability: '',
          isPublished: false,
          // Recruiter fields
          company: '',
          position: '',
          industry: '',
          preferences: {
            preferredTokens: user.preferences?.preferredTokens || [],
            notifications: user.preferences?.notifications ?? true,
            emailNotifications: user.preferences?.emailNotifications ?? true
          }
        };
        imagePreview = profile.profileImage;
        
        console.log('Initial profile from user data:', {
          displayName: profile.displayName,
          bio: profile.bio,
          skills: profile.skills,
          role: user.role
        });
        
        console.log('User role:', user.role);
        
        // Load role-specific profile
        try {
          if (user.role === 'recruiter') {
            console.log('Loading recruiter profile...');
            const recruiterResponse = await apiService.getRecruiterProfile();
            console.log('Recruiter response:', recruiterResponse);
            
            if (recruiterResponse.success && recruiterResponse.profile) {
              profile = {
                ...profile,
                company: recruiterResponse.profile.company || '',
                position: recruiterResponse.profile.position || '',
                industry: recruiterResponse.profile.industry || '',
                bio: recruiterResponse.profile.bio || profile.bio
              };
            }
          } else {
            console.log('Loading candidate profile...');
            const candidateResponse = await apiService.getCandidateProfile();
            console.log('Candidate response:', candidateResponse);
            
            if (candidateResponse.success && candidateResponse.profile) {
              const candidateProfile = candidateResponse.profile;
              console.log('Candidate profile data:', {
                bio: candidateProfile.bio,
                skills: candidateProfile.skills,
                major: candidateProfile.major,
                university: candidateProfile.university
              });
              
              profile = {
                ...profile,
                major: candidateProfile.major || '',
                fieldOfStudy: candidateProfile.fieldOfStudy || '',
                educationLevel: candidateProfile.educationLevel || '',
                university: candidateProfile.university || '',
                yearsOfExperience: candidateProfile.yearsOfExperience || 0,
                portfolioUrl: candidateProfile.portfolioUrl || '',
                githubUrl: candidateProfile.githubUrl || '',
                availability: candidateProfile.availability || '',
                workHistory: candidateProfile.workHistory || [],
                isPublished: candidateProfile.isPublished || false,
                // Only override bio and skills if candidate profile has them, otherwise keep user profile data
                bio: candidateProfile.bio || profile.bio,
                skills: (candidateProfile.skills && candidateProfile.skills.length > 0) ? candidateProfile.skills : profile.skills
              };
              
              console.log('Profile after merging candidate data:', {
                displayName: profile.displayName,
                bio: profile.bio,
                skills: profile.skills,
                major: profile.major,
                university: profile.university
              });
            } else {
              console.log('No candidate profile found or empty response');
            }
          }
        } catch (roleError) {
          console.log('No role-specific profile found or error loading:', roleError.message);
          // This is normal for new users - they may not have role-specific profiles yet
        }
        
        console.log('Final profile loaded:', profile);
      } else {
        throw new Error('Failed to load user profile');
      }
    } catch (err) {
      console.error('Profile loading error:', err);
      error = 'Failed to load profile: ' + err.message;
      
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        console.log('Authentication error, redirecting to login');
        localStorage.removeItem('auth_user');
        goto('/auth/login');
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
      const reader = new FileReader();
      reader.onload = (e) => { imagePreview = e.target?.result; };
      reader.readAsDataURL(file);
    }
  }
  
  async function uploadImage() {
    if (!imageFile) return profile.profileImage;
    try {
      uploadingImage = true;
      const response = await apiService.uploadFile('/users/upload-image', imageFile);
      if (response.success && response.imageUrl) return response.imageUrl;
      throw new Error('Failed to upload image');
    } catch (err) {
      throw new Error('Image upload failed: ' + err.message);
    } finally {
      uploadingImage = false;
    }
  }
  
  function addSkill(skillToAdd = null) {
    const skill = (skillToAdd || newSkill).trim();
    if (skill && !profile.skills.includes(skill)) {
      if (profile.skills.length >= 20) {
        error = 'Maximum 20 skills allowed';
        return;
      }
      profile.skills = [...profile.skills, skill];
      if (!skillToAdd) newSkill = '';
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
  
  function isValidUrl(string) {
    if (!string) return true;
    try { new URL(string); return true; } catch (_) { return false; }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    try {
      saving = true;
      error = '';
      success = '';
      
      console.log('Starting profile save...', { profile });
      
      // Validation
      if (!profile.displayName || profile.displayName.trim().length < 2) {
        error = 'Display name must be at least 2 characters';
        return;
      }
      
      // Recruiter-specific validation
      if (!isCandidate) {
        if (!profile.company || profile.company.trim().length < 2) {
          error = 'Company name is required';
          return;
        }
        if (!profile.position || profile.position.trim().length < 2) {
          error = 'Your role in company is required';
          return;
        }
      }
      
      if (profile.bio && profile.bio.length > 500) {
        error = 'Bio must not exceed 500 characters';
        return;
      }
      
      // Validate URLs (only for candidates)
      if (isCandidate) {
        if (profile.githubUrl && !isValidUrl(profile.githubUrl)) {
          error = 'Please enter a valid GitHub URL';
          return;
        }
        if (profile.portfolioUrl && !isValidUrl(profile.portfolioUrl)) {
          error = 'Please enter a valid Portfolio URL';
          return;
        }
      }
      
      // Upload image if needed
      let imageUrl = profile.profileImage;
      if (imageFile) {
        console.log('Uploading image...');
        imageUrl = await uploadImage();
        console.log('Image uploaded:', imageUrl);
      }
      
      // Update basic profile first
      const updateData = {
        displayName: profile.displayName.trim(),
        bio: profile.bio?.trim() || '',
        skills: profile.skills || [],
        profileImage: imageUrl || '',
        preferences: profile.preferences || {
          preferredTokens: [],
          notifications: true,
          emailNotifications: true
        }
      };
      
      console.log('Updating basic profile...', updateData);
      const basicProfileResponse = await apiService.put('/users/profile', updateData);
      console.log('Basic profile updated:', basicProfileResponse);
      
      // Update candidate-specific profile if not recruiter
      if (isCandidate) {
        const candidateData = {
          bio: profile.bio?.trim() || '',
          skills: profile.skills || [],
          major: profile.major || '',
          university: profile.university || '',
          educationLevel: profile.educationLevel || '',
          yearsOfExperience: parseInt(profile.yearsOfExperience) || 0,
          portfolioUrl: profile.portfolioUrl || '',
          githubUrl: profile.githubUrl || '',
          availability: profile.availability || '',
          isPublished: profile.isPublished || false
        };
        
        console.log('Updating candidate profile...', candidateData);
        
        try {
          const candidateResponse = await apiService.put('/users/candidate-profile', candidateData);
          console.log('Candidate profile updated:', candidateResponse);
        } catch (err) {
          console.log('Candidate profile update failed, trying to create...', err.message);
          // If profile doesn't exist, create it
          if (err.message?.includes('not found') || err.message?.includes('404') || err.message?.includes('PROFILE_NOT_FOUND')) {
            // When creating, we need to include required fields
            const createData = {
              ...candidateData,
              // Ensure we have the required fields from the user data
              bio: candidateData.bio || updateData.bio || '',
              skills: candidateData.skills.length > 0 ? candidateData.skills : updateData.skills || []
            };
            const createResponse = await apiService.post('/users/candidate-profile', createData);
            console.log('Candidate profile created:', createResponse);
          } else {
            throw err;
          }
        }
      } else {
        // Update recruiter-specific profile
        const recruiterData = {
          company: profile.company?.trim() || '',
          position: profile.position?.trim() || '',
          industry: profile.industry?.trim() || '',
          bio: profile.bio?.trim() || ''
        };
        
        console.log('Updating recruiter profile...', recruiterData);
        
        try {
          const recruiterResponse = await apiService.put('/users/recruiter-profile', recruiterData);
          console.log('Recruiter profile updated:', recruiterResponse);
        } catch (err) {
          console.log('Recruiter profile update failed, trying to create...', err.message);
          // If profile doesn't exist, create it
          if (err.message?.includes('not found') || err.message?.includes('404') || err.message?.includes('PROFILE_NOT_FOUND')) {
            const createResponse = await apiService.post('/users/recruiter-profile', recruiterData);
            console.log('Recruiter profile created:', createResponse);
          } else {
            throw err;
          }
        }
      }
      
      success = 'Profile updated successfully!';
      console.log('Profile save completed successfully');
      
      // Redirect after a short delay
      setTimeout(() => {
        goto('/dashboard');
      }, 1500);
      
    } catch (err) {
      console.error('Profile save failed:', err);
      error = 'Failed to update profile: ' + err.message;
    } finally {
      saving = false;
    }
  }
  
  function handleCancel() {
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>Edit Profile - MeritStack</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <button onclick={handleCancel} class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2 flex items-center gap-1 text-sm">
          ← Back
        </button>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="space-y-6">
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

        <!-- Debug info (remove in production) -->
        {#if saving}
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg">
            <div class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Saving profile... Please wait.
            </div>
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
                <div class="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              {/if}
              {#if uploadingImage}
                <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              {/if}
            </div>
            <div class="flex-1">
              <input type="file" accept="image/*" onchange={handleImageSelect} class="hidden" id="profile-image-input" />
              <label for="profile-image-input">
                <Button type="button" variant="secondary" size="sm" onclick={() => document.getElementById('profile-image-input').click()}>
                  Choose Image
                </Button>
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>
        </div>

        <!-- Basic Information -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>
          <div class="space-y-4">
            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
              <Input id="displayName" type="text" bind:value={profile.displayName} placeholder="Enter your full name" required minlength={2} maxlength={50} />
            </div>
            
            {#if !isCandidate}
              <!-- Recruiter-specific fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="company" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name *</label>
                  <Input id="company" type="text" bind:value={profile.company} placeholder="Your company name" required />
                </div>
                <div>
                  <label for="position" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Role in Company *</label>
                  <Input id="position" type="text" bind:value={profile.position} placeholder="HR Manager, CTO, Founder, etc." required />
                </div>
              </div>
              
              <div>
                <label for="industry" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Industry</label>
                <Input id="industry" type="text" bind:value={profile.industry} placeholder="Technology, Finance, Healthcare, etc." />
              </div>
            {:else}
              <!-- Candidate-specific fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="university" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">University</label>
                  <Input id="university" type="text" bind:value={profile.university} placeholder="Your university" />
                </div>
                <div>
                  <label for="major" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Program / Major</label>
                  <Input id="major" type="text" bind:value={profile.major} placeholder="Computer Science, Engineering, etc." />
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="educationLevel" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Education Level</label>
                  <select id="educationLevel" bind:value={profile.educationLevel} class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">Select level</option>
                    {#each educationLevels as level}
                      <option value={level.value}>{level.label}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label for="yearsOfExperience" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Years of Experience</label>
                  <Input id="yearsOfExperience" type="number" bind:value={profile.yearsOfExperience} min="0" max="50" placeholder="0" />
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- GitHub & Portfolio URLs (Candidate only) -->
        {#if isCandidate}
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Links</h2>
            <div class="space-y-4">
              <div>
                <label for="githubUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
                    </svg>
                    GitHub Profile
                  </span>
                </label>
                <Input id="githubUrl" type="url" bind:value={profile.githubUrl} placeholder="https://github.com/yourusername" />
              </div>
              
              <div>
                <label for="portfolioUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" />
                      <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" />
                    </svg>
                    Portfolio Website
                  </span>
                </label>
                <Input id="portfolioUrl" type="url" bind:value={profile.portfolioUrl} placeholder="https://yourportfolio.com" />
              </div>
            </div>
          </div>
        {/if}

        <!-- Skills & Technologies (Both recruiters and candidates can have skills) -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {#if isCandidate}Skills & Technologies{:else}Skills & Expertise{/if}
          </h2>
          <div class="space-y-4">
            {#if profile.skills.length > 0}
              <div class="flex flex-wrap gap-2">
                {#each profile.skills as skill}
                  <span class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                    {skill}
                    <button type="button" onclick={() => removeSkill(skill)} class="hover:text-purple-600 dark:hover:text-purple-400 ml-1">×</button>
                  </span>
                {/each}
              </div>
            {/if}
            
            <div class="flex gap-2">
              <div class="flex-1">
                <Input type="text" bind:value={newSkill} placeholder="Add a skill..." maxlength={30} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
              </div>
              <Button type="button" variant="secondary" onclick={() => addSkill()}>
                <span class="flex items-center gap-1">+ Add</span>
              </Button>
            </div>
            
            <!-- Suggested skills -->
            <div class="flex flex-wrap gap-2">
              {#each suggestedSkills.filter(s => !profile.skills.includes(s)) as skill}
                <button type="button" onclick={() => addSkill(skill)} class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">
                  + {skill}
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Bio / Experience Summary -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {#if isCandidate}Bio / Experience Summary{:else}Company / Role Description{/if}
          </h2>
          <textarea
            id="bio"
            bind:value={profile.bio}
            placeholder={isCandidate ? "Tell us about yourself, your experience, and what you're looking for..." : "Describe your company, your role, and what kind of talent you're looking for..."}
            maxlength={500}
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          ></textarea>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{profile.bio?.length || 0}/500 characters</p>
        </div>

        <!-- Availability (Candidate only) -->
        {#if isCandidate}
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Availability</h2>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              {#each availabilityOptions as option}
                <button
                  type="button"
                  onclick={() => profile.availability = option.value}
                  class="px-4 py-3 rounded-lg border-2 transition-all text-center {
                    profile.availability === option.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700 text-gray-700 dark:text-gray-300'
                  }"
                >
                  {option.label}
                </button>
              {/each}
            </div>
          </div>

          <!-- Profile Visibility -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Profile Visibility</h2>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={profile.isPublished} class="w-5 h-5 text-purple-500 border-gray-300 rounded focus:ring-purple-500" />
              <div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Make my profile visible to recruiters</span>
                <p class="text-xs text-gray-500 dark:text-gray-400">When enabled, recruiters can find and contact you for opportunities</p>
              </div>
            </label>
          </div>
        {/if}

        <!-- Preferences -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Preferences</h2>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preferred Payment Tokens</label>
              <div class="flex gap-3">
                {#each availableTokens as token}
                  <button type="button" onclick={() => toggleToken(token)} class="px-4 py-2 rounded-lg border-2 transition-colors {profile.preferences.preferredTokens.includes(token) ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}">
                    {token}
                  </button>
                {/each}
              </div>
            </div>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" bind:checked={profile.preferences.notifications} class="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Enable in-app notifications</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" bind:checked={profile.preferences.emailNotifications} class="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Enable email notifications</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 justify-between">
          <Button type="button" variant="ghost" onclick={handleCancel}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || uploadingImage}>
            {saving ? 'Saving...' : 'Continue →'}
          </Button>
        </div>
      </form>
    {/if}
  </div>
</div>
