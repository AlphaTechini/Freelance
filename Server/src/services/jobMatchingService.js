/**
 * AI-powered job matching service using Gemini AI
 * Implements intelligent candidate ranking and match explanations
 */

import geminiService from './geminiService.js';
import CandidateProfile from '../models/CandidateProfile.js';
import PortfolioAnalysis from '../models/PortfolioAnalysis.js';

class JobMatchingService {
  constructor() {
    this.matchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate candidate shortlist for job posting (Requirement 4.1, 4.2)
   * @param {object} jobPosting - Job posting with requirements
   * @param {number} maxCandidates - Maximum candidates to return
   * @returns {Promise<Array>} - Ranked list of candidates with match scores
   */
  async generateShortlist(jobPosting, maxCandidates = 10) {
    try {
      // Get all eligible candidates
      const candidates = await this.getEligibleCandidates(jobPosting);
      
      if (candidates.length === 0) {
        return [];
      }

      // Calculate match scores for all candidates using weighted algorithm
      const candidatesWithScores = await Promise.all(
        candidates.map(async (candidate) => {
          try {
            const matchResult = await this.calculateDetailedMatchScore(candidate, jobPosting);
            return {
              ...candidate.toObject(),
              matchScore: matchResult.overallScore,
              matchDetails: matchResult,
              matchExplanation: matchResult.explanation || `${matchResult.overallScore}% match based on weighted analysis`
            };
          } catch (error) {
            console.error(`Match calculation failed for candidate ${candidate._id}:`, error);
            // Fallback to basic scoring
            const basicScore = this.calculateBasicMatchScore(candidate, jobPosting);
            return {
              ...candidate.toObject(),
              matchScore: basicScore,
              matchDetails: { 
                overallScore: basicScore,
                breakdown: {
                  skillMatch: basicScore,
                  experienceMatch: basicScore,
                  portfolioDepth: 50,
                  educationAlignment: 75,
                  githubActivity: 50,
                  availabilityFit: 75
                }
              },
              matchExplanation: `${basicScore}% match based on skills and experience`
            };
          }
        })
      );

      // Sort by match score (highest first) and return top candidates
      return candidatesWithScores
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, maxCandidates);

    } catch (error) {
      console.error('Shortlist generation failed:', error);
      throw new Error(`Failed to generate candidate shortlist: ${error.message}`);
    }
  }

  /**
   * Calculate detailed match score using weighted algorithm (Requirements 4.2, 11.3)
   * @param {object} candidate - Candidate profile
   * @param {object} jobPosting - Job posting requirements
   * @returns {Promise<object>} - Detailed match analysis
   */
  async calculateDetailedMatchScore(candidate, jobPosting) {
    const cacheKey = `${candidate._id}-${jobPosting._id}`;
    
    // Check cache first
    if (this.matchCache.has(cacheKey)) {
      const cached = this.matchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Get candidate's portfolio analysis
      const portfolioAnalysis = await PortfolioAnalysis.findLatestForCandidate(candidate._id);
      
      // Prepare candidate profile for matching
      const candidateProfile = {
        name: candidate.name,
        skills: candidate.skills || [],
        experienceYears: candidate.experienceYears || 0,
        educationLevel: candidate.educationLevel || 'Not specified',
        portfolioScore: portfolioAnalysis?.scores?.overall || 0,
        availability: candidate.availability || 'Not specified',
        portfolioData: portfolioAnalysis?.portfolioData || {},
        githubData: portfolioAnalysis?.githubData || {}
      };

      // Use the new weighted algorithm (Requirements 4.2)
      const matchResult = this.calculateMatchScore(candidateProfile, jobPosting);
      
      // Try to enhance with AI explanation if available
      let explanation;
      try {
        explanation = await geminiService.generateMatchExplanation(candidateProfile, jobPosting, matchResult.overallScore);
      } catch (error) {
        console.warn('AI explanation failed, using basic explanation:', error);
        explanation = this.generateBasicExplanation(candidate, jobPosting, matchResult.overallScore);
      }

      const result = {
        ...matchResult,
        explanation,
        candidateId: candidate._id,
        jobId: jobPosting._id,
        calculatedAt: new Date()
      };

      // Cache the result
      this.matchCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Match calculation failed:', error);
      
      // Fallback to basic scoring
      const candidateProfile = {
        skills: candidate.skills || [],
        experienceYears: candidate.experienceYears || 0,
        educationLevel: candidate.educationLevel || 'Not specified',
        portfolioScore: 50, // Default score
        availability: candidate.availability || 'Available',
        githubData: {}
      };

      const fallbackResult = this.calculateMatchScore(candidateProfile, jobPosting);
      
      return {
        ...fallbackResult,
        explanation: this.generateBasicExplanation(candidate, jobPosting, fallbackResult.overallScore),
        candidateId: candidate._id,
        jobId: jobPosting._id,
        calculatedAt: new Date(),
        fallback: true
      };
    }
  }

  /**
   * Generate human-readable match explanation using Gemini AI
   * @param {object} candidate - Candidate profile
   * @param {object} jobPosting - Job posting
   * @param {number} matchScore - Calculated match score
   * @returns {Promise<string>} - Match explanation
   */
  async generateMatchExplanation(candidate, jobPosting, matchScore) {
    try {
      const candidateProfile = {
        name: candidate.name,
        skills: candidate.skills || [],
        experienceYears: candidate.experienceYears || 0,
        portfolioScore: 75 // Default for explanation
      };

      return await geminiService.generateMatchExplanation(candidateProfile, jobPosting, matchScore);
    } catch (error) {
      console.error('Match explanation generation failed:', error);
      return this.generateBasicExplanation(candidate, jobPosting, matchScore);
    }
  }

  /**
   * Get eligible candidates based on basic filters
   * @param {object} jobPosting - Job posting requirements
   * @returns {Promise<Array>} - Array of eligible candidates
   */
  async getEligibleCandidates(jobPosting) {
    const query = {
      role: { $in: ['freelancer', 'student', 'graduate', 'phd'] },
      isActive: true
    };

    // Add basic filters
    if (jobPosting.minExperience && jobPosting.minExperience > 0) {
      query.experienceYears = { $gte: jobPosting.minExperience };
    }

    if (jobPosting.educationPreference && jobPosting.educationPreference !== 'Any') {
      query.educationLevel = jobPosting.educationPreference;
    }

    return await CandidateProfile.find(query).limit(50); // Limit for performance
  }

  /**
   * Calculate match score using weighted formula (Requirements 4.2)
   * Implements the exact algorithm specified in the task:
   * - Skill alignment (35%)
   * - Experience match (20%)
   * - Portfolio depth (20%)
   * - Education alignment (10%)
   * - GitHub activity (10%)
   * - Availability fit (5%)
   * @param {object} candidateProfile - Candidate profile data
   * @param {object} jobPosting - Job posting requirements
   * @returns {object} - Detailed match analysis with breakdown
   */
  calculateMatchScore(candidateProfile, jobPosting) {
    // Calculate individual component scores
    const skillMatch = this.calculateSkillAlignment(candidateProfile.skills || [], jobPosting.requiredSkills || []);
    const experienceMatch = this.calculateExperienceMatch(candidateProfile.experienceYears || 0, jobPosting.minExperience || 0);
    const portfolioDepth = Math.min(candidateProfile.portfolioScore || 0, 100);
    const educationAlignment = this.calculateEducationMatch(candidateProfile.educationLevel, jobPosting.educationPreference);
    const githubActivity = this.calculateGitHubActivityScore(candidateProfile.githubData || {});
    const availabilityFit = this.calculateAvailabilityMatch(candidateProfile.availability, jobPosting.roleType);

    // Apply weighted formula (Requirements 4.2)
    const weightedScore = 
      (skillMatch * 0.35) +           // 35%
      (experienceMatch * 0.20) +      // 20%
      (portfolioDepth * 0.20) +       // 20%
      (educationAlignment * 0.10) +   // 10%
      (githubActivity * 0.10) +       // 10%
      (availabilityFit * 0.05);       // 5%

    const overallScore = Math.round(Math.min(weightedScore, 100));

    // Generate match details
    const matchingSkills = this.findMatchingSkills(candidateProfile.skills || [], jobPosting.requiredSkills || []);
    const missingSkills = this.findMissingSkills(candidateProfile.skills || [], jobPosting.requiredSkills || []);
    const strengths = this.identifyStrengths(candidateProfile, jobPosting, {
      skillMatch,
      experienceMatch,
      portfolioDepth,
      educationAlignment,
      githubActivity,
      availabilityFit
    });

    return {
      overallScore,
      breakdown: {
        skillMatch: Math.round(skillMatch),
        experienceMatch: Math.round(experienceMatch),
        portfolioDepth: Math.round(portfolioDepth),
        educationAlignment: Math.round(educationAlignment),
        githubActivity: Math.round(githubActivity),
        availabilityFit: Math.round(availabilityFit)
      },
      matchingSkills,
      missingSkills,
      strengths,
      weights: {
        skillMatch: 35,
        experienceMatch: 20,
        portfolioDepth: 20,
        educationAlignment: 10,
        githubActivity: 10,
        availabilityFit: 5
      }
    };
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use calculateMatchScore instead
   */
  calculateTraditionalMatchScore(candidateProfile, jobPosting) {
    const result = this.calculateMatchScore(candidateProfile, jobPosting);
    return result.overallScore;
  }

  /**
   * Calculate basic match score (simple fallback)
   */
  calculateBasicMatchScore(candidate, jobPosting) {
    const candidateSkills = candidate.skills || [];
    const requiredSkills = jobPosting.requiredSkills || [];
    
    if (requiredSkills.length === 0) return 75; // Default score if no requirements
    
    const matchingSkills = candidateSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const skillMatchPercentage = (matchingSkills.length / requiredSkills.length) * 100;
    return Math.min(Math.round(skillMatchPercentage), 100);
  }

  /**
   * Calculate skill alignment percentage
   */
  calculateSkillAlignment(candidateSkills, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) return 100;
    if (!candidateSkills || candidateSkills.length === 0) return 0;

    const matchingSkills = this.findMatchingSkills(candidateSkills, requiredSkills);
    return Math.min((matchingSkills.length / requiredSkills.length) * 100, 100);
  }

  /**
   * Calculate experience match percentage
   */
  calculateExperienceMatch(candidateYears, requiredYears) {
    if (requiredYears === 0) return 100;
    if (candidateYears >= requiredYears) return 100;
    
    // Partial credit for close matches
    const ratio = candidateYears / requiredYears;
    return Math.max(ratio * 80, 0); // Max 80% for partial matches
  }

  /**
   * Calculate education match percentage
   */
  calculateEducationMatch(candidateEducation, preferredEducation) {
    if (!preferredEducation || preferredEducation === 'Any') return 100;
    
    const educationLevels = {
      'Student': 1,
      'Graduate': 2,
      'PhD': 3
    };

    const candidateLevel = educationLevels[candidateEducation] || 1;
    const preferredLevel = educationLevels[preferredEducation] || 1;

    if (candidateLevel >= preferredLevel) return 100;
    return Math.max((candidateLevel / preferredLevel) * 70, 30);
  }

  /**
   * Calculate GitHub activity score based on actual data (Requirements 4.2)
   * @param {object} githubData - GitHub data from portfolio analysis
   * @returns {number} - GitHub activity score (0-100)
   */
  calculateGitHubActivityScore(githubData) {
    if (!githubData || Object.keys(githubData).length === 0) {
      return 25; // Low score for no GitHub data
    }

    let score = 0;
    const weights = {
      commits: 0.4,      // 40% weight for commit activity
      repositories: 0.3, // 30% weight for repository count
      stars: 0.2,        // 20% weight for stars received
      recency: 0.1       // 10% weight for recent activity
    };

    // Commit activity score (0-100)
    const commits = githubData.commits || 0;
    let commitScore = 0;
    if (commits >= 500) commitScore = 100;
    else if (commits >= 200) commitScore = 80;
    else if (commits >= 100) commitScore = 60;
    else if (commits >= 50) commitScore = 40;
    else if (commits >= 10) commitScore = 20;
    else commitScore = 0;

    // Repository count score (0-100)
    const repos = githubData.repositories || 0;
    let repoScore = 0;
    if (repos >= 20) repoScore = 100;
    else if (repos >= 10) repoScore = 80;
    else if (repos >= 5) repoScore = 60;
    else if (repos >= 3) repoScore = 40;
    else if (repos >= 1) repoScore = 20;
    else repoScore = 0;

    // Stars received score (0-100)
    const stars = githubData.stars || 0;
    let starScore = 0;
    if (stars >= 100) starScore = 100;
    else if (stars >= 50) starScore = 80;
    else if (stars >= 20) starScore = 60;
    else if (stars >= 10) starScore = 40;
    else if (stars >= 1) starScore = 20;
    else starScore = 0;

    // Recent activity score (0-100)
    let recencyScore = 0;
    if (githubData.lastActivity) {
      const lastActivity = new Date(githubData.lastActivity);
      const now = new Date();
      const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);
      
      if (daysSinceActivity <= 7) recencyScore = 100;      // Within a week
      else if (daysSinceActivity <= 30) recencyScore = 80;  // Within a month
      else if (daysSinceActivity <= 90) recencyScore = 60;  // Within 3 months
      else if (daysSinceActivity <= 180) recencyScore = 40; // Within 6 months
      else if (daysSinceActivity <= 365) recencyScore = 20; // Within a year
      else recencyScore = 0;
    }

    // Calculate weighted score
    score = (commitScore * weights.commits) +
            (repoScore * weights.repositories) +
            (starScore * weights.stars) +
            (recencyScore * weights.recency);

    return Math.round(Math.min(score, 100));
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use calculateGitHubActivityScore instead
   */
  calculateGitHubMatch(githubActivity) {
    const activityScores = {
      'High': 100,
      'Medium': 75,
      'Low': 50,
      'None': 25
    };

    return activityScores[githubActivity] || 50;
  }

  /**
   * Calculate availability match
   */
  calculateAvailabilityMatch(candidateAvailability, roleType) {
    if (!candidateAvailability || !roleType) return 100;

    // Simple matching logic - can be enhanced
    if (roleType.toLowerCase().includes('full') && candidateAvailability.toLowerCase().includes('full')) return 100;
    if (roleType.toLowerCase().includes('part') && candidateAvailability.toLowerCase().includes('part')) return 100;
    if (roleType.toLowerCase().includes('contract') && candidateAvailability.toLowerCase().includes('contract')) return 100;

    return 75; // Default partial match
  }

  /**
   * Find matching skills between candidate and job requirements
   */
  findMatchingSkills(candidateSkills, requiredSkills) {
    if (!candidateSkills || !requiredSkills) return [];

    return candidateSkills.filter(skill =>
      requiredSkills.some(required =>
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }

  /**
   * Find missing skills from job requirements
   */
  findMissingSkills(candidateSkills, requiredSkills) {
    if (!requiredSkills) return [];
    if (!candidateSkills) return requiredSkills;

    return requiredSkills.filter(required =>
      !candidateSkills.some(skill =>
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }

  /**
   * Assess GitHub activity level
   */
  assessGitHubActivity(githubData) {
    if (!githubData) return 'None';

    const commits = githubData.commits || 0;
    const repos = githubData.repositories || 0;
    const lastActivity = githubData.lastActivity;

    if (commits > 100 && repos > 5) return 'High';
    if (commits > 50 && repos > 2) return 'Medium';
    if (commits > 10 || repos > 0) return 'Low';
    
    return 'None';
  }

  /**
   * Identify candidate strengths based on match analysis (Requirements 4.5)
   * @param {object} candidateProfile - Candidate profile data
   * @param {object} jobPosting - Job posting requirements
   * @param {object} scores - Individual component scores
   * @returns {Array<string>} - Array of strength descriptions
   */
  identifyStrengths(candidateProfile, jobPosting, scores) {
    const strengths = [];
    const matchingSkills = this.findMatchingSkills(candidateProfile.skills || [], jobPosting.requiredSkills || []);

    // Skill-based strengths
    if (scores.skillMatch >= 80) {
      strengths.push(`Strong skill alignment with ${matchingSkills.length} matching skills: ${matchingSkills.slice(0, 3).join(', ')}`);
    } else if (scores.skillMatch >= 60) {
      strengths.push(`Good skill match in ${matchingSkills.slice(0, 2).join(', ')}`);
    }

    // Experience-based strengths
    const candidateYears = candidateProfile.experienceYears || 0;
    const requiredYears = jobPosting.minExperience || 0;
    if (candidateYears >= requiredYears * 1.5) {
      strengths.push(`Exceeds experience requirement with ${candidateYears} years`);
    } else if (candidateYears >= requiredYears) {
      strengths.push(`Meets experience requirement with ${candidateYears} years`);
    }

    // Portfolio-based strengths
    if (scores.portfolioDepth >= 80) {
      strengths.push('Excellent portfolio with high-quality projects');
    } else if (scores.portfolioDepth >= 60) {
      strengths.push('Strong portfolio demonstrating technical skills');
    }

    // GitHub-based strengths
    if (scores.githubActivity >= 80) {
      strengths.push('Very active GitHub profile with recent contributions');
    } else if (scores.githubActivity >= 60) {
      strengths.push('Active GitHub presence with good project history');
    }

    // Education-based strengths
    if (scores.educationAlignment >= 90) {
      const educationLevel = candidateProfile.educationLevel;
      if (educationLevel === 'phd') {
        strengths.push('Advanced PhD-level expertise');
      } else if (educationLevel === 'graduate') {
        strengths.push('Strong educational background');
      }
    }

    // Availability-based strengths
    if (scores.availabilityFit >= 90) {
      strengths.push('Perfect availability match for role requirements');
    }

    // Ensure we have at least one strength
    if (strengths.length === 0) {
      strengths.push('Profile available for detailed review');
    }

    return strengths.slice(0, 4); // Limit to top 4 strengths
  }

  /**
   * Generate basic match explanation (fallback)
   */
  generateBasicExplanation(candidate, jobPosting, matchScore) {
    const candidateSkills = candidate.skills || [];
    const requiredSkills = jobPosting.requiredSkills || [];
    const matchingSkills = this.findMatchingSkills(candidateSkills, requiredSkills);

    if (matchScore >= 80) {
      return `Excellent match (${matchScore}%) with strong alignment in ${matchingSkills.slice(0, 3).join(', ')} and ${candidate.experienceYears || 0} years of experience.`;
    } else if (matchScore >= 60) {
      return `Good match (${matchScore}%) with relevant skills in ${matchingSkills.slice(0, 2).join(', ')} and solid experience background.`;
    } else {
      return `Potential match (${matchScore}%) with some relevant skills and room for growth in this role.`;
    }
  }

  /**
   * Create shortlist generation service (Requirements 4.1, 4.3)
   * Generates a ranked list of candidates for a job posting
   * @param {string} jobId - Job posting ID
   * @param {object} options - Generation options
   * @returns {Promise<object>} - Shortlist with ranked candidates
   */
  async createShortlist(jobId, options = {}) {
    try {
      // Get job posting
      const JobPosting = (await import('../models/JobPosting.js')).default;
      const jobPosting = await JobPosting.findById(jobId);
      
      if (!jobPosting) {
        throw new Error('Job posting not found');
      }

      const maxCandidates = options.maxCandidates || jobPosting.maxCandidates || 10;
      
      // Generate shortlist
      const shortlist = await this.generateShortlist(jobPosting, maxCandidates);
      
      // Update job posting with shortlist
      jobPosting.shortlist = shortlist.map(candidate => ({
        candidateId: candidate._id,
        matchScore: candidate.matchScore,
        matchDetails: candidate.matchDetails,
        matchExplanation: candidate.matchExplanation,
        status: 'shortlisted',
        addedAt: new Date()
      }));
      
      jobPosting.analytics.shortlistGenerated = new Date();
      jobPosting.analytics.lastShortlistUpdate = new Date();
      
      await jobPosting.save();
      
      return {
        jobId,
        shortlist,
        generatedAt: new Date(),
        totalCandidates: shortlist.length,
        averageMatchScore: shortlist.length > 0 
          ? Math.round(shortlist.reduce((sum, c) => sum + c.matchScore, 0) / shortlist.length)
          : 0,
        topMatchScore: shortlist.length > 0 ? shortlist[0].matchScore : 0
      };
      
    } catch (error) {
      console.error('Shortlist creation failed:', error);
      throw new Error(`Failed to create shortlist: ${error.message}`);
    }
  }

  /**
   * Build match explanation generator (Requirements 4.5)
   * Generates human-readable explanations for candidate matches
   * @param {object} candidate - Candidate profile
   * @param {object} jobPosting - Job posting
   * @param {object} matchDetails - Detailed match analysis
   * @returns {Promise<string>} - Generated explanation
   */
  async buildMatchExplanation(candidate, jobPosting, matchDetails) {
    try {
      const candidateProfile = {
        name: candidate.name || 'Candidate',
        skills: candidate.skills || [],
        experienceYears: candidate.experienceYears || 0,
        portfolioScore: matchDetails.breakdown?.portfolioDepth || 0
      };

      // Try AI-generated explanation first
      const aiExplanation = await geminiService.generateMatchExplanation(
        candidateProfile, 
        jobPosting, 
        matchDetails.overallScore
      );
      
      return aiExplanation;
      
    } catch (error) {
      console.warn('AI explanation failed, generating basic explanation:', error);
      
      // Fallback to structured explanation
      const strengths = matchDetails.strengths || [];
      const matchingSkills = matchDetails.matchingSkills || [];
      const score = matchDetails.overallScore;
      
      let explanation = `${score}% match`;
      
      if (strengths.length > 0) {
        explanation += ` - ${strengths[0]}`;
      }
      
      if (matchingSkills.length > 0) {
        explanation += `. Strong skills in ${matchingSkills.slice(0, 2).join(', ')}`;
      }
      
      return explanation;
    }
  }

  /**
   * Clear match cache
   */
  clearCache() {
    this.matchCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.matchCache.size,
      timeout: this.cacheTimeout
    };
  }
}

export default new JobMatchingService();