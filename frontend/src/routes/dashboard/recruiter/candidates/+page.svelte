<script>
  import { onMount } from 'svelte';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  import PaymentModal from '$lib/components/PaymentModal.svelte';
  
  let candidates = $state([]);
  let loading = $state(true);
  let error = $state('');
  let showPaymentModal = $state(false);
  let selectedCandidate = $state(null);
  let filters = $state({
    skills: '',
    educationLevel: 'all',
    minExperience: '',
    availability: 'all',
    search: ''
  });
  
  onMount(async () => {
    await loadCandidates();
  });
  
  async function loadCandidates() {
    try {
      loading = true;
      error = '';
      
      // For now, we'll use the search endpoint to get candidates
      // In a real implementation, you'd have a dedicated candidates endpoint
      const response = await apiService.searchCandidates(filters);
      if (response.success) {
        candidates = response.candidates || [];
      } else {
        error = response.message || 'Failed to load candidates';
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
      error = 'Failed to load candidates';
    } finally {
      loading = false;
    }
  }
  
  async function handleFilterChange() {
    await loadCandidates();
  }
  
  function openPaymentModal(candidate) {
    selectedCandidate = candidate;
    showPaymentModal = true;
  }
  
  function closePaymentModal() {
    showPaymentModal = false;
    selectedCandidate = null;
  }
  
  async function handlePaymentSuccess() {
    closePaymentModal();
    // Optionally refresh data or show success message
  }
  
  function getEducationBadgeColor(level) {
    switch (level?.toLowerCase()) {
      case 'phd': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'graduate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'student': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  }
  
  function formatExperience(years) {
    if (years === 0) return 'Entry level';
    if (years === 1) return '1 year';
    return `${years} years`;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Browse Candidates
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Discover talented freelancers, students, and professionals
      </p>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  <!-- Filters -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search
        </label>
        <input
          id="search"
          type="text"
          bind:value={filters.search}
          placeholder="Name, skills, or bio..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div>
        <label for="skills" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Skills
        </label>
        <input
          id="skills"
          type="text"
          bind:value={filters.skills}
          placeholder="JavaScript, React, etc."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div>
        <label for="education" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Education
        </label>
        <select
          id="education"
          bind:value={filters.educationLevel}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Levels</option>
          <option value="student">Student</option>
          <option value="graduate">Graduate</option>
          <option value="phd">PhD</option>
        </select>
      </div>
      
      <div>
        <label for="experience" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Min Experience
        </label>
        <select
          id="experience"
          bind:value={filters.minExperience}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Any</option>
          <option value="0">Entry Level</option>
          <option value="1">1+ years</option>
          <option value="3">3+ years</option>
          <option value="5">5+ years</option>
        </select>
      </div>
      
      <div>
        <label for="availability" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Availability
        </label>
        <select
          id="availability"
          bind:value={filters.availability}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Freelance">Freelance</option>
        </select>
      </div>
    </div>
    
    <div class="mt-4 flex justify-end">
      <Button onclick={handleFilterChange} variant="primary">
        Apply Filters
      </Button>
    </div>
  </div>

  <!-- Candidates Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {#if loading}
      {#each Array(6) as _}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
          <div class="flex items-center space-x-4 mb-4">
            <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      {/each}
    {:else if candidates.length === 0}
      <div class="col-span-full text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No candidates found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your search filters to find more candidates.
        </p>
      </div>
    {:else}
      {#each candidates as candidate}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <!-- Candidate Header -->
          <div class="flex items-start space-x-4 mb-4">
            <div class="flex-shrink-0">
              {#if candidate.profileImage}
                <img
                  src={candidate.profileImage}
                  alt={candidate.name}
                  class="w-12 h-12 rounded-full object-cover"
                />
              {:else}
                <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              {/if}
            </div>
            
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                {candidate.name || 'Anonymous'}
              </h3>
              <div class="flex items-center space-x-2 mt-1">
                {#if candidate.major}
                  <span class="text-sm text-gray-600 dark:text-gray-400">{candidate.major}</span>
                {/if}
                {#if candidate.educationLevel}
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getEducationBadgeColor(candidate.educationLevel)}">
                    {candidate.educationLevel}
                  </span>
                {/if}
              </div>
            </div>
          </div>
          
          <!-- Candidate Info -->
          <div class="space-y-3 mb-4">
            {#if candidate.bio}
              <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {candidate.bio}
              </p>
            {/if}
            
            <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{formatExperience(candidate.yearsOfExperience || 0)}</span>
              {#if candidate.availability}
                <span>{candidate.availability}</span>
              {/if}
            </div>
            
            {#if candidate.skills && candidate.skills.length > 0}
              <div class="flex flex-wrap gap-1">
                {#each candidate.skills.slice(0, 4) as skill}
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    {skill}
                  </span>
                {/each}
                {#if candidate.skills.length > 4}
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                    +{candidate.skills.length - 4}
                  </span>
                {/if}
              </div>
            {/if}
          </div>
          
          <!-- Links -->
          <div class="flex items-center space-x-4 mb-4 text-sm">
            {#if candidate.portfolioUrl}
              <a
                href={candidate.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Portfolio
              </a>
            {/if}
            
            {#if candidate.githubUrl}
              <a
                href={candidate.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            {/if}
          </div>
          
          <!-- Actions -->
          <div class="flex space-x-2">
            <Button
              href="/profile/{candidate._id || candidate.username}"
              variant="outline"
              size="sm"
              class="flex-1"
            >
              View Profile
            </Button>
            
            <Button
              onclick={() => openPaymentModal(candidate)}
              variant="primary"
              size="sm"
              class="flex-1"
            >
              Send Payment
            </Button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<!-- Payment Modal -->
{#if showPaymentModal && selectedCandidate}
  <PaymentModal
    candidate={selectedCandidate}
    onClose={closePaymentModal}
    onSuccess={handlePaymentSuccess}
  />
{/if}