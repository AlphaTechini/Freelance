<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  
  let { recruiter, loading } = $props();
  
  let jobs = $state([]);
  let paymentHistory = $state([]);
  let stats = $state({
    totalJobs: 0,
    activeJobs: 0,
    filledJobs: 0,
    totalCandidates: 0,
    totalPayments: 0,
    totalSpent: { ETH: 0, USDC: 0, KIRO: 0 }
  });
  let loadingJobs = $state(true);
  let loadingPayments = $state(true);
  let error = $state('');
  
  onMount(async () => {
    await Promise.all([
      loadJobs(),
      loadPaymentHistory(),
      loadStats()
    ]);
  });
  
  async function loadJobs() {
    try {
      loadingJobs = true;
      const response = await apiService.getJobs({ limit: 10 });
      if (response.success) {
        jobs = response.jobs || [];
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      error = 'Failed to load jobs';
    } finally {
      loadingJobs = false;
    }
  }
  
  async function loadPaymentHistory() {
    try {
      loadingPayments = true;
      const response = await apiService.getPaymentHistory({ type: 'sent', limit: 5 });
      if (response.success) {
        paymentHistory = response.payments || [];
      }
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      loadingPayments = false;
    }
  }
  
  async function loadStats() {
    try {
      const [jobsResponse, paymentsResponse] = await Promise.all([
        apiService.getJobs({ limit: 100 }),
        apiService.getPaymentStats()
      ]);
      
      if (jobsResponse.success) {
        const allJobs = jobsResponse.jobs || [];
        stats.totalJobs = allJobs.length;
        stats.activeJobs = allJobs.filter(job => job.status === 'active').length;
        stats.filledJobs = allJobs.filter(job => job.status === 'filled').length;
        stats.totalCandidates = allJobs.reduce((sum, job) => sum + (job.shortlist?.length || 0), 0);
      }
      
      if (paymentsResponse.success) {
        stats.totalPayments = paymentsResponse.stats.totalPayments || 0;
        stats.totalSpent = paymentsResponse.stats.totalSpent || { ETH: 0, USDC: 0, KIRO: 0 };
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
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
  
  function formatCurrency(amount, currency) {
    return `${amount.toFixed(4)} ${currency}`;
  }
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Recruiter Dashboard
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Manage your job postings, candidates, and payments
      </p>
    </div>
    <div class="mt-4 sm:mt-0">
      <Button href="/dashboard/recruiter/jobs/create" variant="primary">
        Create Job Posting
      </Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  <!-- Stats Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jobs</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalJobs}</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Jobs</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeJobs}</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Candidates</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalCandidates}</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalPayments}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Jobs -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Job Postings</h2>
        <Button href="/dashboard/recruiter/jobs" variant="outline" size="sm">
          View All
        </Button>
      </div>
    </div>
    
    <div class="p-6">
      {#if loadingJobs}
        <div class="space-y-4">
          {#each Array(3) as _}
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          {/each}
        </div>
      {:else if jobs.length === 0}
        <div class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No job postings</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first job posting.</p>
          <div class="mt-6">
            <Button href="/dashboard/recruiter/jobs/create" variant="primary">
              Create Job Posting
            </Button>
          </div>
        </div>
      {:else}
        <div class="space-y-4">
          {#each jobs as job}
            <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                    <a href="/jobs/{job._id}" class="hover:text-blue-600 dark:hover:text-blue-400">
                      {job.title}
                    </a>
                  </h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(job.status)}">
                    {job.status}
                  </span>
                </div>
                <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{job.roleType}</span>
                  <span>•</span>
                  <span>{job.shortlist?.length || 0} candidates</span>
                  <span>•</span>
                  <span>Created {formatDate(job.createdAt)}</span>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <Button href="/jobs/{job._id}/candidates" variant="outline" size="sm">
                  View Candidates
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Recent Payments -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</h2>
        <Button href="/dashboard/recruiter/payments" variant="outline" size="sm">
          View All
        </Button>
      </div>
    </div>
    
    <div class="p-6">
      {#if loadingPayments}
        <div class="space-y-4">
          {#each Array(3) as _}
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          {/each}
        </div>
      {:else if paymentHistory.length === 0}
        <div class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payments yet</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Payments to candidates will appear here.</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each paymentHistory as payment}
            <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                    Payment to {payment.recipient?.displayName || 'Candidate'}
                  </h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {payment.status}
                  </span>
                </div>
                <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatCurrency(payment.amount, payment.tokenType)}</span>
                  <span>•</span>
                  <span>{formatDate(payment.createdAt)}</span>
                  {#if payment.job}
                    <span>•</span>
                    <span>{payment.job.title}</span>
                  {/if}
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(payment.amount, payment.tokenType)}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Button href="/dashboard/recruiter/jobs/create" variant="primary" class="justify-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Job
      </Button>
      
      <Button href="/dashboard/recruiter/jobs" variant="outline" class="justify-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        View Jobs
      </Button>
      
      <Button href="/dashboard/recruiter/candidates" variant="outline" class="justify-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Browse Candidates
      </Button>
      
      <Button href="/dashboard/recruiter/payments" variant="outline" class="justify-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        Payments
      </Button>
    </div>
  </div>
</div>