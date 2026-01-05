import githubService from './githubService.js';
import webScrapingService from './webScrapingService.js';
import geminiService from './geminiService.js';
import PortfolioAnalysis from '../models/PortfolioAnalysis.js';

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
   * Calculate code quality score based on GitHub data
   * @param {object} githubData - GitHub analysis results
   * @returns {number} - Code quality score (0-100)
   */
  calculateCodeQualityScore(githubData) {
    let score = 0;

    // Repository count (max 20 points)
    score += Math.min(githubData.repositories * 2, 20);

    // Stars received (max 15 points)
    score += Math.min(githubData.stars * 0.5, 15);

    // Language diversity (max 15 points)
    score += Math.min(githubData.languages.length * 3, 15);

    // Recent activity (max 20 points)
    if (githubData.lastActivity) {
      const daysSinceActivity = (Date.now() - new Date(githubData.lastActivity)) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < 30) score += 20;
      else if (daysSinceActivity < 90) score += 15;
      else if (daysSinceActivity < 180) score += 10;
      else score += 5;
    }

    // README quality (max 15 points)
    const readmeQualityScores = { excellent: 15, good: 10, poor: 5 };
    const avgReadmeScore = githubData.topProjects.reduce((sum, project) => {
      return sum + (readmeQualityScores[project.readmeQuality] || 0);
    }, 0) / Math.max(githubData.topProjects.length, 1);
    score += avgReadmeScore;

    // Commit activity (max 15 points)
    score += Math.min(githubData.commits * 0.3, 15);

    return Math.min(Math.round(score), 100);
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
      const [portfolioData, githubData] = await Promise.all([
        portfolioUrl ? webScrapingService.analyzePortfolio(portfolioUrl) : null,
        githubUrl ? githubService.analyzeGitHubProfile(githubUrl) : null
      ]);

      // Calculate scores using Gemini AI + traditional methods (Requirement 2.3)
      let scores = {
        codeQuality: githubData ? this.calculateCodeQualityScore(githubData) : 0,
        projectDepth: this.calculateProjectDepthScore(portfolioData || {}, githubData || {}),
        portfolioCompleteness: this.calculatePortfolioCompletenessScore(portfolioData || {}, githubData || {})
      };

      // Enhance scores with Gemini AI analysis
      try {
        if (portfolioData && portfolioData.content) {
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

      // Calculate overall score
      scores.overall = Math.round((scores.codeQuality + scores.projectDepth + scores.portfolioCompleteness) / 3);

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
            portfolioCompleteness: 0
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
        codeQuality: Math.max(30, Math.min(95, Math.round(baseScore + (Math.random() * variance - variance/2)))),
        projectDepth: Math.max(25, Math.min(90, Math.round(baseScore + (Math.random() * variance - variance/2)))),
        portfolioCompleteness: Math.max(20, Math.min(85, Math.round(baseScore + (Math.random() * variance - variance/2)))),
        overall: 0
      };
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