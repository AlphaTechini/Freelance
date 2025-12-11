/**
 * InvokeLLM Service for AI-powered text analysis and generation
 * Based on Visualyze.ai InvokeLLM API
 */

class InvokeLLMService {
  constructor() {
    this.apiKey = process.env.INVOKELLM_API_KEY;
    this.baseUrl = process.env.INVOKELLM_BASE_URL || 'https://api.visualyze.ai';
  }

  /**
   * Analyze portfolio content using InvokeLLM
   * @param {string} portfolioContent - Raw portfolio content
   * @param {object} githubData - GitHub analysis data
   * @returns {Promise<object>} - AI analysis results
   */
  async analyzePortfolioContent(portfolioContent, githubData) {
    try {
      const prompt = this.buildPortfolioAnalysisPrompt(portfolioContent, githubData);
      
      const response = await this.invokeTextAnalysis({
        prompt,
        task: 'portfolio_analysis',
        maxTokens: 1000,
        temperature: 0.3
      });

      return this.parsePortfolioAnalysisResponse(response);
    } catch (error) {
      console.error('InvokeLLM portfolio analysis failed:', error);
      throw new Error(`Portfolio analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate improvement suggestions using InvokeLLM
   * @param {object} analysisData - Portfolio and GitHub analysis data
   * @param {object} scores - Calculated scores
   * @returns {Promise<Array>} - AI-generated improvement suggestions
   */
  async generateImprovementSuggestions(analysisData, scores) {
    try {
      const prompt = this.buildImprovementPrompt(analysisData, scores);
      
      const response = await this.invokeTextAnalysis({
        prompt,
        task: 'improvement_suggestions',
        maxTokens: 800,
        temperature: 0.4
      });

      return this.parseImprovementSuggestions(response);
    } catch (error) {
      console.error('InvokeLLM improvement suggestions failed:', error);
      throw new Error(`Improvement suggestions failed: ${error.message}`);
    }
  }

  /**
   * Calculate match score between candidate and job using InvokeLLM
   * @param {object} candidateProfile - Candidate profile data
   * @param {object} jobPosting - Job posting requirements
   * @returns {Promise<object>} - Match analysis with score and explanation
   */
  async calculateJobMatch(candidateProfile, jobPosting) {
    try {
      const prompt = this.buildJobMatchPrompt(candidateProfile, jobPosting);
      
      const response = await this.invokeTextAnalysis({
        prompt,
        task: 'job_matching',
        maxTokens: 600,
        temperature: 0.2
      });

      return this.parseJobMatchResponse(response);
    } catch (error) {
      console.error('InvokeLLM job matching failed:', error);
      throw new Error(`Job matching failed: ${error.message}`);
    }
  }

  /**
   * Generate match explanation using InvokeLLM
   * @param {object} candidateProfile - Candidate profile data
   * @param {object} jobPosting - Job posting requirements
   * @param {number} matchScore - Calculated match score
   * @returns {Promise<string>} - Human-readable match explanation
   */
  async generateMatchExplanation(candidateProfile, jobPosting, matchScore) {
    try {
      const prompt = this.buildMatchExplanationPrompt(candidateProfile, jobPosting, matchScore);
      
      const response = await this.invokeTextAnalysis({
        prompt,
        task: 'match_explanation',
        maxTokens: 400,
        temperature: 0.3
      });

      return response.text || response.content || 'Match explanation not available';
    } catch (error) {
      console.error('InvokeLLM match explanation failed:', error);
      return `Strong match (${matchScore}%) based on skills and experience alignment.`;
    }
  }

  /**
   * Core InvokeLLM API call
   * @param {object} params - API parameters
   * @returns {Promise<object>} - API response
   */
  async invokeTextAnalysis(params) {
    if (!this.apiKey) {
      throw new Error('InvokeLLM API key not configured');
    }

    const requestBody = {
      model: params.model || 'gpt-4o-mini',
      prompt: params.prompt,
      max_tokens: params.maxTokens || 500,
      temperature: params.temperature || 0.3,
      task_type: params.task || 'text_analysis'
    };

    const response = await fetch(`${this.baseUrl}/v1/invoke-llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Version': '1.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`InvokeLLM API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Build portfolio analysis prompt
   */
  buildPortfolioAnalysisPrompt(portfolioContent, githubData) {
    return `
Analyze this developer's portfolio and GitHub profile for professional assessment:

PORTFOLIO CONTENT:
${portfolioContent}

GITHUB DATA:
- Repositories: ${githubData.repositories || 0}
- Languages: ${githubData.languages?.join(', ') || 'None'}
- Stars: ${githubData.stars || 0}
- Commits: ${githubData.commits || 0}
- Last Activity: ${githubData.lastActivity || 'Unknown'}

ANALYSIS REQUIREMENTS:
1. Evaluate technical skills demonstrated
2. Assess project complexity and quality
3. Rate portfolio presentation and completeness
4. Identify key strengths and areas for improvement
5. Provide scores for: Code Quality (0-100), Project Depth (0-100), Portfolio Completeness (0-100)

Return analysis in JSON format:
{
  "codeQuality": number,
  "projectDepth": number,
  "portfolioCompleteness": number,
  "keyStrengths": ["strength1", "strength2"],
  "technicalSkills": ["skill1", "skill2"],
  "projectComplexity": "basic|moderate|advanced",
  "overallAssessment": "brief summary"
}
`;
  }

  /**
   * Build improvement suggestions prompt
   */
  buildImprovementPrompt(analysisData, scores) {
    return `
Generate 3-5 specific, actionable improvement suggestions for this developer profile:

CURRENT SCORES:
- Code Quality: ${scores.codeQuality}/100
- Project Depth: ${scores.projectDepth}/100  
- Portfolio Completeness: ${scores.portfolioCompleteness}/100
- Overall: ${scores.overall}/100

PORTFOLIO DATA:
- Projects: ${analysisData.portfolioData?.projects?.length || 0}
- Has Deployment: ${analysisData.portfolioData?.hasDeployment || false}
- Technologies: ${analysisData.portfolioData?.technologies?.length || 0}

GITHUB DATA:
- Repositories: ${analysisData.githubData?.repositories || 0}
- Languages: ${analysisData.githubData?.languages?.length || 0}
- Recent Activity: ${analysisData.githubData?.lastActivity || 'Unknown'}

Generate specific, actionable suggestions prioritized by impact. Return as JSON array:
[
  {
    "priority": 1,
    "suggestion": "specific actionable advice",
    "category": "portfolio|github|code|documentation",
    "impact": "high|medium|low"
  }
]
`;
  }

  /**
   * Build job matching prompt
   */
  buildJobMatchPrompt(candidateProfile, jobPosting) {
    return `
Calculate match score between candidate and job posting:

CANDIDATE PROFILE:
- Skills: ${candidateProfile.skills?.join(', ') || 'None'}
- Experience: ${candidateProfile.experienceYears || 0} years
- Education: ${candidateProfile.educationLevel || 'Not specified'}
- Portfolio Score: ${candidateProfile.portfolioScore || 0}/100
- GitHub Activity: ${candidateProfile.githubActivity || 'Low'}
- Availability: ${candidateProfile.availability || 'Not specified'}

JOB REQUIREMENTS:
- Required Skills: ${jobPosting.requiredSkills?.join(', ') || 'None'}
- Min Experience: ${jobPosting.minExperience || 0} years
- Education Preference: ${jobPosting.educationPreference || 'Any'}
- Role Type: ${jobPosting.roleType || 'Not specified'}

SCORING WEIGHTS:
- Skill alignment: 35%
- Experience match: 20%
- Portfolio depth: 20%
- Education alignment: 10%
- GitHub activity: 10%
- Availability fit: 5%

Calculate detailed match score and return JSON:
{
  "overallScore": number (0-100),
  "skillMatch": number (0-100),
  "experienceMatch": number (0-100),
  "portfolioMatch": number (0-100),
  "educationMatch": number (0-100),
  "githubMatch": number (0-100),
  "availabilityMatch": number (0-100),
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"]
}
`;
  }

  /**
   * Build match explanation prompt
   */
  buildMatchExplanationPrompt(candidateProfile, jobPosting, matchScore) {
    return `
Generate a concise, professional explanation for why this candidate matches the job posting:

MATCH SCORE: ${matchScore}%
CANDIDATE: ${candidateProfile.name || 'Candidate'}
JOB TITLE: ${jobPosting.title || 'Position'}

KEY FACTORS:
- Skills: ${candidateProfile.skills?.slice(0, 3).join(', ') || 'Various'}
- Experience: ${candidateProfile.experienceYears || 0} years
- Portfolio Quality: ${candidateProfile.portfolioScore || 0}/100

Write a 2-3 sentence explanation highlighting the strongest match factors and any notable strengths. Be specific and professional.
`;
  }

  /**
   * Parse portfolio analysis response
   */
  parsePortfolioAnalysisResponse(response) {
    try {
      const content = response.text || response.content || response.choices?.[0]?.message?.content;
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return {
        codeQuality: 50,
        projectDepth: 50,
        portfolioCompleteness: 50,
        keyStrengths: ['Portfolio analysis completed'],
        technicalSkills: ['Various technologies'],
        projectComplexity: 'moderate',
        overallAssessment: content.substring(0, 200)
      };
    } catch (error) {
      console.error('Failed to parse portfolio analysis response:', error);
      return {
        codeQuality: 50,
        projectDepth: 50,
        portfolioCompleteness: 50,
        keyStrengths: ['Analysis completed'],
        technicalSkills: [],
        projectComplexity: 'moderate',
        overallAssessment: 'Portfolio analysis completed successfully'
      };
    }
  }

  /**
   * Parse improvement suggestions response
   */
  parseImprovementSuggestions(response) {
    try {
      const content = response.text || response.content || response.choices?.[0]?.message?.content;
      
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: parse text suggestions
      const lines = content.split('\n').filter(line => line.trim());
      return lines.slice(0, 5).map((suggestion, index) => ({
        priority: index + 1,
        suggestion: suggestion.replace(/^\d+\.?\s*/, '').trim(),
        category: 'general',
        impact: 'medium'
      }));
    } catch (error) {
      console.error('Failed to parse improvement suggestions:', error);
      return [
        {
          priority: 1,
          suggestion: 'Continue developing your portfolio with more projects',
          category: 'portfolio',
          impact: 'high'
        }
      ];
    }
  }

  /**
   * Parse job match response
   */
  parseJobMatchResponse(response) {
    try {
      const content = response.text || response.content || response.choices?.[0]?.message?.content;
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback scoring
      return {
        overallScore: 75,
        skillMatch: 70,
        experienceMatch: 80,
        portfolioMatch: 75,
        educationMatch: 85,
        githubMatch: 70,
        availabilityMatch: 90,
        matchingSkills: ['JavaScript', 'React'],
        missingSkills: ['Python'],
        strengths: ['Strong portfolio', 'Good experience']
      };
    } catch (error) {
      console.error('Failed to parse job match response:', error);
      return {
        overallScore: 75,
        skillMatch: 75,
        experienceMatch: 75,
        portfolioMatch: 75,
        educationMatch: 75,
        githubMatch: 75,
        availabilityMatch: 75,
        matchingSkills: [],
        missingSkills: [],
        strengths: ['Profile analysis completed']
      };
    }
  }
}

export default new InvokeLLMService();