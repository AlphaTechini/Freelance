#!/usr/bin/env node

/**
 * Integration Test Script for MeritStack Platform
 * Tests end-to-end workflows to ensure all components are properly integrated
 */

import { apiService } from './frontend/src/lib/services/api.js';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Test configuration
const TEST_CONFIG = {
  recruiterEmail: 'test-recruiter@example.com',
  recruiterPassword: 'testpass123',
  candidateEmail: 'test-candidate@example.com',
  candidatePassword: 'testpass123',
  testJobData: {
    title: 'Senior Full Stack Developer',
    description: 'We are looking for an experienced full stack developer...',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    minExperience: 3,
    educationPreference: 'Graduate',
    roleType: 'Full-time',
    budget: { min: 80000, max: 120000, currency: 'USD' },
    location: 'Remote',
    maxCandidates: 10
  },
  testCandidateData: {
    name: 'John Doe',
    bio: 'Experienced full stack developer with 5 years of experience',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'],
    experienceYears: 5,
    educationLevel: 'graduate',
    university: 'MIT',
    major: 'Computer Science',
    portfolioUrl: 'https://johndoe.dev',
    githubUrl: 'https://github.com/johndoe',
    availability: 'Full-time'
  }
};

class IntegrationTester {
  constructor() {
    this.apiService = apiService;
    this.apiService.baseURL = API_BASE_URL;
    this.testResults = [];
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Running test: ${testName}`);
    try {
      await testFn();
      console.log(`✅ ${testName} - PASSED`);
      this.testResults.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      console.error(`❌ ${testName} - FAILED:`, error.message);
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  async testHealthCheck() {
    const response = await this.apiService.healthCheck();
    if (!response || response.status !== 'ok') {
      throw new Error('Health check failed');
    }
  }

  async testUserRegistration() {
    // Test recruiter registration
    const recruiterData = {
      username: 'test-recruiter',
      email: TEST_CONFIG.recruiterEmail,
      password: TEST_CONFIG.recruiterPassword,
      displayName: 'Test Recruiter',
      role: 'recruiter'
    };

    const recruiterResult = await this.apiService.registerUser(recruiterData);
    if (!recruiterResult.success) {
      throw new Error(`Recruiter registration failed: ${recruiterResult.message}`);
    }

    // Test candidate registration
    const candidateData = {
      username: 'test-candidate',
      email: TEST_CONFIG.candidateEmail,
      password: TEST_CONFIG.candidatePassword,
      displayName: 'Test Candidate',
      role: 'candidate'
    };

    const candidateResult = await this.apiService.registerUser(candidateData);
    if (!candidateResult.success) {
      throw new Error(`Candidate registration failed: ${candidateResult.message}`);
    }
  }

  async testJobPostingWorkflow() {
    // Create job posting
    const jobResult = await this.apiService.createJobPosting(TEST_CONFIG.testJobData);
    if (!jobResult.success) {
      throw new Error(`Job creation failed: ${jobResult.message}`);
    }

    const jobId = jobResult.job._id;

    // Get job details
    const jobDetails = await this.apiService.getJobById(jobId);
    if (!jobDetails.success) {
      throw new Error(`Failed to fetch job details: ${jobDetails.message}`);
    }

    // Generate shortlist
    const shortlistResult = await this.apiService.generateJobShortlist(jobId);
    if (!shortlistResult.success) {
      throw new Error(`Shortlist generation failed: ${shortlistResult.message}`);
    }

    return jobId;
  }

  async testCandidateProfileWorkflow() {
    // Create candidate profile
    const profileResult = await this.apiService.createCandidateProfile(TEST_CONFIG.testCandidateData);
    if (!profileResult.success) {
      throw new Error(`Candidate profile creation failed: ${profileResult.message}`);
    }

    // Get candidate profile
    const profile = await this.apiService.getCandidateProfile();
    if (!profile.success) {
      throw new Error(`Failed to fetch candidate profile: ${profile.message}`);
    }

    return profile.candidate._id;
  }

  async testPortfolioAnalysisWorkflow(candidateId) {
    // Trigger portfolio analysis
    const analysisResult = await this.apiService.analyzePortfolio(
      candidateId,
      TEST_CONFIG.testCandidateData.portfolioUrl,
      TEST_CONFIG.testCandidateData.githubUrl
    );

    if (!analysisResult.success) {
      throw new Error(`Portfolio analysis failed: ${analysisResult.message}`);
    }

    // Get analysis results
    const analysis = await this.apiService.getPortfolioAnalysis(candidateId);
    if (!analysis.success) {
      throw new Error(`Failed to fetch analysis results: ${analysis.message}`);
    }

    // Verify analysis has required fields
    const analysisData = analysis.analysis;
    if (!analysisData.scores || !analysisData.improvements) {
      throw new Error('Analysis missing required fields (scores or improvements)');
    }
  }

  async testHiringWorkflow(jobId, candidateId) {
    // Hire candidate
    const hireResult = await this.apiService.hireCandidate(jobId, candidateId, {
      sendEmail: false // Don't send actual emails in test
    });

    if (!hireResult.success) {
      throw new Error(`Hiring failed: ${hireResult.message}`);
    }

    // Get updated job candidates to verify status
    const candidates = await this.apiService.getJobCandidates(jobId);
    if (!candidates.success) {
      throw new Error(`Failed to fetch updated candidates: ${candidates.message}`);
    }

    const hiredCandidate = candidates.candidates.find(c => c._id === candidateId);
    if (!hiredCandidate || hiredCandidate.status !== 'hired') {
      throw new Error('Candidate status not updated to hired');
    }
  }

  async testPaymentWorkflow(candidateId, jobId) {
    // Send test payment
    const paymentData = {
      candidateId: candidateId,
      amount: 100,
      tokenType: 'USDC',
      jobId: jobId,
      purpose: 'test_payment'
    };

    const paymentResult = await this.apiService.sendPayment(paymentData);
    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.message}`);
    }

    // Check payment history
    const paymentHistory = await this.apiService.getPaymentHistory({ limit: 10 });
    if (!paymentHistory.success) {
      throw new Error(`Failed to fetch payment history: ${paymentHistory.message}`);
    }

    // Check candidate earnings
    const earnings = await this.apiService.getUserEarnings();
    if (!earnings.success) {
      throw new Error(`Failed to fetch earnings: ${earnings.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting MeritStack Integration Tests\n');
    console.log(`API Base URL: ${API_BASE_URL}`);

    let jobId, candidateId;

    await this.runTest('Health Check', () => this.testHealthCheck());
    
    await this.runTest('User Registration', () => this.testUserRegistration());
    
    await this.runTest('Job Posting Workflow', async () => {
      jobId = await this.testJobPostingWorkflow();
    });
    
    await this.runTest('Candidate Profile Workflow', async () => {
      candidateId = await this.testCandidateProfileWorkflow();
    });
    
    await this.runTest('Portfolio Analysis Workflow', () => 
      this.testPortfolioAnalysisWorkflow(candidateId)
    );
    
    await this.runTest('Hiring Workflow', () => 
      this.testHiringWorkflow(jobId, candidateId)
    );
    
    await this.runTest('Payment Workflow', () => 
      this.testPaymentWorkflow(candidateId, jobId)
    );

    this.printResults();
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('=' .repeat(50));
    console.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('🎉 All integration tests passed!');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please check the errors above.`);
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(error => {
    console.error('Integration test runner failed:', error);
    process.exit(1);
  });
}

export default IntegrationTester;