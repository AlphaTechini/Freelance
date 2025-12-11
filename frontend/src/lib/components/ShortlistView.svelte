<script>
  import CandidateCard from './CandidateCard.svelte';
  import MatchExplanation from './MatchExplanation.svelte';
  import Button from './ui/Button.svelte';
  import Input from './ui/Input.svelte';
  
  let {
    candidates = [],
    jobPosting = {},
    loading = false,
    onHireCandidate = () => {},
    onEmailCandidate = () => {},
    onViewProfile = () => {},
    onRegenerateShortlist = () => {}
  } = $props();

  // Filter and sort state
  let searchTerm = $state('');
  let sortBy = $state('matchScore'); // matchScore, name, experience
  let filterByEducation = $state('all');
  let filterByExperience = $state('all');
  let showMatchDetails = $state({});

  // Available filter options
  const educationOptions = [
    { value: 'all', label: 'All Education Levels' },
    { value: 'student', label: 'Students' },
    { value: 'graduate', label: 'Graduates' },
    { value: 'phd', label: 'PhD Candidates' }
  ];

  const experienceOptions = [
    { value: 'all', label: 'All Experience Levels' },
    { value: '0-2', label: '0-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '6-10', label: '6-10 years' },
    { value: '10+', label: '10+ years' }
  ];

  const sortOptions = [
    { value: 'matchScore', label: 'Match Score (High to Low)' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'experience', label: 'Experience (High to Low)' }
  ];

  // Computed filtered and sorted candidates
  const filteredCandidates = $derived(() => {
    let filtered = candidates.filter(candidate => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = candidate.name?.toLowerCase().includes(searchLower);
        const matchesSkills = candidate.skills?.some(skill => 
          skill.toLowerCase().includes(searchLower)
        );
        const matchesField = candidate.major?.toLowerCase().includes(searchLower) ||
                            candidate.fieldOfStudy?.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesSkills && !matchesField) {
          return false;
        }
      }

      // Education filter
      if (filterByEducation !== 'all') {
        if (candidate.educationLevel?.toLowerCase() !== filterByEducation) {
          return false;
        }
      }

      // Experience filter
      if (filterByExperience !== 'all') {
        const years = candidate.experienceYears || 0;
        switch (filterByExperience) {
          case '0-2':
            if (years > 2) return false;
            break;
          case '3-5':
            if (years < 3 || years > 5) return false;
            break;
          case '6-10':
            if (years < 6 || years > 10) return false;
            break;
          case '10+':
            if (years < 10) return false;
            break;
        }
      }

      return true;
    });

    // Sort candidates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'matchScore':
          return (b.matchScore || 0) - (a.matchScore || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'experience':
          return (b.experienceYears || 0) - (a.experienceYears || 0);
        default:
          return 0;
      }
    });

    return filtered;
  });

  // Toggle match details for a candidate
  const toggleMatchDetails = (candidateId) => {
    showMatchDetails[candidateId] = !showMatchDetails[candidateId];
  };

  // Handle hire candidate
  const handleHire = async (candidate) => {
    try {
      await onHireCandidate(candidate);
      // Update candidate status locally
      const index = candidates.findIndex(c => c._id === candidate._id);
      if (index !== -1) {
        candidates[index].status = 'hired';
      }
    } catch (error) {
      console.error('Failed to hire candidate:', error);
    }
  };

  // Handle email candidate
  const handleEmail = (candidate) => {
    onEmailCandidate(candidate);
  };

  // Handle view profile
  const handleViewProfile = (candidate) => {
    onViewProfile(candidate);
  };

  // Clear all filters
  const clearFilters = () => {
    searchTerm = '';
    filterByEducation = 'all';
    filterByExperience = 'all';
    sortBy = 'matchScore';
  };

  // Get statistics
  const stats = $derived(() => {
    const total = candidates.length;
    const filtered = filteredCandidates.length;
    const avgScore = candidates.length > 0 
      ? Math.round(candidates.reduce((sum, c) => sum + (c.matchScore || 0), 0) / candidates.length)
      : 0;
    const topScore = candidates.length > 0 
      ? Math.max(...candidates.map(c => c.matchScore || 0))
      : 0;

    return { total, filtered, avgScore, topScore };
  });
</script>

<div class="space-y-6">
  <!-- Header with Stats -->
  <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Candidate Shortlist
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          AI-ranked candidates for "{jobPosting.title || 'Job Position'}"
        </p>
      </div>
      
      <Button 
        variant="secondary" 
        onclick={onRegenerateShortlist}
        loading={loading}
      >
        Regenerate Shortlist
      </Button>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-orange-500">{stats.total}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Total Candidates</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-500">{stats.filtered}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Filtered Results</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-500">{stats.avgScore}%</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Avg Match Score</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-purple-500">{stats.topScore}%</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Top Match Score</div>
      </div>
    </div>
  </div>

  <!-- Filters and Search -->
  <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Filter & Sort
      </h3>
      <button 
        onclick={clearFilters}
        class="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
      >
        Clear All Filters
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Search -->
      <div>
        <Input
          bind:value={searchTerm}
          placeholder="Search by name, skills, or field..."
          class="w-full"
        />
      </div>

      <!-- Sort -->
      <div>
        <select 
          bind:value={sortBy}
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        >
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Education Filter -->
      <div>
        <select 
          bind:value={filterByEducation}
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        >
          {#each educationOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Experience Filter -->
      <div>
        <select 
          bind:value={filterByExperience}
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        >
          {#each experienceOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Candidates List -->
  <div class="space-y-4">
    {#if loading}
      <!-- Loading State -->
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Generating candidate shortlist...</p>
      </div>
    {:else if filteredCandidates.length === 0}
      <!-- Empty State -->
      <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No candidates found
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {candidates.length === 0 
            ? 'No candidates match the job requirements. Try adjusting the job posting or regenerating the shortlist.'
            : 'No candidates match your current filters. Try adjusting your search criteria.'
          }
        </p>
        {#if candidates.length === 0}
          <Button variant="primary" onclick={onRegenerateShortlist}>
            Generate Shortlist
          </Button>
        {:else}
          <Button variant="secondary" onclick={clearFilters}>
            Clear Filters
          </Button>
        {/if}
      </div>
    {:else}
      <!-- Candidates Grid -->
      {#each filteredCandidates as candidate, index (candidate._id)}
        <div class="space-y-4">
          <!-- Rank Badge -->
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
              #{index + 1}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Ranked by AI matching algorithm
            </div>
          </div>

          <!-- Candidate Card -->
          <CandidateCard 
            {candidate}
            onHire={handleHire}
            onEmail={handleEmail}
            onViewProfile={handleViewProfile}
          />

          <!-- Match Details Toggle -->
          <div class="flex justify-center">
            <button 
              onclick={() => toggleMatchDetails(candidate._id)}
              class="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors flex items-center gap-1"
            >
              {showMatchDetails[candidate._id] ? 'Hide' : 'Show'} Match Analysis
              <svg 
                class="w-4 h-4 transition-transform {showMatchDetails[candidate._id] ? 'rotate-180' : ''}" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>

          <!-- Match Explanation (Expandable) -->
          {#if showMatchDetails[candidate._id]}
            <MatchExplanation 
              {candidate}
              matchDetails={candidate.matchDetails || {}}
              isExpanded={true}
            />
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <!-- Bulk Actions (if multiple candidates selected) -->
  <!-- This could be added in a future enhancement -->
</div>