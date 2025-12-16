/**
 * Simple test to verify Gemini AI integration
 */

import dotenv from 'dotenv';
import geminiService from './src/services/geminiService.js';

// Load environment variables
dotenv.config();

console.log('GEMINI_API_KEY configured:', !!process.env.GEMINI_API_KEY);
console.log('API Key length:', process.env.GEMINI_API_KEY?.length || 0);

async function testGeminiIntegration() {
  console.log('Testing Gemini AI integration...');
  
  try {
    // Test basic text analysis
    const testPrompt = 'Analyze this simple portfolio: A developer with 2 years experience in JavaScript and React. Has 3 GitHub repositories with basic web projects.';
    
    const result = await geminiService.invokeTextAnalysis({
      prompt: testPrompt,
      maxTokens: 200,
      temperature: 0.3
    });
    
    console.log('✅ Gemini API connection successful!');
    console.log('Response:', result.text?.substring(0, 100) + '...');
    
    // Test portfolio analysis
    console.log('\nTesting portfolio analysis...');
    const portfolioResult = await geminiService.analyzePortfolioContent(
      'Simple portfolio with React projects',
      { repositories: 3, languages: ['JavaScript', 'React'], stars: 5 }
    );
    
    console.log('✅ Portfolio analysis successful!');
    console.log('Analysis result:', portfolioResult);
    
  } catch (error) {
    console.error('❌ Gemini integration test failed:', error.message);
    process.exit(1);
  }
}

testGeminiIntegration();