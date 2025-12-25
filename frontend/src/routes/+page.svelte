<script>
  import { authStore } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Button, ResponsiveLayout } from '$lib/components/ui';
  import RoleSelector from '$lib/components/RoleSelector.svelte';

  let showRoleSelector = false;

  onMount(() => {
    // Subscribe to auth store to handle async auth initialization
    const unsubscribe = authStore.subscribe((auth) => {
      // If user is authenticated (via cookie), redirect to dashboard
      if (!auth.loading && auth.user) {
        goto('/dashboard');
      }
    });

    return unsubscribe;
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
  <title>MeritStack - Stop Applying. Start Being Chosen.</title>
  <meta name="description" content="AI-native freelance and hiring platform that reads real work, not resumes. Match based on proven skill stacks, not keyword spam." />
</svelte:head>

{#if !showRoleSelector}
  <!-- Hero Section -->
  <section class="hero-section">
    <ResponsiveLayout variant="centered" class="text-center py-20">
      <div class="max-w-4xl mx-auto fade-in">
        <h1 class="heading-1 mb-6">
          From 1,000 Emails to the Best Candidate — In One Click.
        </h1>
        <p class="body-large mb-4 max-w-3xl mx-auto">
          Recruiters stop drowning in 500 resumes. Candidates stop applying blindly.<br/>
          <strong>MeritStack uses AI to match people to work based on real skills, real experience, real output.</strong>
        </p>
        <p class="body mb-8 text-secondary max-w-2xl mx-auto">
          No endless applications. No hiring regrets. No wasted talent.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            variant="primary" 
            size="lg"
            onclick={handleGetStarted}
            class="hover-lift"
          >
            Get Verified. Get Hired.
          </Button>
          <Button 
            variant="secondary" 
            size="lg"
            onclick={handleSignIn}
            class="hover-lift"
          >
            I'm Hiring Talent
          </Button>
        </div>
        
        <p class="body-small text-secondary italic">
          Get hired for what you can actually do. Hire people who can actually do the job.
        </p>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- Pain Contrast Strip -->
  <section class="pain-contrast-section py-12" style="background-color: var(--bg-card); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
    <ResponsiveLayout maxWidth="xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="contrast-column old-way">
          <h3 class="heading-4 mb-6 text-center">The Old Way</h3>
          <ul class="contrast-list">
            <li>❌ 1,000 emails</li>
            <li>❌ 500 resumes</li>
            <li>❌ Hours wasted reading PDFs</li>
            <li>❌ Keyword matching</li>
            <li>❌ Hiring regrets</li>
          </ul>
        </div>
        <div class="contrast-column new-way">
          <h3 class="heading-4 mb-6 text-center text-accent">The MeritStack Way</h3>
          <ul class="contrast-list">
            <li>✅ One click shortlist</li>
            <li>✅ Ranked by real skills</li>
            <li>✅ AI-verified portfolios</li>
            <li>✅ Proven experience</li>
            <li>✅ Confident hires</li>
          </ul>
        </div>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- Who This Is For Section -->
  <section class="who-section py-20" style="background-color: var(--bg-secondary);">
    <ResponsiveLayout maxWidth="xl">
      <div class="text-center mb-16">
        <h2 class="heading-2 mb-4">Built for People Tired of Broken Hiring</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="who-card slide-in">
          <h3 class="heading-4 mb-4 text-accent">For Freelancers & Candidates</h3>
          <ul class="who-list">
            <li>✓ Your GitHub, portfolio, and real projects become your résumé</li>
            <li>✓ AI reviews your work and tells you exactly what to improve</li>
            <li>✓ You get matched to gigs that fit your actual stack</li>
            <li>✓ No rejection emails. No ghosting. No spam applications.</li>
          </ul>
        </div>

        <div class="who-card slide-in">
          <h3 class="heading-4 mb-4 text-accent">For Recruiters & Clients</h3>
          <ul class="who-list">
            <li>✓ No more 500 resumes for one role</li>
            <li>✓ Get a ranked shortlist of verified, skill-matched candidates</li>
            <li>✓ Hire with confidence — talent is evaluated before you see them</li>
            <li>✓ Pay securely with crypto escrow or test tokens</li>
          </ul>
        </div>

        <div class="who-card slide-in">
          <h3 class="heading-4 mb-4 text-accent">For Investors & Partners</h3>
          <ul class="who-list">
            <li>✓ Solves a global hiring inefficiency</li>
            <li>✓ AI + Web3 native marketplace</li>
            <li>✓ Low-fee, high-retention platform economics</li>
            <li>✓ Designed for scale, automation, and protocol growth</li>
          </ul>
        </div>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- How It Works Section -->
  <section class="how-section py-20">
    <ResponsiveLayout maxWidth="lg">
      <div class="text-center mb-16">
        <h2 class="heading-2 mb-4">How MeritStack Works</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="how-step scale-in">
          <div class="step-number">1</div>
          <h3 class="heading-4 mb-3">Create Your Profile</h3>
          <p class="body text-secondary">
            Talent connects GitHub, portfolio links, experience level, education, and wallet.
          </p>
        </div>

        <div class="how-step scale-in">
          <div class="step-number">2</div>
          <h3 class="heading-4 mb-3">AI Verification</h3>
          <p class="body text-secondary">
            Our AI visits real URLs, reviews projects, analyzes code quality, and generates a verified skill stack.
          </p>
        </div>

        <div class="how-step scale-in">
          <div class="step-number">3</div>
          <h3 class="heading-4 mb-3">Smart Matching</h3>
          <p class="body text-secondary">
            When a client posts a gig, MeritStack automatically ranks candidates by fit.
          </p>
        </div>

        <div class="how-step scale-in">
          <div class="step-number">4</div>
          <h3 class="heading-4 mb-3">Hire With Confidence</h3>
          <p class="body text-secondary">
            Clients hire directly. Talent gets notified. Payments flow seamlessly.
          </p>
        </div>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- Features Section -->
  <section class="features-section py-20" style="background-color: var(--bg-secondary);">
    <ResponsiveLayout maxWidth="xl">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="feature-card text-center slide-in">
          <div class="feature-icon mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="heading-4 mb-4">AI That Reads Code, Not Claims</h3>
          <p class="body text-secondary">
            MeritStack's AI analyzes GitHub repos, live portfolios, and real deliverables — producing a skill-match score recruiters can trust.
          </p>
        </div>

        <div class="feature-card text-center slide-in">
          <div class="feature-icon mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="heading-4 mb-4">Merit-Based Matching</h3>
          <p class="body text-secondary">
            Clients don't search. They receive ranked candidates who already fit the role — saving hours and eliminating bad hires.
          </p>
        </div>

        <div class="feature-card text-center slide-in">
          <div class="feature-icon mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h3 class="heading-4 mb-4">Crypto-Native Payments</h3>
          <p class="body text-secondary">
            Smart payments using wallets and test tokens. Transparent, fast, and global by default.
          </p>
        </div>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- Candidate Focus Section -->
  <section class="candidate-section py-20">
    <ResponsiveLayout maxWidth="lg">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="heading-2 mb-6">Get Hired Based on What You Can Actually Do</h2>
        <p class="body-large mb-4">
          Stop chasing jobs that don't fit you.
        </p>
        <p class="body text-secondary mb-6">
          MeritStack evaluates your actual skills and experience — your GitHub, your portfolio, your projects — and matches you to roles that genuinely align with your stack.
        </p>
        <p class="body text-secondary mb-8">
          No keyword games. No learning random frameworks just to "qualify." No wasted months applying to the wrong jobs.
        </p>
        <p class="body-large font-semibold text-accent">
          Get the job that actually fits you.
        </p>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- Recruiter Focus Section -->
  <section class="recruiter-section py-20" style="background-color: var(--bg-secondary);">
    <ResponsiveLayout maxWidth="lg">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="heading-2 mb-6">Hire the Best Fit — Instantly</h2>
        <p class="body-large mb-4">
          Recruiters don't need more resumes. They need clarity.
        </p>
        <p class="body text-secondary mb-6">
          MeritStack replaces endless screening with AI-ranked candidates, filtered by real capability.
        </p>
        <p class="body-large font-semibold text-accent mb-8">
          From 1,000 emails and 500 resumes → to the best-fit candidate with a single click.
        </p>
        <p class="body text-secondary">
          Hire faster. Hire smarter. Hire without regret.
        </p>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- Stats Section -->
  <section class="stats-section py-20">
    <ResponsiveLayout maxWidth="lg">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
        <div class="stat-item scale-in">
          <div class="heading-1 text-accent mb-2">↓ 80%</div>
          <p class="body text-secondary">Hiring Time</p>
        </div>
        <div class="stat-item scale-in">
          <div class="heading-1 text-accent mb-2">↑ Higher</div>
          <p class="body text-secondary">Talent Retention</p>
        </div>
        <div class="stat-item scale-in">
          <div class="heading-1 text-accent mb-2">0</div>
          <p class="body text-secondary">Keyword Spam</p>
        </div>
        <div class="stat-item scale-in">
          <div class="heading-1 text-accent mb-2">100%</div>
          <p class="body text-secondary">Skill-First Matching</p>
        </div>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- CTA Section -->
  <section class="cta-section py-20" style="background-color: var(--bg-secondary);">
    <ResponsiveLayout variant="centered" class="text-center">
      <div class="max-w-2xl mx-auto">
        <h2 class="heading-2 mb-4">Hiring Is Changing. Don't Be Left Behind.</h2>
        <p class="body-large text-secondary mb-8">
          Whether you're a freelancer tired of being ignored or a recruiter overwhelmed by noise — MeritStack is where merit finally wins.
        </p>
        <Button 
          variant="primary" 
          size="lg"
          onclick={handleGetStarted}
          class="hover-lift"
        >
          Join MeritStack Now
        </Button>
      </div>
    </ResponsiveLayout>
  </section>

  <!-- Footer Tagline -->
  <section class="footer-tagline py-8" style="background-color: var(--bg-card); border-top: 1px solid var(--border-color);">
    <ResponsiveLayout variant="centered" class="text-center">
      <p class="body-small text-secondary italic">
        MeritStack is building the infrastructure for trust-based hiring in the global freelance economy.
      </p>
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

  /* Pain Contrast Section */
  .contrast-column {
    padding: 2rem;
    border-radius: 12px;
    background: var(--bg-primary);
  }

  .contrast-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .contrast-list li {
    padding: 0.75rem 0;
    font-size: 1.1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .contrast-list li:last-child {
    border-bottom: none;
  }

  /* Who Section */
  .who-card {
    padding: 2rem;
    border-radius: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
  }

  .who-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .who-list li {
    padding: 0.75rem 0;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  /* How It Works */
  .how-step {
    padding: 2rem;
    border-radius: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    position: relative;
  }

  .step-number {
    position: absolute;
    top: -1rem;
    left: 2rem;
    width: 3rem;
    height: 3rem;
    background: var(--accent-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
  }

  /* Animation delays for staggered effects */
  .slide-in:nth-child(1) { animation-delay: 0.1s; }
  .slide-in:nth-child(2) { animation-delay: 0.2s; }
  .slide-in:nth-child(3) { animation-delay: 0.3s; }

  .scale-in:nth-child(1) { animation-delay: 0.1s; }
  .scale-in:nth-child(2) { animation-delay: 0.2s; }
  .scale-in:nth-child(3) { animation-delay: 0.3s; }
  .scale-in:nth-child(4) { animation-delay: 0.4s; }
</style>