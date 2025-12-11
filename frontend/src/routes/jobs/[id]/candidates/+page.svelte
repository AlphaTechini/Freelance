<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import ShortlistView from '$lib/components/ShortlistView.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { authStore } from '$lib/stores/auth.js';
  import { api } from '$lib/services/api.js';

  // Get job ID from URL params
  const jobId = $page.params.id;

  // State
  let jobPosting = $state({});
  let candidates = $state([]);
  let loading = $state(true);
  let error = $state('');
  let generating = $state(false);

  // Load job posting and candidates on mount
  onMount(async () => {
    await loadJobPosting();
    await loadCandidates();
  });

  // Load job posting details
  const loadJobPosting = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      if (response.success) {
        jobPosting = response.data;
      } else {
        error = response.message || 'Failed to load job posting';
      }
    } catch (err) {
      console.error('Error loading job posting:', err);
      error = 'Failed to load job posting';
    }
  };

  // Load candidates for this job
  const loadCandidates = async () => {
    try {
      loading = true;
      const response = await api.get(`/jobs/${jobId}/candidates`);
      if (response.success) {
        candidates = response.data || [];
      } else {
        error = response.message || 'Failed to load candidates';
      }
    } catch (err) {
      console.error('Error loading candidates:', err);
      error = 'Failed to load candidates';
    } finally {
      loading = false;
    }
  };

  // Generate new shortlist
  const handleRegenerateShortlist = async () => {
    try {
      generating = true;
      const response = await api.post(`/jobs/${jobId}/generate-shortlist`);
      if (response.success) {
        candidates = response.data || [];
      } else {
        error = response.message || 'Failed to generate shortlist';
      }
    } catch (err) {
      console.error('Error generating shortlist:', err);
      error = 'Failed to generate shortlist';
    } finally {
      generating = false;
    }
  };

  // Handle hiring a candidate
  const handleHireCandidate = async (candidate) => {
    try {
      const response = await api.post(`/jobs/${jobId}/hire`, {
        candidateId: candidate._id
      });
      
      if (response.success) {
        // Update candidate status locally
        const index = candidates.findIndex(c => c._id === candidate._id);
        if (index !== -1) {
          candidates[index] = { ...candidates[index], status: 'hired' };
        }
        
        // Show success message
        alert(`Successfully hired ${candidate.name}!`);
      } else {
        alert(response.message || 'Failed to hire candidate');
      }
    } catch (err) {
      console.error('Error hiring candidate:', err);
      alert('Failed to hire candidate');
    }
  };

  // Handle emailing a candidate
  const handleEmailCandidate = (candidate) => {
    // This is handled by the CandidateCard component
    console.log('Email sent to:', candidate.name);
  };

  // Handle viewing candidate profile
  const handleViewProfile = (candidate) => {
    // Navigate to candidate profile page
    goto(`/profile/${candidate._id}`);
  };

  // Go back to job details
  const goBackToJob = () => {
    goto(`/jobs/${jobId}`);
  };

  // Check if user is authenticated and is a recruiter
  $effect(() => {
    if (!$authStore.isAuthenticated) {
      goto('/auth/login');
      return;
    }
    
    if ($authStore.user?.role !== 'recruiter') {
      goto('/');
      return;
    }
  });
</script>

<svelte:head>
  <title>Candidates - {jobPosting.title || 'Job'} | Kiro Talent Engine</title>
  <meta name="description" content="View and manage candidates for your job posting on Kiro Talent Engine" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-4 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onclick={goBackToJob}
          class="flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Job
        </Button>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {jobPosting.title || 'Job Position'}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {jobPosting.description || 'Job description not available'}
        </p>
        
        <!-- Job Details -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {#if jobPosting.requiredSkills && jobPosting.requiredSkills.length > 0}
            <div>
              <span class="font-medium text-gray-900 dark:text-white">Required Skills:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                {#each jobPosting.requiredSkills.slice(0, 3) as skill}
                  <span class="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs rounded-md">
                    {skill}
                  </span>
                {/each}
                {#if jobPosting.requiredSkills.length > 3}
                  <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                    +{jobPosting.requiredSkills.length - 3} more
                  </span>
                {/if}
              </div>
            </div>
          {/if}
          
          {#if jobPosting.experienceLevel}
            <div>
              <span class="font-medium text-gray-900 dark:text-white">Experience:</span>
              <span class="text-gray-600 dark:text-gray-400 ml-2">{jobPosting.experienceLevel}</span>
            </div>
          {/if}
          
          {#if jobPosting.budget}
            <div>
              <span class="font-medium text-gray-900 dark:text-white">Budget:</span>
              <span class="text-gray-600 dark:text-gray-400 ml-2">${jobPosting.budget}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Error State -->
    {#if error}
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <span class="text-red-700 dark:text-red-300 font-medium">Error</span>
        </div>
        <p class="text-red-600 dark:text-red-400 mt-1">{error}</p>
        <div class="mt-3">
          <Button variant="secondary" size="sm" onclick={loadCandidates}>
            Try Again
          </Button>
        </div>
      </div>
    {/if}

    <!-- Shortlist View -->
    <ShortlistView 
      {candidates}
      {jobPosting}
      loading={loading || generating}
      onHireCandidate={handleHireCandidate}
      onEmailCandidate={handleEmailCandidate}
      onViewProfile={handleViewProfile}
      onRegenerateShortlist={handleRegenerateShortlist}
    />

    <!-- Additional Actions -->
    <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Need More Candidates?
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        If you're not satisfied with the current shortlist, you can regenerate it or modify your job posting requirements.
      </p>
      <div class="flex items-center gap-4">
        <Button 
          variant="primary" 
          onclick={handleRegenerateShortlist}
          loading={generating}
        >
          Generate New Shortlist
        </Button>
        <Button 
          variant="secondary" 
          onclick={() => goto(`/jobs/${jobId}/edit`)}
        >
          Edit Job Posting
        </Button>
      </div>
    </div>
  </div>
</div>