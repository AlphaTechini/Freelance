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
    bio: initialData.bio || '',
    major: initialData.major || '',
    fieldOfStudy: initialData.fieldOfStudy || '',
    educationLevel: initialData.educationLevel || '',
    university: initialData.university || '',
    skills: initialData.skills || [],
    yearsOfExperience: initialData.yearsOfExperience || 0,
    portfolioUrl: initialData.portfolioUrl || '',
    githubUrl: initialData.githubUrl || '',
    availability: initialData.availability || '',
    workHistory: initialData.workHistory || [],
    isPublished: initialData.isPublished || false
  });
  
  let newSkill = $state('');
  let newWorkEntry = $state({
    company: '',
    position: '',
    duration: '',
    description: ''
  });
  let showWorkForm = $state(false);
  
  // Education level options
  const educationLevels = [
    { value: 'student', label: 'Student' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'phd', label: 'PhD Candidate' }
  ];
  
  // Availability options
  const availabilityOptions = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Months', label: 'Available for months' }
  ];
  
  function addSkill() {
    const skill = newSkill.trim();
    if (skill && !formData.skills.includes(skill)) {
      formData.skills = [...formData.skills, skill];
      newSkill = '';
    }
  }
  
  function removeSkill(skillToRemove) {
    formData.skills = formData.skills.filter(s => s !== skillToRemove);
  }
  
  function addWorkEntry() {
    if (newWorkEntry.company && newWorkEntry.position && newWorkEntry.duration) {
      formData.workHistory = [...formData.workHistory, { ...newWorkEntry }];
      newWorkEntry = { company: '', position: '', duration: '', description: '' };
      showWorkForm = false;
    }
  }
  
  function removeWorkEntry(index) {
    formData.workHistory = formData.workHistory.filter((_, i) => i !== index);
  }
  
  function handleSubmit(event) {
    event.preventDefault();
    
    // Basic validation
    if (!formData.educationLevel) {
      dispatch('error', 'Education level is required');
      return;
    }
    
    if (formData.yearsOfExperience < 0) {
      dispatch('error', 'Years of experience cannot be negative');
      return;
    }
    
    // Validate URLs if provided
    if (formData.portfolioUrl && !isValidUrl(formData.portfolioUrl)) {
      dispatch('error', 'Please enter a valid portfolio URL');
      return;
    }
    
    if (formData.githubUrl && !isValidUrl(formData.githubUrl)) {
      dispatch('error', 'Please enter a valid GitHub URL');
      return;
    }
    
    dispatch('submit', formData);
  }
  
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  <!-- Education Information -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Education Information</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="educationLevel" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Education Level *
        </label>
        <select
          id="educationLevel"
          bind:value={formData.educationLevel}
          required
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select education level</option>
          {#each educationLevels as level}
            <option value={level.value}>{level.label}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <Input
          label="University"
          type="text"
          bind:value={formData.university}
          placeholder="Your university or institution"
        />
      </div>
      
      <div>
        <Input
          label="Major/Field of Study"
          type="text"
          bind:value={formData.major}
          placeholder="Computer Science, Engineering, etc."
        />
      </div>
      
      <div>
        <Input
          label="Specific Field"
          type="text"
          bind:value={formData.fieldOfStudy}
          placeholder="Web Development, AI/ML, etc."
        />
      </div>
    </div>
  </div>

  <!-- Professional Information -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Professional Information</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <Input
          label="Years of Experience"
          type="number"
          bind:value={formData.yearsOfExperience}
          min="0"
          max="50"
          placeholder="0"
        />
      </div>
      
      <div>
        <label for="availability" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Availability
        </label>
        <select
          id="availability"
          bind:value={formData.availability}
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select availability</option>
          {#each availabilityOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Input
          label="Portfolio URL"
          type="url"
          bind:value={formData.portfolioUrl}
          placeholder="https://yourportfolio.com"
        />
      </div>
      
      <div>
        <Input
          label="GitHub URL"
          type="url"
          bind:value={formData.githubUrl}
          placeholder="https://github.com/yourusername"
        />
      </div>
    </div>
  </div>

  <!-- Bio -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">About You</h3>
    
    <div>
      <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Bio
      </label>
      <textarea
        id="bio"
        bind:value={formData.bio}
        placeholder="Tell us about yourself, your interests, and what you're looking for..."
        maxlength={1000}
        rows="4"
        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      ></textarea>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {formData.bio.length}/1000 characters
      </p>
    </div>
  </div>

  <!-- Skills -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Skills</h3>
    
    <div class="space-y-4">
      <div class="flex gap-2">
        <Input
          type="text"
          bind:value={newSkill}
          placeholder="Add a skill (e.g., JavaScript, React, Python)"
          maxlength={30}
          onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
        />
        <Button type="button" variant="secondary" onclick={addSkill}>Add</Button>
      </div>
      
      {#if formData.skills.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each formData.skills as skill}
            <span class="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-sm">
              {skill}
              <button
                type="button"
                onclick={() => removeSkill(skill)}
                class="hover:text-orange-600 dark:hover:text-orange-400"
              >
                ×
              </button>
            </span>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-gray-500 dark:text-gray-400">No skills added yet</p>
      {/if}
    </div>
  </div>

  <!-- Work History -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Work History</h3>
      <Button type="button" variant="secondary" size="sm" onclick={() => showWorkForm = !showWorkForm}>
        {showWorkForm ? 'Cancel' : 'Add Experience'}
      </Button>
    </div>
    
    {#if showWorkForm}
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Company"
            type="text"
            bind:value={newWorkEntry.company}
            placeholder="Company name"
            required
          />
          <Input
            label="Position"
            type="text"
            bind:value={newWorkEntry.position}
            placeholder="Job title"
            required
          />
        </div>
        
        <div class="mb-4">
          <Input
            label="Duration"
            type="text"
            bind:value={newWorkEntry.duration}
            placeholder="e.g., Jan 2022 - Present, 6 months"
            required
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            bind:value={newWorkEntry.description}
            placeholder="Describe your role and achievements..."
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          ></textarea>
        </div>
        
        <div class="flex gap-2">
          <Button type="button" variant="primary" size="sm" onclick={addWorkEntry}>
            Add Experience
          </Button>
          <Button type="button" variant="ghost" size="sm" onclick={() => showWorkForm = false}>
            Cancel
          </Button>
        </div>
      </div>
    {/if}
    
    {#if formData.workHistory.length > 0}
      <div class="space-y-4">
        {#each formData.workHistory as work, index}
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 dark:text-white">{work.position}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">{work.company} • {work.duration}</p>
                {#if work.description}
                  <p class="text-sm text-gray-700 dark:text-gray-300 mt-2">{work.description}</p>
                {/if}
              </div>
              <button
                type="button"
                onclick={() => removeWorkEntry(index)}
                class="text-red-500 hover:text-red-700 ml-4"
              >
                ×
              </button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-sm text-gray-500 dark:text-gray-400">No work experience added yet</p>
    {/if}
  </div>

  <!-- Profile Visibility -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Profile Visibility</h3>
    
    <label class="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        bind:checked={formData.isPublished}
        class="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
      />
      <div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Make my profile visible to recruiters
        </span>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          When enabled, recruiters can find and contact you for opportunities
        </p>
      </div>
    </label>
  </div>

  <!-- Submit Button -->
  <div class="flex justify-end">
    <Button type="submit" variant="primary" disabled={loading}>
      {loading ? 'Creating Profile...' : 'Create Profile'}
    </Button>
  </div>
</form>