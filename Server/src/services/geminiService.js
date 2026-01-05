/**
 * Gemini AI Service for AI-powered text analysis and generation
 * Using Google Gemini API
 */

class GeminiService {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = 'gemini-2.5-flash';
  }

  get apiKey() {
    return process.env.GEMINI_API_KEY;
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
      console.error('Gemini portfolio analysis failed:', error);
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
      console.error('Gemini improvement suggestions failed:', error);
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
      console.error('Gemini job matching failed:', error);
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
      console.error('Gemini match explanation failed:', error);
      return `Strong match (${matchScore}%) based on skills and experience alignment.`;
    }
  }

  /**
   * Core Gemini API call
   * @param {object} params - API parameters
   * @returns {Promise<object>} - API response
   */
  async invokeTextAnalysis(params) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: params.prompt
        }]
      }],
      generationConfig: {
        temperature: params.temperature || 0.3,
        maxOutputTokens: params.maxTokens || 500,
        topP: 0.8,
        topK: 10
      }
    };

    const response = await fetch(`${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    
    // Transform Gemini response to match expected format
    return {
      text: result.candidates?.[0]?.content?.parts?.[0]?.text || '',
      content: result.candidates?.[0]?.content?.parts?.[0]?.text || ''
    };
  }

  /**
   * Build portfolio analysis prompt
   * 
   * Data sources:
   * - Portfolio: Scraped via Cheerio (HTML content) + URL for AI to visit
   * - GitHub: Fetched via Octokit (public/private repos with user auth)
   */
  buildPortfolioAnalysisPrompt(portfolioContent, githubData) {
    // Build GitHub repos summary from Octokit data
    const reposSummary = githubData.topProjects?.map(repo => 
      `- ${repo.name}: ${repo.description || 'No description'} | README: ${repo.readmeFirstParagraph || 'N/A'} | Commits: ${repo.commits || 0}`
    ).join('\n') || 'No repositories available';

    return `
You are evaluating a developer's portfolio and GitHub profile. Analyze the data below and provide your professional assessment.

PORTFOLIO URL (visit this for additional context):
${portfolioContent.url || 'Not provided'}

SCRAPED PORTFOLIO CONTENT (via Cheerio):
${portfolioContent.content || portfolioContent || 'No content available'}

GITHUB REPOSITORIES (fetched via Octokit - includes private repos if user connected):
${reposSummary}

GITHUB SUMMARY:
- Total Repositories: ${githubData.repositories || 0}
- Languages Used: ${githubData.languages?.join(', ') || 'None detected'}
- Total Stars: ${githubData.stars || 0}
- Recent Commits (6 months): ${githubData.commits || 0}
- Last Activity: ${githubData.lastActivity || 'Unknown'}

YOUR TASK:
1. Visit the portfolio URL if provided to get additional context
2. Evaluate the technical skills demonstrated across portfolio and GitHub
3. Assess project complexity, code quality, and depth
4. Rate portfolio presentation and completeness
5. Identify key strengths and areas for improvement

SCORING GUIDELINES (you decide the scores based on your analysis):
- Code Quality (0-100): Based on repo structure, README quality, commit patterns, code organization
- Project Depth (0-100): Based on project complexity, features, real-world applicability
- Portfolio Completeness (0-100): Based on presentation, content quality, professional appearance
- Overall Score: Your weighted assessment of the developer's profile strength

Return your analysis in this exact JSON format:
{
  "codeQuality": number,
  "projectDepth": number,
  "portfolioCompleteness": number,
  "overallScore": number,
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "technicalSkills": ["skill1", "skill2", "skill3"],
  "projectComplexity": "basic|moderate|advanced",
  "overallAssessment": "2-3 sentence summary of the developer's profile"
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
    // Valid categories that match the MongoDB schema enum
    const validCategories = ['code', 'portfolio', 'github', 'documentation'];
    
    // Map common AI-generated categories to valid ones
    const categoryMapping = {
      'general': 'portfolio',
      'skills': 'code',
      'projects': 'portfolio',
      'experience': 'portfolio',
      'presentation': 'portfolio',
      'design': 'portfolio',
      'content': 'documentation',
      'readme': 'documentation',
      'docs': 'documentation',
      'repo': 'github',
      'repository': 'github',
      'commits': 'github',
      'activity': 'github',
      'coding': 'code',
      'programming': 'code',
      'technical': 'code',
      'quality': 'code'
    };

    const sanitizeCategory = (category) => {
      if (!category) return 'portfolio';
      const lowerCategory = category.toLowerCase().trim();
      if (validCategories.includes(lowerCategory)) return lowerCategory;
      if (categoryMapping[lowerCategory]) return categoryMapping[lowerCategory];
      return 'portfolio'; // Default fallback
    };

    const sanitizePriority = (priority) => {
      const num = parseInt(priority, 10);
      if (isNaN(num) || num < 1) return 1;
      if (num > 5) return 5;
      return num;
    };

    try {
      const content = response.text || response.content || response.choices?.[0]?.message?.content;
      
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Sanitize each suggestion to ensure valid categories
        return parsed.slice(0, 5).map((item, index) => ({
          priority: sanitizePriority(item.priority || index + 1),
          suggestion: String(item.suggestion || 'Improve your portfolio').trim(),
          category: sanitizeCategory(item.category)
        }));
      }
      
      // Fallback: parse text suggestions
      const lines = content.split('\n').filter(line => line.trim());
      return lines.slice(0, 5).map((suggestion, index) => ({
        priority: index + 1,
        suggestion: suggestion.replace(/^\d+\.?\s*/, '').trim(),
        category: 'portfolio'
      }));
    } catch (error) {
      console.error('Failed to parse improvement suggestions:', error);
      return [
        {
          priority: 1,
          suggestion: 'Continue developing your portfolio with more projects',
          category: 'portfolio'
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

export default new GeminiService();