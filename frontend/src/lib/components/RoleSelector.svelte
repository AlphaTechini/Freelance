<script>
  import { createEventDispatcher } from 'svelte';
  import { Card, Button } from '$lib/components/ui';

  const dispatch = createEventDispatcher();

  const roles = [
    {
      id: 'freelancer',
      title: 'Freelancer',
      description: 'Showcase your skills, build your portfolio, and get hired by top recruiters',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      features: [
        'AI-powered portfolio analysis',
        'Skill-based matching',
        'Crypto payments',
        'Real-time earnings tracking'
      ]
    },
    {
      id: 'recruiter',
      title: 'Recruiter',
      description: 'Find the perfect candidates with AI-powered matching and streamlined hiring',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      features: [
        'Smart candidate matching',
        'Automated shortlisting',
        'One-click hiring',
        'Instant crypto payments'
      ]
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Build your professional profile and get discovered for internships and entry-level positions',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      features: [
        'Portfolio guidance',
        'Skill development tracking',
        'Internship opportunities',
        'Career mentorship'
      ]
    },
    {
      id: 'graduate',
      title: 'Graduate',
      description: 'Launch your career with comprehensive profile analysis and job matching',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="10" r="2" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      features: [
        'Career-focused matching',
        'Professional development',
        'Industry connections',
        'Salary insights'
      ]
    },
    {
      id: 'phd',
      title: 'PhD Candidate',
      description: 'Connect with specialized research and technical opportunities',
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 7h8M8 11h8M8 15h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      features: [
        'Research-focused opportunities',
        'Academic network access',
        'Specialized skill matching',
        'Publication tracking'
      ]
    }
  ];

  function selectRole(role) {
    dispatch('roleSelected', role);
  }
</script>

<div class="role-selector">
  <div class="text-center mb-8">
    <h2 class="heading-2 mb-4">Choose Your Role</h2>
    <p class="body-large text-secondary">
      Select the role that best describes you to get a personalized experience
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each roles as role}
      <Card 
        clickable={true}
        class="role-card transition-all hover-lift"
        onclick={() => selectRole(role)}
      >
        <div class="text-center">
          <div class="role-icon mb-4 text-accent">
            {@html role.icon}
          </div>
          
          <h3 class="heading-4 mb-2">{role.title}</h3>
          <p class="body-small text-secondary mb-4">{role.description}</p>
          
          <ul class="text-left space-y-2 mb-6">
            {#each role.features as feature}
              <li class="body-small flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-success flex-shrink-0">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {feature}
              </li>
            {/each}
          </ul>
          
          <Button variant="primary" class="w-full">
            Get Started as {role.title}
          </Button>
        </div>
      </Card>
    {/each}
  </div>
</div>

<style>
  .role-selector {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .role-card {
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .role-card:hover {
    border-color: var(--accent-color);
    transform: translateY(-4px);
  }

  .role-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    margin: 0 auto;
    background: var(--bg-secondary);
    border-radius: 50%;
  }

  .text-secondary {
    color: var(--text-secondary);
  }

  .text-success {
    color: var(--success-color);
  }
</style>