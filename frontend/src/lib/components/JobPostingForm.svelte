<script>
  import { createEventDispatcher } from 'svelte';
  import Button from './ui/Button.svelte';
  import Input from './ui/Input.svelte';
  import { api } from '../services/api.js';

  const dispatch = createEventDispatcher();

  // Form state
  let formData = $state({
    title: '',
    description: '',
    requiredSkills: [],
    minExperience: 0,
    educationPreference: 'Any',
    roleType: 'Full-time',
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    location: 'Remote',
    maxCandidates: 10,
    applicationDeadline: '',
    tags: []
  });

  let skillInput = $state('');
  let tagInput = $state('');
  let loading = $state(false);
  let error = $state('');

  // Add skill to the list
  function addSkill() {
    if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
      formData.requiredSkills = [...formData.requiredSkills, skillInput.trim()];
      skillInput = '';
    }
  }

  // Remove skill from the list
  function removeSkill(skill) {
    formData.requiredSkills = formData.requiredSkills.filter(s => s !== skill);
  }

  // Add tag to the list
  function addTag() {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      formData.tags = [...formData.tags, tagInput.trim()];
      tagInput = '';
    }
  }

  // Remove tag from the list
  function removeTag(tag) {
    formData.tags = formData.tags.filter(t => t !== tag);
  }

  // Handle form submission
  async function handleSubmit() {
    if (!formData.title.trim() || !formData.description.trim()) {
      error = 'Title and description are required';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await api.post('/jobs', formData);
      
      if (response.success) {
        dispatch('jobCreated', response.job);
        // Reset form
        formData = {
          title: '',
          description: '',
          requiredSkills: [],
          minExperience: 0,
          educationPreference: 'Any',
          roleType: 'Full-time',
          budget: { min: 0, max: 0, currency: 'USD' },
          location: 'Remote',
          maxCandidates: 10,
          applicationDeadline: '',
          tags: []
        };
      } else {
        error = response.message || 'Failed to create job posting';
      }
    } catch (err) {
      console.error('Job creation error:', err);
      error = 'Failed to create job posting. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Handle skill input keypress
  function handleSkillKeypress(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSkill();
    }
  }

  // Handle tag input keypress
  function handleTagKeypress(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Create Job Posting</h2>
    <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>AI will automatically match candidates</span>
    </div>
  </div>

  {#if error}
    <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
      <div class="flex items-center">
        <svg class="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm text-red-700 dark:text-red-200">{error}</span>
      </div>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-6">
    <!-- Basic Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="md:col-span-2">
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Job Title *
        </label>
        <Input
          id="title"
          bind:value={formData.title}
          placeholder="e.g. Senior Frontend Developer"
          required
        />
      </div>

      <div>
        <label for="roleType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Role Type *
        </label>
        <select
          id="roleType"
          bind:value={formData.roleType}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        >
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
          <option value="Freelance">Freelance</option>
        </select>
      </div>

      <div>
        <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Location
        </label>
        <select
          id="location"
          bind:value={formData.location}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="Remote">Remote</option>
          <option value="On-site">On-site</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Job Description *
      </label>
      <textarea
        id="description"
        bind:value={formData.description}
        rows="6"
        placeholder="Describe the role, responsibilities, and what you're looking for..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
        required
      ></textarea>
    </div>

    <!-- Required Skills -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Required Skills
      </label>
      <div class="flex gap-2 mb-2">
        <Input
          bind:value={skillInput}
          placeholder="e.g. JavaScript, React, Node.js"
          onkeypress={handleSkillKeypress}
          class="flex-1"
        />
        <Button type="button" variant="secondary" onclick={addSkill}>
          Add
        </Button>
      </div>
      {#if formData.requiredSkills.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each formData.requiredSkills as skill}
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
              {skill}
              <button
                type="button"
                onclick={() => removeSkill(skill)}
                class="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
              >
                ×
              </button>
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Experience and Education -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label for="minExperience" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Minimum Experience (years)
        </label>
        <Input
          id="minExperience"
          type="number"
          bind:value={formData.minExperience}
          min="0"
          max="50"
        />
      </div>

      <div>
        <label for="educationPreference" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Education Preference
        </label>
        <select
          id="educationPreference"
          bind:value={formData.educationPreference}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="Any">Any</option>
          <option value="Student">Student</option>
          <option value="Graduate">Graduate</option>
          <option value="PhD">PhD</option>
        </select>
      </div>
    </div>

    <!-- Budget -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Budget Range
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            type="number"
            bind:value={formData.budget.min}
            placeholder="Min amount"
            min="0"
          />
        </div>
        <div>
          <Input
            type="number"
            bind:value={formData.budget.max}
            placeholder="Max amount"
            min="0"
          />
        </div>
        <div>
          <select
            bind:value={formData.budget.currency}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="USD">USD</option>
            <option value="ETH">ETH</option>
            <option value="USDC">USDC</option>
            <option value="KIRO">KIRO</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Advanced Options -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label for="maxCandidates" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Candidates in Shortlist
        </label>
        <Input
          id="maxCandidates"
          type="number"
          bind:value={formData.maxCandidates}
          min="1"
          max="50"
        />
      </div>

      <div>
        <label for="applicationDeadline" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Application Deadline (Optional)
        </label>
        <Input
          id="applicationDeadline"
          type="datetime-local"
          bind:value={formData.applicationDeadline}
        />
      </div>
    </div>

    <!-- Tags -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tags (Optional)
      </label>
      <div class="flex gap-2 mb-2">
        <Input
          bind:value={tagInput}
          placeholder="e.g. urgent, startup, remote-first"
          onkeypress={handleTagKeypress}
          class="flex-1"
        />
        <Button type="button" variant="secondary" onclick={addTag}>
          Add
        </Button>
      </div>
      {#if formData.tags.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each formData.tags as tag}
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              {tag}
              <button
                type="button"
                onclick={() => removeTag(tag)}
                class="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Submit Button -->
    <div class="flex justify-end pt-4">
      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        class="px-8"
      >
        {#if loading}
          <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating Job...
        {:else}
          Create Job & Generate Shortlist
        {/if}
      </Button>
    </div>
  </form>
</div>