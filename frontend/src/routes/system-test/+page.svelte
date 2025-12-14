<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.js';
  import { apiService } from '$lib/services/api.js';
  import SystemStatus from '$lib/components/SystemStatus.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import CandidateCard from '$lib/components/CandidateCard.svelte';
  import PaymentModal from '$lib/components/PaymentModal.svelte';
  
  let testResults = $state([]);
  let currentTest = $state('');
  let isRunning = $state(false);
  let testData = $state({
    job: null,
    candidates: [],
    selectedCandidate: null,
    portfolioAnalysis: null
  });
  let showPaymentModal = $state(false);
  
  const TEST_JOB_DATA = {
    title: 'Senior Full Stack Developer (Test)',
    description: 'This is a test job posting to verify the AI matching system works correctly.',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    minExperience: 3,
    educationPreference: 'Graduate',
    roleType: 'Full-time',
    budget: { min: 80000, max: 120000, currency: 'USD' },
    location: 'Remote',
    maxCandidates: 5
  };
  
  async function runTest(testName, testFn) {
    currentTest = testName;
    console.log(`🧪 Running: ${testName}`);
    
    try {
      const result = await testFn();
      testResults.push({
        name: testName,
        status: 'PASSED',
        timestamp: new Date(),
        result
      });
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      testResults.push({
        name: testName,
        status: 'FAILED',
        timestamp: new Date(),
        error: error.message
      });
      console.error(`❌ ${testName} - FAILED:`, error);
      throw error; // Re-throw to stop the test suite
    }
  }
  
  async function testHealthCheck() {
    const health = await apiService.healthCheck();
    if (!health || health.status === 'error') {
      throw new Error('System health check failed');
    }
    return health;
  }
  
  async function testJobCreation() {
    const result = await apiService.createJobPosting(TEST_JOB_DATA);
    if (!result.success) {
      throw new Error(`Job creation failed: ${result.message}`);
    }
    testData.job = result.job;
    return result.job;
  }
  
  async function testCandidateMatching() {
    if (!testData.job) {
      throw new Error('No job available for matching');
    }
    
    const result = await apiService.getJobCandidates(testData.job._id);
    if (!result.success) {
      throw new Error(`Failed to get candidates: ${result.message}`);
    }
    
    testData.candidates = result.candidates || [];
    if (testData.candidates.length === 0) {
      // Try to generate shortlist
      const shortlistResult = await apiService.generateJobShortlist(testData.job._id);
      if (shortlistResult.success) {
        testData.candidates = shortlistResult.candidates || [];
      }
    }
    
    return testData.candidates;
  }
  
  async function testPortfolioAnalysis() {
    if (!$authStore.user || $authStore.user.role !== 'candidate') {
      return { skipped: true, reason: 'User is not a candidate' };
    }
    
    try {
      const result = await apiService.analyzePortfolio($authStore.user.username);
      if (result.success) {
        testData.portfolioAnalysis = result.analysis;
        return result.analysis;
      }
    } catch (error) {
      // Portfolio analysis might fail if no portfolio URL is set
      return { skipped: true, reason: 'Portfolio analysis not available' };
    }
  }
  
  async function testPaymentSystem() {
    if (testData.candidates.length === 0) {
      return { skipped: true, reason: 'No candidates available for payment test' };
    }
    
    const candidate = testData.candidates[0];
    const paymentData = {
      candidateId: candidate._id,
      amount: 10,
      tokenType: 'USDC',
      jobId: testData.job._id,
      purpose: 'test_payment'
    };
    
    const result = await apiService.sendPayment(paymentData);
    if (!result.success) {
      throw new Error(`Payment failed: ${result.message}`);
    }
    
    return result;
  }
  
  async function runAllTests() {
    if (isRunning) return;
    
    isRunning = true;
    testResults = [];
    currentTest = '';
    
    try {
      await runTest('System Health Check', testHealthCheck);
      
      // Only run job-related tests if user is a recruiter
      if ($authStore.user && $authStore.user.role === 'recruiter') {
        await runTest('Job Creation', testJobCreation);
        await runTest('AI Candidate Matching', testCandidateMatching);
        await runTest('Payment System', testPaymentSystem);
      }
      
      // Only run portfolio analysis if user is a candidate
      if ($authStore.user && $authStore.user.role === 'candidate') {
        await runTest('Portfolio Analysis', testPortfolioAnalysis);
      }
      
      currentTest = 'All tests completed!';
      
    } catch (error) {
      currentTest = `Tests stopped due to failure: ${error.message}`;
    } finally {
      isRunning = false;
    }
  }
  
  function handlePayCandidate(candidate) {
    testData.selectedCandidate = candidate;
    showPaymentModal = true;
  }
  
  function handlePaymentComplete(result) {
    console.log('Payment completed:', result);
    showPaymentModal = false;
    testData.selectedCandidate = null;
  }
  
  function getStatusColor(status) {
    return status === 'PASSED' 
      ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      : 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
  }
  
  function formatTimestamp(timestamp) {
    return timestamp.toLocaleTimeString();
  }
</script>

<svelte:head>
  <title>System Integration Test - MeritStack</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <div class="space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        System Integration Test
      </h1>
      <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        This page tests all major system components and workflows to ensure everything is properly integrated.
        Run the tests to verify that the platform is working correctly.
      </p>
    </div>

    <!-- System Status -->
    <SystemStatus />

    <!-- Test Controls -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Integration Tests</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {#if $authStore.user}
              Running as: {$authStore.user.role} ({$authStore.user.displayName || $authStore.user.username})
            {:else}
              Not authenticated - some tests will be skipped
            {/if}
          </p>
        </div>
        
        <Button 
          variant="primary" 
          onclick={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      <!-- Current Test Status -->
      {#if currentTest}
        <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex items-center gap-2">
            {#if isRunning}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            {/if}
            <span class="text-blue-700 dark:text-blue-300 font-medium">
              {currentTest}
            </span>
          </div>
        </div>
      {/if}

      <!-- Test Results -->
      {#if testResults.length > 0}
        <div class="space-y-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Test Results</h3>
          
          {#each testResults as result}
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex items-center gap-3">
                <span class={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                  {result.status}
                </span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {result.name}
                </span>
                {#if result.error}
                  <span class="text-sm text-red-600 dark:text-red-400">
                    - {result.error}
                  </span>
                {/if}
              </div>
              
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {formatTimestamp(result.timestamp)}
              </span>
            </div>
          {/each}
          
          <!-- Summary -->
          <div class="mt-4 p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-900 dark:text-white">Summary:</span>
              <div class="flex items-center gap-4 text-sm">
                <span class="text-green-600 dark:text-green-400">
                  ✅ {testResults.filter(r => r.status === 'PASSED').length} Passed
                </span>
                <span class="text-red-600 dark:text-red-400">
                  ❌ {testResults.filter(r => r.status === 'FAILED').length} Failed
                </span>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Test Data Display -->
    {#if testData.job || testData.candidates.length > 0 || testData.portfolioAnalysis}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Test Data</h2>
        
        <!-- Job Data -->
        {#if testData.job}
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Test Job Posting</h3>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 class="font-semibold text-gray-900 dark:text-white">{testData.job.title}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{testData.job.description}</p>
              <div class="flex flex-wrap gap-2 mt-3">
                {#each testData.job.requiredSkills as skill}
                  <span class="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs rounded">
                    {skill}
                  </span>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Candidates Data -->
        {#if testData.candidates.length > 0}
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Matched Candidates ({testData.candidates.length})
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {#each testData.candidates.slice(0, 4) as candidate}
                <CandidateCard 
                  {candidate}
                  onPay={handlePayCandidate}
                  onHire={() => console.log('Hire:', candidate.name)}
                  onEmail={() => console.log('Email:', candidate.name)}
                  onViewProfile={() => console.log('View profile:', candidate.name)}
                />
              {/each}
            </div>
          </div>
        {/if}

        <!-- Portfolio Analysis Data -->
        {#if testData.portfolioAnalysis}
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Portfolio Analysis</h3>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {testData.portfolioAnalysis.scores?.overall || 0}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Overall</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {testData.portfolioAnalysis.scores?.codeQuality || 0}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Code Quality</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {testData.portfolioAnalysis.scores?.projectDepth || 0}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Project Depth</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {testData.portfolioAnalysis.scores?.portfolioCompleteness || 0}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Completeness</div>
                </div>
              </div>
              
              {#if testData.portfolioAnalysis.improvements}
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-2">Improvements:</h4>
                  <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {#each testData.portfolioAnalysis.improvements.slice(0, 3) as improvement}
                      <li>• {improvement.suggestion}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Payment Modal -->
<PaymentModal
  isOpen={showPaymentModal}
  candidate={testData.selectedCandidate}
  jobId={testData.job?._id}
  onClose={() => { showPaymentModal = false; testData.selectedCandidate = null; }}
  onPaymentComplete={handlePaymentComplete}
/>