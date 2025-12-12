<script>
  import { onMount } from 'svelte';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  
  let jobs = $state([]);
  let loading = $state(true);
  let error = $state('');
  let filters = $state({
    status: 'all',
    search: ''
  });
  
  onMount(async () => {
    await loadJobs();
  });
  
  async function loadJobs() {
    try {
      loading = true;
      error = '';
      
      const queryFilters = {};
      if (filters.status !== 'all') {
        queryFilters.status = filters.status;
      }
      
      const response = await apiService.getJobs(queryFilters);
      if (response.success) {
        jobs = response.jobs || [];
      } else {
        error = response.message || 'Failed to load jobs';
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      error = 'Failed to load jobs';
    } finally {
      loading = false;
    }
  }
  
  async function handleFilterChange() {
    await loadJobs();
  }
  
  function getStatusColor(status) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'filled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function formatBudget(budget) {
    if (!budget) return 'Not specified';
    if (budget.min && budget.max) {
      return `${budget.min}-${budget.max} ${budget.currency}`;
    }
    if (budget.max) {
      return `Up to ${budget.max} ${budget.currency}`;
    }
    return 'Not specified';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Job Postings
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Manage all your job postings and track their performance
      </p>
    </div>
    <div class="mt-4 sm:mt-0">
      <Button href="/dashboard/recruiter/jobs/create" variant="primary">
        Create New Job
      </Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  <!-- Filters -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
      <div class="flex-1">
        <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Jobs
        </label>
        <input
          id="search"
          type="text"
          bind:value={filters.search}
          placeholder="Search by title, skills, or description..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          id="status"
          bind:value={filters.status}
          onchange={handleFilterChange}
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="filled">Filled</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Jobs List -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    {#if loading}
      <div class="p-6">
        <div class="space-y-4">
          {#each Array(5) as _}
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          {/each}
        </div>
      </div>
    {:else if jobs.length === 0}
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No job postings found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {filters.status !== 'all' ? 'No jobs match the selected filters.' : 'Get started by creating your first job posting.'}
        </p>
        <div class="mt-6">
          <Button href="/dashboard/recruiter/jobs/create" variant="primary">
            Create Job Posting
          </Button>
        </div>
      </div>
    {:else}
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each jobs as job}
          <div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    <a href="/jobs/{job._id}" class="hover:text-blue-600 dark:hover:text-blue-400">
                      {job.title}
                    </a>
                  </h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(job.status)}">
                    {job.status}
                  </span>
                </div>
                
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {job.description}
                </p>
                
                <div class="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                    </svg>
                    {job.roleType}
                  </div>
                  
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {job.shortlist?.length || 0} candidates
                  </div>
                  
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {formatBudget(job.budget)}
                  </div>
                  
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9" />
                    </svg>
                    Created {formatDate(job.createdAt)}
                  </div>
                </div>
                
                {#if job.requiredSkills && job.requiredSkills.length > 0}
                  <div class="mt-3 flex flex-wrap gap-2">
                    {#each job.requiredSkills.slice(0, 5) as skill}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {skill}
                      </span>
                    {/each}
                    {#if job.requiredSkills.length > 5}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                        +{job.requiredSkills.length - 5} more
                      </span>
                    {/if}
                  </div>
                {/if}
              </div>
              
              <div class="ml-6 flex flex-col space-y-2">
                <Button href="/jobs/{job._id}/candidates" variant="primary" size="sm">
                  View Candidates
                </Button>
                <Button href="/jobs/{job._id}" variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>