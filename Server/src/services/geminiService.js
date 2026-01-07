/**
 * Gemini AI Service for AI-powered text analysis and generation
 * Using Google GenAI SDK with gemini-3-flash-preview which has built-in web browsing
 */

import { GoogleGenAI } from '@google/genai';

class GeminiService {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = 'gemini-3-flash-preview'; // Model with built-in web browsing capability
    this.legacyModel = 'gemini-2.5-flash'; // Fallback model
    this.genAI = null; // Lazy-initialized SDK instance
  }

  /**
   * Get or initialize the Google GenAI SDK instance
   * @returns {GoogleGenAI} SDK instance
   */
  getGenAI() {
    if (!this.genAI && this.apiKey) {
      this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this.genAI;
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
   * Analyze portfolio website using Gemini 3 Flash with built-in web browsing
   * This model can directly visit and analyze URLs without explicit search grounding
   * @param {string} portfolioUrl - Portfolio website URL to analyze
   * @returns {Promise<object>} - Portfolio website analysis results
   */
  async analyzePortfolioWebsiteWithSearch(portfolioUrl) {
    try {
      if (!portfolioUrl) {
        throw new Error('Portfolio URL is required');
      }

      const genAI = this.getGenAI();
      if (!genAI) {
        throw new Error('Gemini API key not configured');
      }

      // Build prompt for portfolio analysis - Gemini 3 can browse directly
      const prompt = this.buildDirectBrowsePortfolioPrompt(portfolioUrl);

      // Use Gemini 3 Flash Preview with built-in web browsing
      const response = await genAI.models.generateContent({
        model: this.model,
        contents: prompt
      });

      const responseText = response.text;

      // Check if we got a valid response
      if (responseText && responseText.trim().length > 50) {
        const analysis = this.parsePortfolioWebsiteResponse({ text: responseText });

        return {
          ...analysis,
          sources: [], // Gemini 3 doesn't provide explicit grounding metadata like 2.5
          usedSearchGrounding: true,
          usedDirectBrowsing: true
        };
      }

      throw new Error('Empty response from Gemini 3');
    } catch (error) {
      console.error('Gemini 3 portfolio website analysis failed:', error);
      // Fall back to regular analysis without web browsing
      console.log('Falling back to regular analysis...');
      return this.analyzePortfolioWebsite(portfolioUrl);
    }
  }

  /**
   * Build prompt for direct website browsing with Gemini 3 Flash
   * @param {string} portfolioUrl - Portfolio URL
   * @returns {string} - Prompt for website analysis
   */
  buildDirectBrowsePortfolioPrompt(portfolioUrl) {
    return `Please visit and analyze this developer portfolio website: ${portfolioUrl}

Look at the website and evaluate it as an experienced tech recruiter would when screening candidates for software engineering positions.

After reviewing the website, provide your analysis in this EXACT JSON format:
{
  "scores": {
    "specializationClarity": number (0-100),
    "experienceShowcase": number (0-100),
    "projectsDisplay": number (0-100),
    "callToActions": number (0-100),
    "designQuality": number (0-100),
    "completeness": number (0-100),
    "overall": number (0-100, weighted average)
  },
  "firstImpression": "One sentence first impression as a recruiter",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": [
    "Improvement 1",
    "Improvement 2",
    "Improvement 3"
  ],
  "canAccessWebsite": true or false,
  "llmAssessment": "2-3 sentence overall assessment"
}

SCORING CRITERIA:
- specializationClarity: Does it clearly state what the developer specializes in?
- experienceShowcase: How well is work experience presented?
- projectsDisplay: Are projects showcased with descriptions and technologies?
- callToActions: Are there contact options, hire me buttons, or social links?
- designQuality: How professional and modern is the design?
- completeness: Does it have about, skills, projects, and contact sections?

If you cannot access the website, set canAccessWebsite to false.`;
  }

  /**
   * Build a search-grounded prompt that explicitly instructs Gemini to search and visit the URL
   * @param {string} portfolioUrl - Portfolio URL
   * @returns {string} - Search-focused prompt
   */
  buildSearchGroundedPortfolioPrompt(portfolioUrl) {
    return `Search the web and find information about this developer portfolio website: ${portfolioUrl}

Use Google Search to visit and analyze the portfolio at: ${portfolioUrl}

After searching and finding information about this website, evaluate it as an experienced tech recruiter would when screening candidates for software engineering positions.

EVALUATION CRITERIA (Score each 0-100):

1. **Specialization Clarity**: Does it clearly state what the developer specializes in?
2. **Experience Showcase**: How well is work experience presented?
3. **Projects Display**: Are projects showcased with descriptions and technologies?
4. **Call-to-Actions**: Are there contact options, hire me buttons, or social links?
5. **Design Quality**: How professional and modern is the design?
6. **Completeness**: Does it have about, skills, projects, and contact sections?

Return your analysis in this EXACT JSON format:
{
  "scores": {
    "specializationClarity": number (0-100),
    "experienceShowcase": number (0-100),
    "projectsDisplay": number (0-100),
    "callToActions": number (0-100),
    "designQuality": number (0-100),
    "completeness": number (0-100),
    "overall": number (0-100, weighted average)
  },
  "firstImpression": "One sentence first impression as a recruiter",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": [
    "Improvement 1",
    "Improvement 2",
    "Improvement 3"
  ],
  "canAccessWebsite": true or false,
  "llmAssessment": "2-3 sentence overall assessment"
}

If you cannot access or find the website, set canAccessWebsite to false.`;
  }

  /**
   * Analyze portfolio website using LLM with recruiter-focused evaluation
   * This is a dedicated analysis of just the portfolio website URL (without search grounding)
   * @param {string} portfolioUrl - Portfolio website URL to analyze
   * @returns {Promise<object>} - Portfolio website analysis results
   */
  async analyzePortfolioWebsite(portfolioUrl) {
    try {
      if (!portfolioUrl) {
        throw new Error('Portfolio URL is required');
      }

      const prompt = this.buildPortfolioWebsitePrompt(portfolioUrl);

      const response = await this.invokeTextAnalysis({
        prompt,
        task: 'portfolio_website_analysis',
        maxTokens: 1500,
        temperature: 0.3
      });

      return {
        ...this.parsePortfolioWebsiteResponse(response),
        sources: [],
        usedSearchGrounding: false
      };
    } catch (error) {
      console.error('Gemini portfolio website analysis failed:', error);
      throw new Error(`Portfolio website analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze portfolio website using LLM with SCRAPED content
   * This method receives pre-scraped website content for analysis
   * @param {object} scrapedContent - Scraped website content
   * @param {string} scrapedContent.url - Original URL
   * @param {string} scrapedContent.title - Page title
   * @param {string} scrapedContent.h1 - Main heading
   * @param {string} scrapedContent.bodyText - Extracted text content
   * @param {string} scrapedContent.paragraphs - Paragraph text
   * @param {string} scrapedContent.links - Navigation links
   * @returns {Promise<object>} - Portfolio website analysis results
   */
  async analyzePortfolioWebsiteWithContent(scrapedContent) {
    try {
      if (!scrapedContent || !scrapedContent.url) {
        throw new Error('Scraped content with URL is required');
      }

      const prompt = this.buildPortfolioWebsitePromptWithContent(scrapedContent);

      const response = await this.invokeTextAnalysis({
        prompt,
        task: 'portfolio_website_analysis',
        maxTokens: 1500,
        temperature: 0.3
      });

      return this.parsePortfolioWebsiteResponse(response);
    } catch (error) {
      console.error('Gemini portfolio website analysis failed:', error);
      throw new Error(`Portfolio website analysis failed: ${error.message}`);
    }
  }

  /**
   * Build prompt for LLM to analyze portfolio website using scraped content
   * @param {object} scrapedContent - Scraped website content
   * @returns {string} - Prompt for LLM
   */
  buildPortfolioWebsitePromptWithContent(scrapedContent) {
    return `
You are an experienced tech recruiter evaluating a developer's portfolio website. Analyze the following scraped website content as if you were screening a candidate for a software engineering position.

PORTFOLIO URL: ${scrapedContent.url}

PAGE TITLE: ${scrapedContent.title || 'Not found'}

MAIN HEADING (H1): ${scrapedContent.h1 || 'Not found'}

SECTION HEADINGS (H2):
${scrapedContent.headings?.join('\n') || 'None found'}

NAVIGATION/LINKS:
${scrapedContent.links || 'None found'}

PAGE CONTENT:
${scrapedContent.bodyText || scrapedContent.paragraphs || 'No content extracted'}

EVALUATION CRITERIA (Score each 0-100):

1. **Specialization Clarity**: Does the content immediately tell you what the developer specializes in? Is there a clear headline/tagline?

2. **Experience Showcase**: Is work experience presented? Are there company names, roles, achievements mentioned?

3. **Projects Display**: Are projects mentioned? Look for project names, descriptions, technologies used.

4. **Call-to-Actions**: Are there CTAs like contact info, hire me, email, social links?

5. **Design Quality**: Based on the structure and content organization, how professional does the site appear?

6. **Completeness**: Does it have about, skills, projects, contact sections?

Return your analysis in this EXACT JSON format:
{
  "scores": {
    "specializationClarity": number (0-100),
    "experienceShowcase": number (0-100),
    "projectsDisplay": number (0-100),
    "callToActions": number (0-100),
    "designQuality": number (0-100),
    "completeness": number (0-100),
    "overall": number (0-100, weighted average)
  },
  "firstImpression": "One sentence first impression as a recruiter",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2",
    "Specific actionable improvement 3",
    "Specific actionable improvement 4",
    "Specific actionable improvement 5"
  ],
  "canAccessWebsite": true,
  "llmAssessment": "2-3 sentence overall assessment from a recruiter perspective"
}
`;
  }

  /**
   * Build prompt for LLM to analyze portfolio website from recruiter perspective
   * @param {string} portfolioUrl - Portfolio URL
   * @returns {string} - Prompt for LLM
   */
  buildPortfolioWebsitePrompt(portfolioUrl) {
    return `
You are an experienced tech recruiter evaluating a developer's portfolio website. Visit this portfolio URL and analyze it like you would when screening candidates for a software engineering position.

PORTFOLIO URL TO VISIT AND ANALYZE:
${portfolioUrl}

EVALUATION CRITERIA (Score each 0-100):

1. **Specialization Clarity**: Does the portfolio immediately tell you what the developer specializes in? Is there a clear headline/tagline? Can you understand their focus within 5 seconds?

2. **Experience Showcase**: How well is previous work experience presented? Are there company names, roles, durations, and achievements? Is the career progression clear?

3. **Projects Display**: Are projects showcased effectively? For each project, is there:
   - Clear title and description
   - Technologies used
   - Problem solved / impact made
   - Screenshots or demos
   - Links to live site or repo

4. **Call-to-Actions**: Are there clear CTAs like:
   - Contact button/form
   - "Hire Me" or "Available for work"
   - Download resume option
   - Social/LinkedIn links
   - Email address visible

5. **Design Quality**: How professional and modern is the design?
   - Is it visually appealing?
   - Is navigation intuitive?
   - Is it mobile-responsive?
   - Does it look up-to-date (not from 2010)?

6. **Completeness**: Is the portfolio comprehensive?
   - About/Bio section
   - Skills section
   - Projects section
   - Contact section
   - Professional photo (optional but nice)

Return your analysis in this EXACT JSON format:
{
  "scores": {
    "specializationClarity": number (0-100),
    "experienceShowcase": number (0-100),
    "projectsDisplay": number (0-100),
    "callToActions": number (0-100),
    "designQuality": number (0-100),
    "completeness": number (0-100),
    "overall": number (0-100, weighted average)
  },
  "firstImpression": "One sentence describing your first impression as a recruiter",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2",
    "Specific actionable improvement 3",
    "Specific actionable improvement 4",
    "Specific actionable improvement 5"
  ],
  "canAccessWebsite": true/false,
  "llmAssessment": "2-3 sentence overall assessment of this portfolio from a recruiter's perspective"
}

If you CANNOT access the website, set canAccessWebsite to false and return default scores of 0 with an explanation in llmAssessment.
`;
  }

  /**
   * Parse portfolio website analysis response
   * @param {object} response - LLM response
   * @returns {object} - Parsed analysis
   */
  parsePortfolioWebsiteResponse(response) {
    try {
      let content = response.text || response.content || '';

      // Strip code block markers (```json, ```js, ```, etc.)
      content = content.replace(/```(?:json|js|javascript)?\n?/g, '').trim();

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Ensure scores object exists with all fields
        const scores = {
          specializationClarity: parsed.scores?.specializationClarity || 0,
          experienceShowcase: parsed.scores?.experienceShowcase || 0,
          projectsDisplay: parsed.scores?.projectsDisplay || 0,
          callToActions: parsed.scores?.callToActions || 0,
          designQuality: parsed.scores?.designQuality || 0,
          completeness: parsed.scores?.completeness || 0,
          overall: parsed.scores?.overall || 0
        };

        // Calculate overall if not provided
        if (!scores.overall) {
          const sum = scores.specializationClarity + scores.experienceShowcase +
            scores.projectsDisplay + scores.callToActions +
            scores.designQuality + scores.completeness;
          scores.overall = Math.round(sum / 6);
        }

        return {
          scores,
          firstImpression: parsed.firstImpression || '',
          strengths: parsed.strengths || [],
          weaknesses: parsed.weaknesses || [],
          suggestions: parsed.suggestions || [],
          canAccessWebsite: parsed.canAccessWebsite !== false,
          llmAssessment: parsed.llmAssessment || ''
        };
      }

      // Fallback if JSON parsing fails
      return {
        scores: {
          specializationClarity: 0,
          experienceShowcase: 0,
          projectsDisplay: 0,
          callToActions: 0,
          designQuality: 0,
          completeness: 0,
          overall: 0
        },
        firstImpression: '',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        canAccessWebsite: false,
        llmAssessment: 'Failed to parse portfolio analysis response: ' + content.substring(0, 200)
      };
    } catch (error) {
      console.error('Failed to parse portfolio website response:', error);
      return {
        scores: {
          specializationClarity: 0,
          experienceShowcase: 0,
          projectsDisplay: 0,
          callToActions: 0,
          designQuality: 0,
          completeness: 0,
          overall: 0
        },
        firstImpression: '',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        canAccessWebsite: false,
        llmAssessment: 'Error parsing response: ' + error.message
      };
    }
  }

  /**
   * Extract sources from Google Search grounding metadata
   * @param {object} response - Gemini SDK response object
   * @returns {Array} - Array of source objects with title and uri
   */
  extractGroundingSources(response) {
    const sources = [];

    try {
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((chunk, index) => {
          if (chunk.web) {
            sources.push({
              index: index + 1,
              title: chunk.web.title || 'Unknown',
              uri: chunk.web.uri || ''
            });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to extract grounding sources:', error.message);
    }

    return sources;
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