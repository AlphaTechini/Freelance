<script>
  import { goto } from '$app/navigation';
  import Button from './ui/Button.svelte';
  
  // Props using Svelte 5 syntax
  let { 
    candidate = {}, 
    user = {}, 
    loading = false,
    onreanalyze = () => {},
    oneditprofile = () => {},
    onviewearnings = () => {},
    onviewpayments = () => {}
  } = $props();
  
  // Computed values
  let displayName = $derived(user?.displayName || 'Unknown User');
  let profileImage = $derived(user?.profileImage || '');
  
  function getEducationBadge(level) {
    const badges = {
      'student': { text: 'Undergraduate', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
      'graduate': { text: 'Graduate', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
      'phd': { text: 'PhD', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
      'freelancer': { text: 'Freelancer', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' }
    };
    return badges[level] || { text: 'Student', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
  }
  
  let educationBadge = $derived(getEducationBadge(candidate?.educationLevel || user?.role));
  
  function handleReanalyze() { onreanalyze(); }
  function handleEditProfile() { goto('/profile/edit'); }
  function handleViewEarnings() { goto('/dashboard/candidate/earnings'); }
  function handleViewPayments() { goto('/dashboard/candidate/payments'); }
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
      </p>
    {/if}
    
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {educationBadge.color}">
      {educationBadge.text}
    </span>
  </div>

  <!-- University -->
  {#if candidate?.university}
    <div class="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
      {candidate.university}
    </div>
  {/if}

  <!-- Links Section -->
  <div class="mb-6 space-y-3">
    {#if candidate?.githubUrl}
      <a 
        href={candidate.githubUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
        </svg>
        {candidate.githubUrl.replace('https://github.com/', '')}
      </a>
    {/if}
    
    {#if candidate?.portfolioUrl}
      <a 
        href={candidate.portfolioUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" />
          <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" />
        </svg>
        {candidate.portfolioUrl.replace(/https?:\/\//, '').substring(0, 30)}...
      </a>
    {/if}
  </div>

  <!-- Availability -->
  {#if candidate?.availability}
    <div class="mb-4 flex items-center gap-2 text-sm">
      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-gray-600 dark:text-gray-400">Available:</span>
      <span class="text-purple-600 dark:text-purple-400 font-medium">{candidate.availability}</span>
    </div>
  {/if}

  <!-- Years of Experience -->
  {#if candidate?.yearsOfExperience !== undefined}
    <div class="mb-4 flex items-center gap-2 text-sm">
      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span class="text-gray-600 dark:text-gray-400">Experience:</span>
      <span class="text-gray-900 dark:text-white font-medium">{candidate.yearsOfExperience} {candidate.yearsOfExperience === 1 ? 'year' : 'years'}</span>
    </div>
  {/if}

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
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bio</h3>
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
          <div class="border-l-2 border-purple-300 dark:border-purple-600 pl-3">
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
  <div class="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
    <Button 
      variant="secondary" 
      size="sm" 
      onclick={handleEditProfile}
      class="w-full"
    >
      ✏️ Edit Profile
    </Button>
    
    <div class="grid grid-cols-2 gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onclick={handleViewEarnings}
        class="text-xs"
      >
        💰 Earnings
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onclick={handleViewPayments}
        class="text-xs"
      >
        📜 History
      </Button>
    </div>
  </div>
</div>
