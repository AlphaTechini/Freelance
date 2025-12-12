<script>
  import { goto } from '$app/navigation';
  import { apiService } from '$lib/services/api.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import JobPostingForm from '$lib/components/JobPostingForm.svelte';
  
  let loading = $state(false);
  let error = $state('');
  let success = $state('');
  
  async function handleJobCreated(event) {
    const { job } = event.detail;
    success = 'Job posting created successfully!';
    
    // Redirect to job details after a short delay
    setTimeout(() => {
      goto(`/jobs/${job._id}`);
    }, 2000);
  }
  
  function handleError(event) {
    error = event.detail.message || 'Failed to create job posting';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
      Create Job Posting
    </h1>
    <p class="mt-2 text-gray-600 dark:text-gray-400">
      Post a new job opportunity and let AI find the best candidates for you
    </p>
  </div>

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

  <!-- Job Posting Form -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <JobPostingForm 
      onSuccess={handleJobCreated}
      onError={handleError}
    />
  </div>
</div>