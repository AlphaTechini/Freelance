<script>
  import { createEventDispatcher } from 'svelte';
  import Button from './ui/Button.svelte';
  
  const dispatch = createEventDispatcher();
  
  // Props
  export let candidate = {};
  export let user = {};
  export let loading = false;
  
  // Computed values
  $: displayName = user?.displayName || 'Unknown User';
  $: profileImage = user?.profileImage || '';
  $: educationBadge = getEducationBadge(candidate?.educationLevel);
  $: availabilityColor = getAvailabilityColor(candidate?.availability);
  
  function getEducationBadge(level) {
    const badges = {
      'student': { text: 'Student', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
      'graduate': { text: 'Graduate', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
      'phd': { text: 'PhD', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' }
    };
    return badges[level] || { text: 'Student', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200' };
  }
  
  function getAvailabilityColor(availability) {
    const colors = {
      'Full-time': 'text-green-600 dark:text-green-400',
      'Part-time': 'text-blue-600 dark:text-blue-400',
      'Contract': 'text-orange-600 dark:text-orange-400',
      'Months': 'text-purple-600 dark:text-purple-400'
    };
    return colors[availability] || 'text-gray-600 dark:text-gray-400';
  }
  
  function handleReanalyze() {
    dispatch('reanalyze');
  }
  
  function handleEditProfile() {
    dispatch('editProfile');
  }
  
  function handleViewEarnings() {
    dispatch('viewEarnings');
  }
  
  function handleViewPayments() {
    dispatch('viewPayments');
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
  <!-- Profile Header -->
  <div class="text-center mb-6">
    <div class="relative inline-block mb-4">
      {#if profileImage}
        <img 
          src={profileImage} 
          alt={displayName}
          class="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
        />
      {:else}
        <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {displayName.charAt(0).toUpperCase()}
        </div>
      {/if}
    </div>
    
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
      {displayName}
    </h2>
    
    {#if candidate?.major}
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {candidate.major}
        {#if candidate.fieldOfStudy}
          • {candidate.fieldOfStudy}
        {/if}
      </p>
    {/if}
    
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {educationBadge.color}">
      {educationBadge.text}
    </span>
  </div>

  <!-- Education & Institution -->
  {#if candidate?.university}
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Education</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">{candidate.university}</p>
    </div>
  {/if}

  <!-- Links -->
  <div class="mb-6 space-y-3">
    {#if candidate?.portfolioUrl}
      <a 
        href={candidate.portfolioUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        class="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" />
          <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" />
        </svg>
        Portfolio
      </a>
    {/if}
    
    {#if candidate?.githubUrl}
      <a 
        href={candidate.githubUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
        </svg>
        GitHub
      </a>
    {/if}
  </div>

  <!-- Availability & Experience -->
  <div class="mb-6 space-y-3">
    {#if candidate?.availability}
      <div>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Availability</h3>
        <p class="text-sm {availabilityColor} font-medium">{candidate.availability}</p>
      </div>
    {/if}
    
    {#if candidate?.yearsOfExperience !== undefined}
      <div>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Experience</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {candidate.yearsOfExperience} {candidate.yearsOfExperience === 1 ? 'year' : 'years'}
        </p>
      </div>
    {/if}
  </div>

  <!-- Skills -->
  {#if candidate?.skills && candidate.skills.length > 0}
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Skills</h3>
      <div class="flex flex-wrap gap-1">
        {#each candidate.skills.slice(0, 8) as skill}
          <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {skill}
          </span>
        {/each}
        {#if candidate.skills.length > 8}
          <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            +{candidate.skills.length - 8} more
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Bio -->
  {#if candidate?.bio}
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">About</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {candidate.bio.length > 150 ? candidate.bio.substring(0, 150) + '...' : candidate.bio}
      </p>
    </div>
  {/if}

  <!-- Work History -->
  {#if candidate?.workHistory && candidate.workHistory.length > 0}
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Work History</h3>
      <div class="space-y-3">
        {#each candidate.workHistory.slice(0, 3) as work}
          <div class="border-l-2 border-gray-200 dark:border-gray-600 pl-3">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white">{work.position}</h4>
            <p class="text-xs text-gray-600 dark:text-gray-400">{work.company}</p>
            <p class="text-xs text-gray-500 dark:text-gray-500">{work.duration}</p>
          </div>
        {/each}
        {#if candidate.workHistory.length > 3}
          <p class="text-xs text-gray-500 dark:text-gray-500">
            +{candidate.workHistory.length - 3} more positions
          </p>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="space-y-2">
    <Button 
      variant="primary" 
      size="sm" 
      onclick={handleReanalyze}
      disabled={loading}
      class="w-full"
    >
      {loading ? 'Analyzing...' : 'Re-analyze Portfolio'}
    </Button>
    
    <Button 
      variant="secondary" 
      size="sm" 
      onclick={handleEditProfile}
      class="w-full"
    >
      Edit Profile
    </Button>
    
    <div class="grid grid-cols-2 gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onclick={handleViewEarnings}
        class="text-xs"
      >
        Earnings
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onclick={handleViewPayments}
        class="text-xs"
      >
        Payments
      </Button>
    </div>
  </div>
</div>