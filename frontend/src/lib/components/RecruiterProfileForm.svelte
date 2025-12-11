<script>
  import { createEventDispatcher } from 'svelte';
  import Button from './ui/Button.svelte';
  import Input from './ui/Input.svelte';
  
  const dispatch = createEventDispatcher();
  
  // Props
  export let initialData = {};
  export let loading = false;
  export let error = '';
  
  // Form state
  let formData = $state({
    company: initialData.company || '',
    position: initialData.position || '',
    bio: initialData.bio || '',
    industry: initialData.industry || ''
  });
  
  // Industry options
  const industryOptions = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'E-commerce',
    'Gaming',
    'Blockchain/Crypto',
    'Consulting',
    'Marketing',
    'Media',
    'Manufacturing',
    'Real Estate',
    'Non-profit',
    'Government',
    'Startup',
    'Other'
  ];
  
  function handleSubmit(event) {
    event.preventDefault();
    
    // Basic validation
    if (!formData.company.trim()) {
      dispatch('error', 'Company name is required');
      return;
    }
    
    if (!formData.position.trim()) {
      dispatch('error', 'Position is required');
      return;
    }
    
    dispatch('submit', formData);
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  <!-- Company Information -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Company Information</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Input
          label="Company Name"
          type="text"
          bind:value={formData.company}
          placeholder="Your company name"
          required
        />
      </div>
      
      <div>
        <Input
          label="Your Position"
          type="text"
          bind:value={formData.position}
          placeholder="e.g., HR Manager, CTO, Founder"
          required
        />
      </div>
      
      <div class="md:col-span-2">
        <label for="industry" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Industry
        </label>
        <select
          id="industry"
          bind:value={formData.industry}
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select industry</option>
          {#each industryOptions as industry}
            <option value={industry}>{industry}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- About -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">About You & Your Company</h3>
    
    <div>
      <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Bio
      </label>
      <textarea
        id="bio"
        bind:value={formData.bio}
        placeholder="Tell us about your company, what you're looking for in candidates, your hiring philosophy, etc."
        maxlength={1000}
        rows="6"
        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      ></textarea>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {formData.bio.length}/1000 characters
      </p>
    </div>
  </div>

  <!-- Hiring Information -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Hiring Information</h3>
    
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">
            Ready to Find Talent?
          </h4>
          <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <p>Once your profile is created, you'll be able to:</p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>Post job opportunities</li>
              <li>Browse and search candidate profiles</li>
              <li>Use AI-powered candidate matching</li>
              <li>Send payments using test tokens</li>
              <li>Manage your hiring pipeline</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Submit Button -->
  <div class="flex justify-end">
    <Button type="submit" variant="primary" disabled={loading}>
      {loading ? 'Creating Profile...' : 'Create Recruiter Profile'}
    </Button>
  </div>
</form>