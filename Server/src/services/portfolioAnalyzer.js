import githubService from './githubService.js';
import githubRepoMetricsService from './githubRepoMetricsService.js';
import webScrapingService from './webScrapingService.js';
import geminiService from './geminiService.js';
import PortfolioAnalysis from '../models/PortfolioAnalysis.js';
import { Octokit } from '@octokit/rest';

class PortfolioAnalyzer {
  constructor() {
    this.analysisInProgress = new Map(); // Changed to Map to store timestamps
    this.ANALYSIS_TIMEOUT = 120000; // 2 minutes timeout
  }

  /**
   * Check if analysis is in progress (with timeout check)
   */
  isAnalysisInProgress(candidateId) {
    if (!this.analysisInProgress.has(candidateId)) {
      return false;
    }

    const startTime = this.analysisInProgress.get(candidateId);
    const elapsed = Date.now() - startTime;

    // If analysis has been running for more than timeout, consider it stale
    if (elapsed > this.ANALYSIS_TIMEOUT) {
      console.log(`Analysis for ${candidateId} timed out after ${elapsed}ms, clearing stale entry`);
      this.analysisInProgress.delete(candidateId);
      return false;
    }

    return true;
  }

  /**
   * Mark analysis as started
   */
  markAnalysisStarted(candidateId) {
    this.analysisInProgress.set(candidateId, Date.now());
  }

  /**
   * Mark analysis as completed
   */
  markAnalysisCompleted(candidateId) {
    this.analysisInProgress.delete(candidateId);
  }

  /**
   * Validate URLs before analysis (Requirement 11.2)
   * @param {string} portfolioUrl - Portfolio website URL
   * @param {string} githubUrl - GitHub profile URL
   * @returns {Promise<object>} - Validation results
   */
  async validateUrls(portfolioUrl, githubUrl) {
    const results = {
      portfolioValid: false,
      githubValid: false,
      errors: []
    };

    try {
      // Validate portfolio URL
      if (portfolioUrl) {
        results.portfolioValid = await webScrapingService.validateUrl(portfolioUrl);
        if (!results.portfolioValid) {
          results.errors.push('Portfolio URL is not accessible');
        }
      }

      // Validate GitHub URL
      if (githubUrl) {
        try {
          const { username } = githubService.parseGitHubUrl(githubUrl);
          if (username) {
            results.githubValid = true;
          }
        } catch (error) {
          results.errors.push('Invalid GitHub URL format');
        }
      }

      return results;
    } catch (error) {
      results.errors.push(`URL validation failed: ${error.message}`);
      return results;
    }
  }

  /**
   * Analyze portfolio URL using search grounding first, with web scraping as fallback
   * @param {string} portfolioUrl - Portfolio website URL
   * @returns {Promise<object>} - Analysis result with data and method used
   */
  async analyzePortfolioUrl(portfolioUrl) {
    if (!portfolioUrl) {
      return { data: null, method: 'none' };
    }

    // Try Gemini Search Grounding first (preferred method)
    try {
      console.log(`Analyzing portfolio with Google Search grounding: ${portfolioUrl}`);
      const searchResult = await geminiService.analyzePortfolioWebsiteWithSearch(portfolioUrl);

      if (searchResult && searchResult.canAccessWebsite && searchResult.scores?.overall > 0) {
        console.log('Search grounding successful');
        return {
          data: {
            url: portfolioUrl,
            title: searchResult.firstImpression || '',
            description: searchResult.llmAssessment || '',
            aiScores: searchResult.scores,
            strengths: searchResult.strengths || [],
            weaknesses: searchResult.weaknesses || [],
            suggestions: searchResult.suggestions || [],
            sources: searchResult.sources || [],
            usedSearchGrounding: true,
            // Provide minimal quality metrics for compatibility
            qualityMetrics: {
              qualityScore: searchResult.scores.overall || 0,
              hasViewportMeta: true, // Assume modern portfolio
              wordCount: 0,
              headings: 0,
              images: 0,
              sections: 0,
              links: 0
            }
          },
          method: 'search_grounding'
        };
      }
      console.log('Search grounding returned incomplete data, falling back to scraping');
    } catch (error) {
      console.warn(`Search grounding failed for ${portfolioUrl}:`, error.message);
    }

    // Fall back to web scraping
    try {
      console.log(`Falling back to web scraping for: ${portfolioUrl}`);
      const scrapedData = await webScrapingService.analyzePortfolio(portfolioUrl);
      return {
        data: scrapedData,
        method: 'scraping'
      };
    } catch (error) {
      console.error(`Web scraping also failed for ${portfolioUrl}:`, error.message);
      return {
        data: null,
        method: 'failed'
      };
    }
  }

  /**
   * Fetch enhanced repo metrics using the detailed metrics service
   * @param {string} username - GitHub username
   * @param {string[]} repoNames - Array of repository names
   * @returns {Promise<object|null>} - Enhanced metrics or null
   */
  async fetchEnhancedRepoMetrics(username, repoNames) {
    try {
      // Create Octokit instance (uses server token)
      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN || undefined
      });

      // Use the new repo metrics service with scoring
      const results = await githubRepoMetricsService.analyzeRepositoriesWithScoring(
        octokit,
        username,
        repoNames,
        { includeFull: false, includeSummary: true }
      );

      // Aggregate scores across repos
      if (results && results.length > 0) {
        const validResults = results.filter(r => !r.error);

        if (validResults.length === 0) return null;

        // Calculate aggregate scores
        const avgScores = {
          activity: 0,
          collaboration: 0,
          quality_signals: 0,
          documentation: 0,
          overall: 0
        };

        validResults.forEach(r => {
          avgScores.activity += r.scores?.activity || 0;
          avgScores.collaboration += r.scores?.collaboration || 0;
          avgScores.quality_signals += r.scores?.quality_signals || 0;
          avgScores.documentation += r.scores?.documentation || 0;
          avgScores.overall += r.scores?.overall || 0;
        });

        const count = validResults.length;
        Object.keys(avgScores).forEach(key => {
          avgScores[key] = Math.round((avgScores[key] / count) * 10) / 10;
        });

        // Collect all risk flags
        const allRiskFlags = validResults.flatMap(r => r.risk_flags || []);
        const allStrengths = validResults.flatMap(r => r.strengths || []);

        // Deduplicate and sort by severity
        const uniqueRiskFlags = [];
        const flagsSeen = new Set();
        allRiskFlags.forEach(flag => {
          const key = typeof flag === 'object' ? flag.flag : flag;
          if (!flagsSeen.has(key)) {
            flagsSeen.add(key);
            uniqueRiskFlags.push(flag);
          }
        });

        const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);

        return {
          reposAnalyzed: validResults.length,
          aggregateScores: avgScores,
          riskFlags: uniqueRiskFlags.slice(0, 5),
          strengths: uniqueStrengths,
          repoSummaries: validResults.slice(0, 5) // Keep top 5 for reference
        };
      }

      return null;
    } catch (error) {
      console.warn('Enhanced repo metrics failed:', error.message);
      return null;
    }
  }

  /**
   * Calculate code quality score based on GitHub data
   * @param {object} githubData - GitHub analysis results
   * @returns {number} - Code quality score (0-100)
   */
  calculateCodeQualityScore(githubData) {
    let score = 0;

    // Repository count (max 20 points)
    score += Math.min(githubData.repositories * 2, 20);

    // Stars received (max 15 points) - Note: per requirement, don't rely heavily on stars
    score += Math.min(githubData.stars * 0.3, 10);

    // Language diversity (max 15 points)
    score += Math.min((githubData.languages?.length || 0) * 3, 15);

    // Recent activity (max 20 points)
    if (githubData.lastActivity) {
      const daysSinceActivity = (Date.now() - new Date(githubData.lastActivity)) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < 30) score += 20;
      else if (daysSinceActivity < 90) score += 15;
      else if (daysSinceActivity < 180) score += 10;
      else score += 5;
    }

    // README quality (max 15 points)
    if (githubData.topProjects?.length > 0) {
      const readmeQualityScores = { excellent: 15, good: 10, poor: 5 };
      const avgReadmeScore = githubData.topProjects.reduce((sum, project) => {
        return sum + (readmeQualityScores[project.readmeQuality] || 0);
      }, 0) / Math.max(githubData.topProjects.length, 1);
      score += avgReadmeScore;
    }

    // Commit activity (max 15 points)
    score += Math.min((githubData.commits || 0) * 0.3, 15);

    // ENHANCED METRICS INTEGRATION
    // If we have enhanced metrics from the detailed repo analysis, blend them in
    if (githubData.enhancedMetrics?.aggregateScores) {
      const enhanced = githubData.enhancedMetrics.aggregateScores;

      // Convert 0-10 scores to 0-100 and blend (30% enhanced, 70% traditional)
      const enhancedQualityScore = enhanced.quality_signals * 10;
      score = Math.round(score * 0.7 + enhancedQualityScore * 0.3);

      // Apply risk flag penalties
      const riskFlags = githubData.enhancedMetrics.riskFlags || [];
      const gamingFlags = riskFlags.filter(f =>
        (typeof f === 'object' ? f.flag : f).startsWith('gaming:')
      );

      // Reduce score if gaming patterns detected
      if (gamingFlags.length > 0) {
        const highSeverity = gamingFlags.filter(f => f.severity === 'high').length;
        const mediumSeverity = gamingFlags.filter(f => f.severity === 'medium').length;
        score -= (highSeverity * 10 + mediumSeverity * 5);
      }

      // Boost score if strengths detected
      const strengths = githubData.enhancedMetrics.strengths || [];
      if (strengths.includes('tested_with_ci')) score += 5;
      if (strengths.includes('code_quality_tools')) score += 3;
    }

    return Math.max(0, Math.min(Math.round(score), 100));
  }

  /**
   * Calculate project depth score based on portfolio and GitHub data
   * @param {object} portfolioData - Portfolio analysis results
   * @param {object} githubData - GitHub analysis results
   * @returns {number} - Project depth score (0-100)
   */
  calculateProjectDepthScore(portfolioData, githubData) {
    let score = 0;

    // Portfolio projects (max 25 points)
    if (portfolioData.projects) {
      score += Math.min(portfolioData.projects.length * 5, 25);

      // Complexity bonus
      const complexProjects = portfolioData.projects.filter(p => p.complexity === 'complex').length;
      const moderateProjects = portfolioData.projects.filter(p => p.complexity === 'moderate').length;
      score += complexProjects * 3 + moderateProjects * 2;
    }

    // GitHub repository diversity (max 20 points)
    score += Math.min(githubData.repositories * 1.5, 20);

    // Technology stack diversity (max 20 points)
    const techCount = portfolioData.technologies ? portfolioData.technologies.length : 0;
    score += Math.min(techCount * 2, 20);

    // Deployed projects (max 20 points)
    if (portfolioData.hasDeployment) score += 20;
    const deployedProjects = portfolioData.projects ?
      portfolioData.projects.filter(p => p.deploymentUrl).length : 0;
    score += Math.min(deployedProjects * 5, 15);

    // GitHub stars as quality indicator (max 15 points)
    score += Math.min(githubData.stars * 0.3, 15);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Calculate portfolio completeness score
   * @param {object} portfolioData - Portfolio analysis results
   * @param {object} githubData - GitHub analysis results
   * @returns {number} - Portfolio completeness score (0-100)
   */
  calculatePortfolioCompletenessScore(portfolioData, githubData) {
    let score = 0;

    // Basic portfolio structure (max 30 points)
    if (portfolioData.title && portfolioData.title !== 'Untitled') score += 10;
    if (portfolioData.description && portfolioData.description.length > 50) score += 10;
    if (portfolioData.qualityMetrics && portfolioData.qualityMetrics.qualityScore > 50) score += 10;

    // Project documentation (max 25 points)
    if (portfolioData.projects && portfolioData.projects.length > 0) {
      score += 10;
      const wellDocumentedProjects = portfolioData.projects.filter(p =>
        p.description && p.description.length > 30
      ).length;
      score += Math.min(wellDocumentedProjects * 3, 15);
    }

    // GitHub profile completeness (max 25 points)
    if (githubData.topProjects && githubData.topProjects.length > 0) score += 10;
    const projectsWithReadme = githubData.topProjects.filter(p => p.hasReadme).length;
    score += Math.min(projectsWithReadme * 3, 15);

    // Professional presentation (max 20 points)
    if (portfolioData.qualityMetrics) {
      if (portfolioData.qualityMetrics.hasViewportMeta) score += 5;
      if (portfolioData.qualityMetrics.images > 0) score += 5;
      if (portfolioData.qualityMetrics.sections > 2) score += 5;
      if (portfolioData.qualityMetrics.wordCount > 200) score += 5;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Calculate portfolio website score based on URL analysis
   * This evaluates the portfolio website itself (design, structure, responsiveness, content)
   * @param {object} portfolioData - Portfolio analysis results from webScrapingService
   * @returns {number} - Portfolio website score (0-100)
   */
  calculatePortfolioWebsiteScore(portfolioData) {
    // If no portfolio data or no URL analyzed, return 0
    if (!portfolioData || !portfolioData.url) {
      return 0;
    }

    let score = 0;
    const qualityMetrics = portfolioData.qualityMetrics || {};

    // ===================
    // STRUCTURE & CONTENT (max 30 points)
    // ===================

    // Has proper title (max 5 points)
    if (portfolioData.title && portfolioData.title !== 'Untitled' && portfolioData.title.length > 3) {
      score += 5;
    }

    // Has description/about section (max 5 points)
    if (portfolioData.description && portfolioData.description.length > 50) {
      score += 5;
    } else if (portfolioData.description && portfolioData.description.length > 20) {
      score += 3;
    }

    // Word count indicates content depth (max 10 points)
    const wordCount = qualityMetrics.wordCount || 0;
    if (wordCount > 500) score += 10;
    else if (wordCount > 300) score += 7;
    else if (wordCount > 150) score += 4;
    else if (wordCount > 50) score += 2;

    // Heading structure (max 10 points)
    const headings = qualityMetrics.headings || 0;
    if (headings >= 5) score += 10;
    else if (headings >= 3) score += 7;
    else if (headings >= 1) score += 4;

    // ===================
    // VISUAL PRESENTATION (max 25 points)
    // ===================

    // Has images (max 10 points)
    const images = qualityMetrics.images || 0;
    if (images >= 5) score += 10;
    else if (images >= 3) score += 7;
    else if (images >= 1) score += 4;

    // Has sections/structured layout (max 10 points)
    const sections = qualityMetrics.sections || 0;
    if (sections >= 4) score += 10;
    else if (sections >= 2) score += 6;
    else if (sections >= 1) score += 3;

    // Has navigation links (max 5 points)
    const links = qualityMetrics.links || 0;
    if (links >= 10) score += 5;
    else if (links >= 5) score += 3;
    else if (links >= 2) score += 1;

    // ===================
    // TECHNICAL QUALITY (max 25 points)
    // ===================

    // Responsive design (viewport meta) (max 10 points)
    if (qualityMetrics.hasViewportMeta) score += 10;

    // Proper meta tags (max 10 points)
    const metaTagCount = qualityMetrics.metaTagCount || 0;
    if (metaTagCount >= 8) score += 10;
    else if (metaTagCount >= 5) score += 7;
    else if (metaTagCount >= 3) score += 4;

    // Website quality score from scraping (weighted, max 5 points)
    const scrapedQuality = qualityMetrics.qualityScore || 0;
    if (scrapedQuality >= 80) score += 5;
    else if (scrapedQuality >= 60) score += 3;
    else if (scrapedQuality >= 40) score += 2;

    // ===================
    // PROJECTS SHOWCASE (max 20 points)
    // ===================

    // Has projects listed (max 10 points)
    const projectCount = portfolioData.projects?.length || 0;
    if (projectCount >= 5) score += 10;
    else if (projectCount >= 3) score += 7;
    else if (projectCount >= 1) score += 4;

    // Projects have descriptions (max 5 points)
    const projectsWithDesc = portfolioData.projects?.filter(p => p.description && p.description.length > 20).length || 0;
    if (projectsWithDesc >= 3) score += 5;
    else if (projectsWithDesc >= 2) score += 3;
    else if (projectsWithDesc >= 1) score += 1;

    // Has deployed projects/live demos (max 5 points)
    if (portfolioData.hasDeployment) score += 5;

    // ===================
    // TECHNOLOGY SHOWCASE (bonus, uncapped contribution to score)
    // ===================

    // Technologies mentioned (bonus up to 5 points, won't exceed 100 total)
    const techCount = portfolioData.technologies?.length || 0;
    if (techCount >= 8) score += 5;
    else if (techCount >= 5) score += 3;
    else if (techCount >= 2) score += 1;

    return Math.max(0, Math.min(Math.round(score), 100));
  }

  /**
   * Sanitize improvements array to ensure valid categories for MongoDB schema
   * @param {Array} improvements - Raw improvements array
   * @returns {Array} - Sanitized improvements array
   */
  sanitizeImprovements(improvements) {
    const validCategories = ['code', 'portfolio', 'github', 'documentation'];
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

    if (!Array.isArray(improvements)) return [];

    return improvements.slice(0, 5).map((item, index) => {
      let category = String(item.category || 'portfolio').toLowerCase().trim();

      // Map to valid category
      if (!validCategories.includes(category)) {
        category = categoryMapping[category] || 'portfolio';
      }

      // Ensure priority is valid (1-5)
      let priority = parseInt(item.priority, 10);
      if (isNaN(priority) || priority < 1) priority = index + 1;
      if (priority > 5) priority = 5;

      return {
        priority,
        suggestion: String(item.suggestion || 'Improve your portfolio').trim().substring(0, 500),
        category
      };
    });
  }

  /**
   * Generate improvement suggestions using Gemini AI (Requirement 2.4)
   * @param {object} scores - Calculated scores
   * @param {object} portfolioData - Portfolio analysis results
   * @param {object} githubData - GitHub analysis results
   * @returns {Promise<Array>} - Array of AI-generated improvement suggestions
   */
  async generateImprovementSuggestions(scores, portfolioData, githubData) {
    let suggestions = [];

    try {
      // Try Gemini AI first for AI-powered suggestions
      const aiSuggestions = await geminiService.generateImprovementSuggestions(
        { portfolioData, githubData },
        scores
      );

      if (aiSuggestions && aiSuggestions.length > 0) {
        suggestions = aiSuggestions;
      }
    } catch (error) {
      console.warn('Gemini AI suggestions failed, falling back to rule-based:', error.message);
    }

    // Fallback to rule-based suggestions if AI failed
    if (suggestions.length === 0) {
      suggestions = this.generateRuleBasedSuggestions(scores, portfolioData, githubData);
    }

    // Always sanitize before returning to ensure valid schema
    return this.sanitizeImprovements(suggestions);
  }

  /**
   * Generate rule-based improvement suggestions (fallback)
   * @param {object} scores - Calculated scores
   * @param {object} portfolioData - Portfolio analysis results
   * @param {object} githubData - GitHub analysis results
   * @returns {Array} - Array of improvement suggestions
   */
  generateRuleBasedSuggestions(scores, portfolioData, githubData) {
    const suggestions = [];

    // Code quality improvements
    if (scores.codeQuality < 70) {
      if (githubData.commits < 20) {
        suggestions.push({
          priority: 1,
          suggestion: "Increase your GitHub activity by making regular commits to show consistent development work",
          category: "github"
        });
      }

      if (githubData.languages.length < 3) {
        suggestions.push({
          priority: 2,
          suggestion: "Learn and showcase projects in additional programming languages to demonstrate versatility",
          category: "code"
        });
      }

      const poorReadmeCount = githubData.topProjects.filter(p => p.readmeQuality === 'poor').length;
      if (poorReadmeCount > 2) {
        suggestions.push({
          priority: 1,
          suggestion: "Improve README files in your repositories with clear descriptions, setup instructions, and usage examples",
          category: "documentation"
        });
      }
    }

    // Project depth improvements
    if (scores.projectDepth < 70) {
      if (!portfolioData.hasDeployment) {
        suggestions.push({
          priority: 1,
          suggestion: "Deploy your projects to live URLs using platforms like Vercel, Netlify, or Heroku to showcase working applications",
          category: "portfolio"
        });
      }

      if (portfolioData.projects && portfolioData.projects.length < 3) {
        suggestions.push({
          priority: 2,
          suggestion: "Add more projects to your portfolio to demonstrate a broader range of skills and experience",
          category: "portfolio"
        });
      }

      const complexProjects = portfolioData.projects ?
        portfolioData.projects.filter(p => p.complexity === 'complex').length : 0;
      if (complexProjects === 0) {
        suggestions.push({
          priority: 2,
          suggestion: "Build more complex projects that showcase advanced features, database integration, or API usage",
          category: "code"
        });
      }
    }

    // Portfolio completeness improvements
    if (scores.portfolioCompleteness < 70) {
      if (!portfolioData.description || portfolioData.description.length < 50) {
        suggestions.push({
          priority: 1,
          suggestion: "Add a detailed personal bio and description of your skills and experience to your portfolio",
          category: "portfolio"
        });
      }

      if (portfolioData.qualityMetrics && portfolioData.qualityMetrics.qualityScore < 50) {
        suggestions.push({
          priority: 2,
          suggestion: "Improve your portfolio website design with better structure, navigation, and visual presentation",
          category: "portfolio"
        });
      }

      const projectsWithoutDescription = portfolioData.projects ?
        portfolioData.projects.filter(p => !p.description || p.description.length < 30).length : 0;
      if (projectsWithoutDescription > 1) {
        suggestions.push({
          priority: 2,
          suggestion: "Add detailed descriptions to your projects explaining the problem solved, technologies used, and your role",
          category: "documentation"
        });
      }
    }

    // General improvements
    if (githubData.stars < 5) {
      suggestions.push({
        priority: 3,
        suggestion: "Contribute to open-source projects or create projects that solve real problems to gain GitHub stars",
        category: "github"
      });
    }

    // Sort by priority and return top 5
    return suggestions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5);
  }

  /**
   * Perform complete portfolio analysis (Requirements 2.1, 2.2, 2.3)
   * @param {string} candidateId - Candidate identifier
   * @param {string} portfolioUrl - Portfolio website URL
   * @param {string} githubUrl - GitHub profile URL
   * @returns {Promise<object>} - Analysis results
   */
  async analyzePortfolio(candidateId, portfolioUrl = null, githubUrl = null) {
    // Check if analysis is already in progress (with timeout check)
    if (this.isAnalysisInProgress(candidateId)) {
      throw new Error('Analysis already in progress for this candidate');
    }

    this.markAnalysisStarted(candidateId);

    try {
      console.log(`Starting portfolio analysis for candidate: ${candidateId}`);

      // If no URLs provided, generate mock analysis
      if (!portfolioUrl && !githubUrl) {
        console.log('No URLs provided, generating mock analysis');
        return await this.generateMockAnalysis(candidateId);
      }
      // Validate URLs first (Requirement 11.2)
      const validation = await this.validateUrls(portfolioUrl, githubUrl);
      if (validation.errors.length > 0) {
        throw new Error(validation.errors.join('; '));
      }

      // Perform parallel analysis
      // GitHub analysis runs in parallel, Portfolio analysis uses search grounding first
      const [portfolioAnalysisResult, basicGithubData] = await Promise.all([
        portfolioUrl ? this.analyzePortfolioUrl(portfolioUrl) : { data: null, method: 'none' },
        githubUrl ? githubService.analyzeGitHubProfile(githubUrl) : null
      ]);

      let portfolioData = portfolioAnalysisResult.data;
      const portfolioAnalysisMethod = portfolioAnalysisResult.method;
      console.log(`Portfolio analyzed using: ${portfolioAnalysisMethod}`);

      // Enhance GitHub data with detailed repo metrics if we have repos
      let githubData = basicGithubData;
      let enhancedRepoMetrics = null;

      if (basicGithubData?.topProjects?.length > 0) {
        try {
          enhancedRepoMetrics = await this.fetchEnhancedRepoMetrics(
            basicGithubData.username || githubService.parseGitHubUrl(githubUrl).username,
            basicGithubData.topProjects.map(p => p.name).slice(0, 5) // Top 5 repos
          );

          // Merge enhanced metrics into githubData
          if (enhancedRepoMetrics) {
            githubData = {
              ...basicGithubData,
              enhancedMetrics: enhancedRepoMetrics
            };
          }
        } catch (error) {
          console.warn('Enhanced repo metrics failed, using basic data:', error.message);
        }
      }

      // Calculate scores using Gemini AI + traditional methods (Requirement 2.3)
      let scores = {
        codeQuality: githubData ? this.calculateCodeQualityScore(githubData) : 0,
        projectDepth: this.calculateProjectDepthScore(portfolioData || {}, githubData || {}),
        portfolioCompleteness: this.calculatePortfolioCompletenessScore(portfolioData || {}, githubData || {}),
        portfolioWebsite: 0
      };

      // If we have AI-generated scores from search grounding, use them directly
      if (portfolioData?.aiScores) {
        scores.portfolioWebsite = portfolioData.aiScores.overall || 0;
        // Store the detailed AI scores
        portfolioData.websiteAnalysis = portfolioData.aiScores;
      } else if (portfolioData) {
        // Fallback to traditional scoring
        scores.portfolioWebsite = this.calculatePortfolioWebsiteScore(portfolioData);
      }

      // Enhance scores with Gemini AI analysis (only if we have scraped content)
      try {
        if (portfolioData && portfolioData.content && portfolioAnalysisMethod === 'scraping') {
          const aiAnalysis = await geminiService.analyzePortfolioContent(
            portfolioData.content,
            githubData || {}
          );

          // Blend AI scores with traditional scores (70% AI, 30% traditional)
          if (aiAnalysis.codeQuality) {
            scores.codeQuality = Math.round(aiAnalysis.codeQuality * 0.7 + scores.codeQuality * 0.3);
          }
          if (aiAnalysis.projectDepth) {
            scores.projectDepth = Math.round(aiAnalysis.projectDepth * 0.7 + scores.projectDepth * 0.3);
          }
          if (aiAnalysis.portfolioCompleteness) {
            scores.portfolioCompleteness = Math.round(aiAnalysis.portfolioCompleteness * 0.7 + scores.portfolioCompleteness * 0.3);
          }

          // Store AI insights
          portfolioData.aiInsights = {
            keyStrengths: aiAnalysis.keyStrengths || [],
            technicalSkills: aiAnalysis.technicalSkills || [],
            projectComplexity: aiAnalysis.projectComplexity || 'moderate',
            overallAssessment: aiAnalysis.overallAssessment || ''
          };
        }
      } catch (error) {
        console.warn('Gemini AI analysis failed, using traditional scoring:', error.message);
      }

      // Calculate overall score (now includes portfolio website score)
      // If portfolio website was analyzed, include it in the average
      if (scores.portfolioWebsite > 0) {
        scores.overall = Math.round(
          (scores.codeQuality + scores.projectDepth + scores.portfolioCompleteness + scores.portfolioWebsite) / 4
        );
      } else {
        scores.overall = Math.round((scores.codeQuality + scores.projectDepth + scores.portfolioCompleteness) / 3);
      }

      // Generate improvement suggestions using Gemini AI (Requirement 2.4)
      const improvements = await this.generateImprovementSuggestions(scores, portfolioData || {}, githubData || {});

      // Create and save analysis with all required data
      const analysis = new PortfolioAnalysis({
        candidateId,
        portfolioUrl,
        githubUrl,
        scores,
        githubData: githubData || {},
        portfolioData: portfolioData || {},
        improvements,
        status: 'completed',
        analyzedAt: new Date()
      });

      await analysis.save();

      // Cleanup resources
      await webScrapingService.cleanup();

      return {
        analysisId: analysis._id,
        scores,
        githubData: githubData || {},
        portfolioData: portfolioData || {},
        improvements,
        analyzedAt: analysis.analyzedAt
      };

    } catch (error) {
      // Create failed analysis record
      try {
        const failedAnalysis = new PortfolioAnalysis({
          candidateId,
          portfolioUrl: portfolioUrl || '',
          githubUrl: githubUrl || '',
          scores: {
            overall: 0,
            codeQuality: 0,
            projectDepth: 0,
            portfolioCompleteness: 0,
            portfolioWebsite: 0
          },
          githubData: {},
          portfolioData: {},
          improvements: [],
          status: 'failed',
          error: error.message,
          analyzedAt: new Date()
        });
        await failedAnalysis.save();
      } catch (saveError) {
        console.error('Failed to save error state:', saveError);
      }

      throw error;
    } finally {
      this.markAnalysisCompleted(candidateId);
    }
  }

  /**
   * Get latest analysis for candidate
   * @param {string} candidateId - Candidate identifier
   * @returns {Promise<object|null>} - Latest analysis or null
   */
  async getLatestAnalysis(candidateId) {
    return await PortfolioAnalysis.findLatestForCandidate(candidateId);
  }

  /**
   * Get latest COMPLETED analysis for candidate (excludes failed ones)
   * @param {string} candidateId - Candidate identifier
   * @returns {Promise<object|null>} - Latest completed analysis or null
   */
  async getLatestCompletedAnalysis(candidateId) {
    return await PortfolioAnalysis.findOne({
      candidateId,
      status: 'completed'
    }).sort({ analyzedAt: -1 });
  }

  /**
   * Generate mock analysis when no analysis exists
   * @param {string} candidateId - Candidate identifier
   * @returns {Promise<object>} - Mock analysis results
   */
  async generateMockAnalysis(candidateId) {
    try {
      // Try to get candidate profile for context
      const CandidateProfile = (await import('../models/CandidateProfile.js')).default;
      const candidate = await CandidateProfile.findOne({
        $or: [
          { _id: candidateId },
          { userId: candidateId },
          { username: candidateId }
        ]
      });

      const skills = candidate?.skills || ['JavaScript', 'HTML', 'CSS'];
      const experience = candidate?.yearsOfExperience || 0;
      const educationLevel = candidate?.educationLevel || 'student';

      // Generate realistic scores based on profile
      const baseScore = Math.min(50 + (experience * 8) + (skills.length * 3), 85);
      const variance = 15; // Add some randomness

      const scores = {
        codeQuality: Math.max(30, Math.min(95, Math.round(baseScore + (Math.random() * variance - variance / 2)))),
        projectDepth: Math.max(25, Math.min(90, Math.round(baseScore + (Math.random() * variance - variance / 2)))),
        portfolioCompleteness: Math.max(20, Math.min(85, Math.round(baseScore + (Math.random() * variance - variance / 2)))),
        portfolioWebsite: 0, // No portfolio URL in mock analysis
        overall: 0
      };
      // Mock analysis doesn't have portfolio website, so use 3-score average
      scores.overall = Math.round((scores.codeQuality + scores.projectDepth + scores.portfolioCompleteness) / 3);

      // Generate mock data based on skills
      const portfolioData = {
        projects: skills.slice(0, 3).map((skill, index) => ({
          name: `${skill} Project ${index + 1}`,
          description: `A comprehensive project showcasing ${skill} development skills and modern best practices`,
          techStack: [skill, 'HTML', 'CSS', ...(index === 0 ? ['Node.js'] : [])],
          complexity: index === 0 ? 'complex' : (index === 1 ? 'moderate' : 'simple'),
          deploymentUrl: index < 2 ? `https://project-${index + 1}.vercel.app` : ''
        })),
        readmeQuality: scores.portfolioCompleteness > 70 ? 'excellent' : (scores.portfolioCompleteness > 50 ? 'good' : 'poor'),
        hasDeployedProjects: scores.projectDepth > 60
      };

      const githubData = {
        repositories: Math.max(1, Math.floor(experience * 3 + skills.length + Math.random() * 5)),
        stars: Math.floor(Math.random() * 15 + experience),
        commits: Math.max(10, Math.floor(experience * 40 + skills.length * 10 + Math.random() * 50)),
        languages: skills.slice(0, 5),
        lastActivity: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Within last 14 days
        topProjects: portfolioData.projects.map(project => ({
          name: project.name.toLowerCase().replace(/\s+/g, '-'),
          description: project.description,
          stars: Math.floor(Math.random() * 8),
          language: project.techStack[0],
          url: `https://github.com/user/${project.name.toLowerCase().replace(/\s+/g, '-')}`,
          hasReadme: Math.random() > 0.3
        }))
      };

      // Generate improvements based on scores
      const improvements = this.generateMockImprovements(scores, portfolioData, githubData);

      // Create and save analysis
      const analysis = new PortfolioAnalysis({
        candidateId,
        portfolioUrl: '',
        githubUrl: '',
        scores,
        portfolioData,
        githubData,
        improvements,
        status: 'completed',
        analyzedAt: new Date()
      });

      await analysis.save();
      console.log(`Mock portfolio analysis created for candidate: ${candidateId}`);
      return analysis;

    } catch (error) {
      console.error('Failed to generate mock analysis:', error);
      throw error;
    }
  }

  /**
   * Generate mock improvement suggestions
   * @param {object} scores - Calculated scores
   * @param {object} portfolioData - Portfolio data
   * @param {object} githubData - GitHub data
   * @returns {Array} - Array of improvement suggestions
   */
  generateMockImprovements(scores, portfolioData, githubData) {
    const improvements = [];

    if (scores.codeQuality < 80) {
      improvements.push({
        priority: 1,
        suggestion: "Enhance code quality by implementing comprehensive testing and following industry best practices",
        category: "code"
      });
    }

    if (scores.projectDepth < 75) {
      improvements.push({
        priority: 2,
        suggestion: "Build more complex projects that demonstrate advanced features like API integration, database management, or real-time functionality",
        category: "portfolio"
      });
    }

    if (scores.portfolioCompleteness < 70) {
      improvements.push({
        priority: 1,
        suggestion: "Complete your portfolio by adding detailed project descriptions, live demos, and comprehensive documentation",
        category: "portfolio"
      });
    }

    if (githubData.commits < 50) {
      improvements.push({
        priority: 2,
        suggestion: "Increase your GitHub activity with regular commits to demonstrate consistent development work and version control skills",
        category: "github"
      });
    }

    if (portfolioData.projects.length < 3) {
      improvements.push({
        priority: 3,
        suggestion: "Expand your project portfolio to showcase a diverse range of skills and technologies",
        category: "portfolio"
      });
    }

    // Return top 5 improvements
    return improvements.slice(0, 5);
  }

  /**
   * Get all analyses for candidate
   * @param {string} candidateId - Candidate identifier
   * @returns {Promise<Array>} - Array of analyses
   */
  async getAllAnalyses(candidateId) {
    return await PortfolioAnalysis.findAllForCandidate(candidateId);
  }
}

export default new PortfolioAnalyzer();