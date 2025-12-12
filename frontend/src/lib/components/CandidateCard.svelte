<script>
  import Button from './ui/Button.svelte';
  
  let {
    candidate,
    onHire = () => {},
    onEmail = () => {},
    onViewProfile = () => {},
    onPay = () => {},
    showActions = true
  } = $props();

  // Extract match details
  const matchScore = candidate.matchScore || 0;
  const matchDetails = candidate.matchDetails || {};
  const strengths = matchDetails.strengths || [];
  const matchingSkills = matchDetails.matchingSkills || [];
  const missingSkills = matchDetails.missingSkills || [];

  // Format experience display
  const experienceText = candidate.experienceYears 
    ? `${candidate.experienceYears} year${candidate.experienceYears !== 1 ? 's' : ''}`
    : 'No experience listed';

  // Get match score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Handle email click
  const handleEmail = async () => {
    try {
      // Get mailto link from backend if we have job context
      if (candidate.jobId) {
        const { apiService } = await import('$lib/services/api.js');
        const token = localStorage.getItem('token');
        if (token) {
          apiService.setToken(token);
        }
        
        try {
          const data = await apiService.getCandidateMailtoLink(candidate.jobId, candidate._id);
          window.open(data.mailtoLink);
        } catch (apiError) {
          console.warn('Failed to get mailto link from API, using fallback:', apiError);
          // Fallback to simple mailto
          const subject = encodeURIComponent(`Job Opportunity - ${candidate.name}`);
          const body = encodeURIComponent(`Hi ${candidate.name},\n\nI found your profile interesting and would like to discuss a potential opportunity with you.\n\nBest regards`);
          const mailtoLink = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
          window.open(mailtoLink);
        }
      } else {
        // Simple mailto without job context
        const subject = encodeURIComponent(`Job Opportunity - ${candidate.name}`);
        const body = encodeURIComponent(`Hi ${candidate.name},\n\nI found your profile interesting and would like to discuss a potential opportunity with you.\n\nBest regards`);
        const mailtoLink = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
        window.open(mailtoLink);
      }
      onEmail(candidate);
    } catch (error) {
      console.error('Failed to generate email link:', error);
      // Fallback to simple mailto
      const subject = encodeURIComponent(`Job Opportunity - ${candidate.name}`);
      const body = encodeURIComponent(`Hi ${candidate.name},\n\nI found your profile interesting and would like to discuss a potential opportunity with you.\n\nBest regards`);
      const mailtoLink = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
      window.open(mailtoLink);
      onEmail(candidate);
    }
  };

  // Handle hire click
  const handleHire = async () => {
    try {
      if (candidate.jobId) {
        const { apiService } = await import('$lib/services/api.js');
        const token = localStorage.getItem('token');
        if (token) {
          apiService.setToken(token);
        }

        const data = await apiService.hireCandidate(candidate.jobId, candidate._id, {
          sendEmail: true
        });

        alert(data.emailSent ? 
          'Candidate hired successfully! Notification email sent.' : 
          'Candidate hired successfully!'
        );
        
        // Update candidate status locally
        candidate.status = 'hired';
      }
      onHire(candidate);
    } catch (error) {
      console.error('Failed to hire candidate:', error);
      alert(`Failed to hire candidate: ${error.message || 'Please try again.'}`);
      onHire(candidate);
    }
  };

  // Handle pay click
  const handlePay = () => {
    onPay(candidate);
  };

  // Handle view profile click
  const handleViewProfile = () => {
    onViewProfile(candidate);
  };
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700">
  <!-- Header with name and match score -->
  <div class="flex items-start justify-between mb-4">
    <div class="flex items-center gap-3">
      {#if candidate.profileImage}
        <img 
          src={candidate.profileImage} 
          alt={candidate.name}
          class="w-12 h-12 rounded-full object-cover"
        />
      {:else}
        <div class="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-lg">
          {candidate.name?.charAt(0) || 'C'}
        </div>
      {/if}
      
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {candidate.name || 'Candidate'}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {candidate.major || candidate.fieldOfStudy || 'Field not specified'}
        </p>
      </div>
    </div>
    
    <!-- Match Score Badge -->
    <div class="flex items-center gap-2">
      <span class={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(matchScore)}`}>
        {matchScore}% match
      </span>
    </div>
  </div>

  <!-- Education and Experience -->
  <div class="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
    {#if candidate.educationLevel}
      <div class="flex items-center gap-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
        </svg>
        <span class="capitalize">{candidate.educationLevel}</span>
      </div>
    {/if}
    
    <div class="flex items-center gap-1">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
      </svg>
      <span>{experienceText}</span>
    </div>
    
    {#if candidate.availability}
      <div class="flex items-center gap-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
        </svg>
        <span>{candidate.availability}</span>
      </div>
    {/if}
  </div>

  <!-- Skills -->
  {#if candidate.skills && candidate.skills.length > 0}
    <div class="mb-4">
      <div class="flex flex-wrap gap-2">
        {#each candidate.skills.slice(0, 6) as skill}
          <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
            {skill}
          </span>
        {/each}
        {#if candidate.skills.length > 6}
          <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-md">
            +{candidate.skills.length - 6} more
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Match Strengths -->
  {#if strengths.length > 0}
    <div class="mb-4">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Strengths</h4>
      <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        {#each strengths.slice(0, 2) as strength}
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span>{strength}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Portfolio and GitHub Links -->
  <div class="flex items-center gap-4 mb-4 text-sm">
    {#if candidate.portfolioUrl}
      <a 
        href={candidate.portfolioUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        class="flex items-center gap-1 text-orange-500 hover:text-orange-600 transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clip-rule="evenodd"/>
        </svg>
        Portfolio
      </a>
    {/if}
    
    {#if candidate.githubUrl}
      <a 
        href={candidate.githubUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"/>
        </svg>
        GitHub
      </a>
    {/if}
  </div>

  <!-- Status Badge -->
  {#if candidate.status && candidate.status !== 'shortlisted'}
    <div class="mb-4">
      <span class={`px-3 py-1 rounded-full text-sm font-medium ${
        candidate.status === 'hired' ? 'bg-green-100 text-green-800' :
        candidate.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
        candidate.status === 'interviewed' ? 'bg-purple-100 text-purple-800' :
        candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {candidate.status === 'hired' ? '✓ Hired' :
         candidate.status === 'contacted' ? '📧 Contacted' :
         candidate.status === 'interviewed' ? '🎯 Interviewed' :
         candidate.status === 'rejected' ? '❌ Rejected' :
         candidate.status}
      </span>
    </div>
  {/if}

  <!-- Action Buttons -->
  {#if showActions}
    <div class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button 
        variant="primary" 
        size="sm" 
        onclick={handleViewProfile}
        class="flex-1"
      >
        View Profile
      </Button>
      
      <Button 
        variant="secondary" 
        size="sm" 
        onclick={handleHire}
        class="flex-1"
        disabled={candidate.status === 'hired'}
      >
        {candidate.status === 'hired' ? 'Hired' : 'Hire'}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onclick={handleEmail}
        class="flex-1"
      >
        Email
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onclick={handlePay}
        class="flex-1"
      >
        Pay
      </Button>
    </div>
  {/if}
</div>