<script>
  import { authStore } from '$lib/stores/auth.js';
  import { walletStore } from '$lib/services/wallet.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Button, ResponsiveLayout } from '$lib/components/ui';
  import RoleSelector from '$lib/components/RoleSelector.svelte';

  let showRoleSelector = false;

  onMount(() => {
    // If user is already authenticated, redirect to appropriate dashboard
    if ($authStore.user) {
      // TODO: Redirect based on user role
      goto('/dashboard');
    }
  });

  function handleGetStarted() {
    showRoleSelector = true;
  }

  function handleRoleSelected(event) {
    const role = event.detail;
    // Store selected role and redirect to registration
    localStorage.setItem('selectedRole', role.id);
    goto(`/auth/register?role=${role.id}`);
  }

  function handleSignIn() {
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>Kiro Talent Engine - AI-Powered Talent Platform</title>
  <meta name="description" content="Connect recruiters with top talent using AI-powered portfolio analysis and smart matching" />
</svelte:head>

{#if !showRoleSelector}
  <!-- Hero Section -->
  <section class="hero-section">
    <ResponsiveLayout variant="centered" class="text-center py-20">
      <div class="max-w-4xl mx-auto fade-in">
        <h1 class="heading-1 mb-6 text-accent">
          Kiro Talent Engine
        </h1>
        <p class="body-large mb-8 max-w-2xl mx-auto">
          The universal AI-powered talent platform connecting recruiters with freelancers, 
          students, graduates, and PhD candidates through intelligent portfolio analysis 
          and crypto-native payments.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            variant="primary" 
            size="lg"
            onclick={handleGetStarted}
            class="hover-lift"
          >
            Get Started
          </Button>
          <Button 
            variant="secondary" 
            size="lg"
            onclick={handleSignIn}
            class="hover-lift"
          >
            Sign In
          </Button>
        </div>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- Features Section -->
  <section class="features-section py-20" style="background-color: var(--bg-secondary);">
    <ResponsiveLayout maxWidth="xl">
      <div class="text-center mb-16">
        <h2 class="heading-2 mb-4">Why Choose Kiro?</h2>
        <p class="body-large text-secondary max-w-2xl mx-auto">
          Experience the future of talent matching with AI-driven insights and seamless crypto payments
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="feature-card text-center slide-in">
          <div class="feature-icon mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="heading-4 mb-4">AI-Powered Analysis</h3>
          <p class="body text-secondary">
            Advanced portfolio and GitHub analysis with personalized improvement suggestions
          </p>
        </div>

        <div class="feature-card text-center slide-in">
          <div class="feature-icon mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="heading-4 mb-4">Smart Matching</h3>
          <p class="body text-secondary">
            Intelligent candidate-job matching based on skills, experience, and portfolio quality
          </p>
        </div>

        <div class="feature-card text-center slide-in">
          <div class="feature-icon mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h3 class="heading-4 mb-4">Crypto Payments</h3>
          <p class="body text-secondary">
            Seamless test token payments with real-time earnings tracking and wallet integration
          </p>
        </div>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- Stats Section -->
  <section class="stats-section py-20">
    <ResponsiveLayout maxWidth="lg">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div class="stat-item scale-in">
          <div class="heading-1 text-accent mb-2">10K+</div>
          <p class="body text-secondary">Active Users</p>
        </div>
        <div class="stat-item scale-in">
          <div class="heading-1 text-accent mb-2">95%</div>
          <p class="body text-secondary">Match Accuracy</p>
        </div>
        <div class="stat-item scale-in">
          <div class="heading-1 text-accent mb-2">24/7</div>
          <p class="body text-secondary">AI Analysis</p>
        </div>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- CTA Section -->
  <section class="cta-section py-20" style="background-color: var(--bg-secondary);">
    <ResponsiveLayout variant="centered" class="text-center">
      <div class="max-w-2xl mx-auto">
        <h2 class="heading-2 mb-4">Ready to Transform Your Career?</h2>
        <p class="body-large text-secondary mb-8">
          Join thousands of professionals who trust Kiro for their talent needs
        </p>
        <Button 
          variant="primary" 
          size="lg"
          onclick={handleGetStarted}
          class="hover-lift"
        >
          Start Your Journey
        </Button>
      </div>
    </ResponsiveLayout>
  </section>
{:else}
  <!-- Role Selection -->
  <section class="role-selection-section py-12">
    <ResponsiveLayout maxWidth="xl">
      <RoleSelector on:roleSelected={handleRoleSelected} />
    </ResponsiveLayout>
  </section>
{/if}

<style>
  .hero-section {
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    min-height: 80vh;
    display: flex;
    align-items: center;
  }

  .feature-card {
    padding: 2rem;
    border-radius: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    margin: 0 auto;
    background: var(--accent-color);
    color: white;
    border-radius: 50%;
  }

  .stat-item {
    padding: 1rem;
  }

  .text-secondary {
    color: var(--text-secondary);
  }

  /* Animation delays for staggered effects */
  .slide-in:nth-child(1) { animation-delay: 0.1s; }
  .slide-in:nth-child(2) { animation-delay: 0.2s; }
  .slide-in:nth-child(3) { animation-delay: 0.3s; }

  .scale-in:nth-child(1) { animation-delay: 0.1s; }
  .scale-in:nth-child(2) { animation-delay: 0.2s; }
  .scale-in:nth-child(3) { animation-delay: 0.3s; }
</style>