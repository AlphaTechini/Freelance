<script>
  let {
    candidate,
    matchDetails = {},
    isExpanded = false
  } = $props();

  const breakdown = matchDetails.breakdown || {};
  const strengths = matchDetails.strengths || [];
  const matchingSkills = matchDetails.matchingSkills || [];
  const missingSkills = matchDetails.missingSkills || [];
  const weights = matchDetails.weights || {};

  // Component scores with their weights
  const components = [
    {
      name: 'Skill Match',
      score: breakdown.skillMatch || 0,
      weight: weights.skillMatch || 35,
      description: 'Alignment with required skills'
    },
    {
      name: 'Experience',
      score: breakdown.experienceMatch || 0,
      weight: weights.experienceMatch || 20,
      description: 'Years of experience match'
    },
    {
      name: 'Portfolio',
      score: breakdown.portfolioDepth || 0,
      weight: weights.portfolioDepth || 20,
      description: 'Portfolio quality and depth'
    },
    {
      name: 'Education',
      score: breakdown.educationAlignment || 0,
      weight: weights.educationAlignment || 10,
      description: 'Education level alignment'
    },
    {
      name: 'GitHub Activity',
      score: breakdown.githubActivity || 0,
      weight: weights.githubActivity || 10,
      description: 'GitHub contribution activity'
    },
    {
      name: 'Availability',
      score: breakdown.availabilityFit || 0,
      weight: weights.availabilityFit || 5,
      description: 'Schedule and availability fit'
    }
  ];

  // Get color for score
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get text color for score
  const getTextColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    isExpanded = !isExpanded;
  };
</script>

<div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
      Match Analysis
    </h4>
    <button 
      onclick={toggleExpanded}
      class="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
    >
      {isExpanded ? 'Show Less' : 'Show Details'}
    </button>
  </div>

  <!-- Overall Match Score -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Match</span>
      <span class={`text-lg font-bold ${getTextColor(matchDetails.overallScore || 0)}`}>
        {matchDetails.overallScore || 0}%
      </span>
    </div>
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div 
        class={`h-2 rounded-full transition-all duration-300 ${getScoreColor(matchDetails.overallScore || 0)}`}
        style="width: {matchDetails.overallScore || 0}%"
      ></div>
    </div>
  </div>

  <!-- Key Strengths -->
  {#if strengths.length > 0}
    <div class="mb-4">
      <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Strengths</h5>
      <ul class="space-y-1">
        {#each strengths.slice(0, isExpanded ? strengths.length : 2) as strength}
          <li class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span>{strength}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Detailed Breakdown (Expanded View) -->
  {#if isExpanded}
    <div class="space-y-4">
      <!-- Component Scores -->
      <div>
        <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Score Breakdown</h5>
        <div class="space-y-3">
          {#each components as component}
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {component.name} ({component.weight}%)
                  </span>
                  <span class={`text-sm font-medium ${getTextColor(component.score)}`}>
                    {component.score}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    class={`h-1.5 rounded-full transition-all duration-300 ${getScoreColor(component.score)}`}
                    style="width: {component.score}%"
                  ></div>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {component.description}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Matching Skills -->
      {#if matchingSkills.length > 0}
        <div>
          <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Matching Skills</h5>
          <div class="flex flex-wrap gap-2">
            {#each matchingSkills as skill}
              <span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-md">
                {skill}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Missing Skills -->
      {#if missingSkills.length > 0}
        <div>
          <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Areas for Growth</h5>
          <div class="flex flex-wrap gap-2">
            {#each missingSkills as skill}
              <span class="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded-md">
                {skill}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Match Explanation -->
      {#if candidate.matchExplanation}
        <div>
          <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">AI Analysis</h5>
          <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {candidate.matchExplanation}
          </p>
        </div>
      {/if}
    </div>
  {/if}
</div>