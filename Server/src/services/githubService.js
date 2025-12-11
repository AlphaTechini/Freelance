import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined
    });
  }

  /**
   * Extract GitHub username and repository from URL
   * @param {string} githubUrl - GitHub profile or repository URL
   * @returns {object} - { username, repo } or { username } for profile URLs
   */
  parseGitHubUrl(githubUrl) {
    try {
      const url = new URL(githubUrl);
      const pathParts = url.pathname.split('/').filter(part => part);
      
      if (pathParts.length >= 1) {
        const username = pathParts[0];
        const repo = pathParts.length >= 2 ? pathParts[1] : null;
        return { username, repo };
      }
      
      throw new Error('Invalid GitHub URL format');
    } catch (error) {
      throw new Error(`Failed to parse GitHub URL: ${error.message}`);
    }
  }

  /**
   * Get user's repositories with detailed information
   * @param {string} username - GitHub username
   * @returns {Promise<Array>} - Array of repository objects
   */
  async getUserRepositories(username) {
    try {
      const { data: repos } = await this.octokit.rest.repos.listForUser({
        username,
        sort: 'updated',
        per_page: 30,
        type: 'owner'
      });

      return repos.map(repo => ({
        name: repo.name,
        description: repo.description || '',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language || '',
        url: repo.html_url,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        size: repo.size,
        hasReadme: false, // Will be checked separately
        topics: repo.topics || []
      }));
    } catch (error) {
      if (error.status === 404) {
        throw new Error('GitHub user not found');
      }
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }
  }

  /**
   * Get user's GitHub activity and statistics
   * @param {string} username - GitHub username
   * @returns {Promise<object>} - User activity data
   */
  async getUserActivity(username) {
    try {
      const { data: user } = await this.octokit.rest.users.getByUsername({
        username
      });

      // Get recent events for activity analysis
      const { data: events } = await this.octokit.rest.activity.listPublicEventsForUser({
        username,
        per_page: 100
      });

      // Calculate commit activity in last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentCommits = events.filter(event => 
        event.type === 'PushEvent' && 
        new Date(event.created_at) > sixMonthsAgo
      ).length;

      return {
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        createdAt: user.created_at,
        lastActivity: events.length > 0 ? events[0].created_at : null,
        recentCommits,
        bio: user.bio || '',
        location: user.location || '',
        company: user.company || ''
      };
    } catch (error) {
      if (error.status === 404) {
        throw new Error('GitHub user not found');
      }
      throw new Error(`Failed to fetch user activity: ${error.message}`);
    }
  }

  /**
   * Check if repository has a README file
   * @param {string} username - GitHub username
   * @param {string} repoName - Repository name
   * @returns {Promise<object>} - README information
   */
  async getRepositoryReadme(username, repoName) {
    try {
      const { data: readme } = await this.octokit.rest.repos.getReadme({
        owner: username,
        repo: repoName
      });

      // Decode content and analyze quality
      const content = Buffer.from(readme.content, 'base64').toString('utf-8');
      const quality = this.analyzeReadmeQuality(content);

      return {
        exists: true,
        size: readme.size,
        quality,
        content: content.substring(0, 1000) // First 1000 chars for analysis
      };
    } catch (error) {
      if (error.status === 404) {
        return { exists: false, quality: 'poor' };
      }
      throw new Error(`Failed to fetch README: ${error.message}`);
    }
  }

  /**
   * Analyze README quality based on content
   * @param {string} content - README content
   * @returns {string} - Quality rating: 'poor', 'good', 'excellent'
   */
  analyzeReadmeQuality(content) {
    if (!content || content.length < 100) {
      return 'poor';
    }

    let score = 0;
    const lowerContent = content.toLowerCase();

    // Check for essential sections
    if (lowerContent.includes('installation') || lowerContent.includes('setup')) score += 1;
    if (lowerContent.includes('usage') || lowerContent.includes('example')) score += 1;
    if (lowerContent.includes('description') || content.length > 300) score += 1;
    if (lowerContent.includes('license')) score += 1;
    if (lowerContent.includes('contributing') || lowerContent.includes('contribute')) score += 1;
    if (content.includes('```') || content.includes('`')) score += 1; // Code blocks
    if (content.includes('![') || content.includes('<img')) score += 1; // Images

    if (score >= 5) return 'excellent';
    if (score >= 3) return 'good';
    return 'poor';
  }

  /**
   * Get programming languages used across repositories
   * @param {string} username - GitHub username
   * @returns {Promise<object>} - Language statistics
   */
  async getUserLanguages(username) {
    try {
      const repos = await this.getUserRepositories(username);
      const languageStats = {};

      for (const repo of repos.slice(0, 10)) { // Analyze top 10 repos
        try {
          const { data: languages } = await this.octokit.rest.repos.listLanguages({
            owner: username,
            repo: repo.name
          });

          Object.entries(languages).forEach(([lang, bytes]) => {
            languageStats[lang] = (languageStats[lang] || 0) + bytes;
          });
        } catch (error) {
          // Skip if can't access repo languages
          continue;
        }
      }

      // Convert to percentages and sort
      const totalBytes = Object.values(languageStats).reduce((sum, bytes) => sum + bytes, 0);
      const languagePercentages = Object.entries(languageStats)
        .map(([lang, bytes]) => ({
          language: lang,
          percentage: Math.round((bytes / totalBytes) * 100),
          bytes
        }))
        .sort((a, b) => b.percentage - a.percentage);

      return languagePercentages;
    } catch (error) {
      throw new Error(`Failed to analyze languages: ${error.message}`);
    }
  }

  /**
   * Comprehensive GitHub analysis for a user
   * @param {string} githubUrl - GitHub profile URL
   * @returns {Promise<object>} - Complete GitHub analysis
   */
  async analyzeGitHubProfile(githubUrl) {
    try {
      const { username } = this.parseGitHubUrl(githubUrl);
      
      // Fetch all data in parallel
      const [repositories, activity, languages] = await Promise.all([
        this.getUserRepositories(username),
        this.getUserActivity(username),
        this.getUserLanguages(username)
      ]);

      // Analyze top repositories with README quality
      const topProjects = [];
      for (const repo of repositories.slice(0, 5)) {
        const readme = await this.getRepositoryReadme(username, repo.name);
        topProjects.push({
          ...repo,
          readmeQuality: readme.quality,
          hasReadme: readme.exists
        });
      }

      // Calculate metrics
      const totalStars = repositories.reduce((sum, repo) => sum + repo.stars, 0);
      const avgStarsPerRepo = repositories.length > 0 ? Math.round(totalStars / repositories.length) : 0;
      
      return {
        username,
        repositories: repositories.length,
        stars: totalStars,
        commits: activity.recentCommits,
        languages: languages.map(l => l.language),
        lastActivity: activity.lastActivity ? new Date(activity.lastActivity) : null,
        topProjects: topProjects.slice(0, 5),
        metrics: {
          avgStarsPerRepo,
          totalForks: repositories.reduce((sum, repo) => sum + repo.forks, 0),
          languageCount: languages.length,
          publicRepos: activity.publicRepos,
          followers: activity.followers
        }
      };
    } catch (error) {
      throw new Error(`GitHub analysis failed: ${error.message}`);
    }
  }
}

export default new GitHubService();