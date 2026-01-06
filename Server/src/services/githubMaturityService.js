/**
 * GitHub Maturity Evaluation Service
 * Production-grade data collection for evaluating software engineering maturity
 * 
 * Design principles:
 * - OAuth-based user authorization (supports both PAT and user tokens)
 * - Minimal API calls via batching and parallel requests
 * - Structured, LLM-ready output with limited context window in mind
 * - No deep code parsing - metadata-only analysis
 */

import { Octokit } from '@octokit/rest';

class GitHubMaturityService {
  constructor() {
    this.defaultOctokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined
    });
  }

  /**
   * Create authenticated Octokit instance for user
   * @param {string} accessToken - OAuth access token from user authorization
   */
  createUserOctokit(accessToken) {
    return new Octokit({ auth: accessToken });
  }

  /**
   * Get Octokit instance - uses user token if provided, falls back to server token
   */
  getOctokit(userToken = null) {
    return userToken ? this.createUserOctokit(userToken) : this.defaultOctokit;
  }

  /**
   * MAIN ENTRY POINT: Evaluate developer maturity from GitHub profile
   * Returns LLM-ready structured summary
   * 
   * @param {string} username - GitHub username
   * @param {string} userToken - Optional OAuth token for private repo access
   * @returns {Promise<object>} - Structured maturity evaluation
   */
  async evaluateMaturity(username, userToken = null) {
    const octokit = this.getOctokit(userToken);
    
    // Parallel fetch - minimizes API round trips
    const [profile, repos, events] = await Promise.all([
      this.fetchUserProfile(octokit, username),
      this.fetchRepositories(octokit, username, userToken),
      this.fetchRecentEvents(octokit, username)
    ]);

    // Analyze repos in batch (top 10 by activity)
    const topRepos = this.selectTopRepos(repos, 10);
    const repoAnalyses = await this.batchAnalyzeRepos(octokit, username, topRepos);

    // Compute maturity signals
    const signals = this.computeMaturitySignals(profile, repos, repoAnalyses, events);
    
    // Build LLM-ready summary
    return this.buildMaturitySummary(username, profile, signals, repoAnalyses);
  }

  /**
   * Fetch user profile - single API call
   */
  async fetchUserProfile(octokit, username) {
    try {
      const { data } = await octokit.rest.users.getByUsername({ username });
      return {
        login: data.login,
        name: data.name,
        bio: data.bio,
        company: data.company,
        location: data.location,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        hireable: data.hireable,
        twitterUsername: data.twitter_username,
        blog: data.blog
      };
    } catch (error) {
      if (error.status === 404) throw new Error(`GitHub user '${username}' not found`);
      throw error;
    }
  }

  /**
   * Fetch repositories - single paginated call
   * With user token: includes private repos
   */
  async fetchRepositories(octokit, username, userToken = null) {
    const params = {
      username,
      sort: 'pushed',
      direction: 'desc',
      per_page: 100,
      type: userToken ? 'all' : 'owner'
    };

    // If using user's own token, use authenticated endpoint for private repos
    if (userToken) {
      try {
        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
          sort: 'pushed',
          direction: 'desc',
          per_page: 100,
          visibility: 'all'
        });
        return data;
      } catch {
        // Fallback to public repos
      }
    }

    const { data } = await octokit.rest.repos.listForUser(params);
    return data;
  }

  /**
   * Fetch recent events - single API call, max 100 events
   */
  async fetchRecentEvents(octokit, username) {
    try {
      const { data } = await octokit.rest.activity.listPublicEventsForUser({
        username,
        per_page: 100
      });
      return data;
    } catch {
      return [];
    }
  }

  /**
   * Select top repos by activity and significance
   */
  selectTopRepos(repos, limit = 10) {
    return repos
      .filter(r => !r.fork) // Exclude forks for maturity eval
      .sort((a, b) => {
        // Score: stars + forks + recency
        const scoreA = a.stargazers_count + a.forks_count + (new Date(a.pushed_at) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) ? 10 : 0);
        const scoreB = b.stargazers_count + b.forks_count + (new Date(b.pushed_at) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) ? 10 : 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }


  /**
   * Batch analyze repos - parallel requests for efficiency
   * Fetches: README presence, languages, contributors, commit activity
   */
  async batchAnalyzeRepos(octokit, username, repos) {
    const analyses = await Promise.all(
      repos.map(repo => this.analyzeRepo(octokit, username, repo))
    );
    return analyses;
  }

  /**
   * Analyze single repo - 3-4 API calls per repo
   */
  async analyzeRepo(octokit, owner, repo) {
    const repoName = repo.name;
    
    // Parallel fetch repo details
    const [readme, languages, contributors, commitActivity] = await Promise.allSettled([
      this.fetchReadmeMetadata(octokit, owner, repoName),
      this.fetchLanguages(octokit, owner, repoName),
      this.fetchContributorStats(octokit, owner, repoName),
      this.fetchCommitActivity(octokit, owner, repoName)
    ]);

    return {
      name: repoName,
      description: repo.description || '',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      openIssues: repo.open_issues_count,
      language: repo.language,
      topics: repo.topics || [],
      license: repo.license?.spdx_id || null,
      createdAt: repo.created_at,
      pushedAt: repo.pushed_at,
      size: repo.size,
      defaultBranch: repo.default_branch,
      hasWiki: repo.has_wiki,
      hasPages: repo.has_pages,
      hasProjects: repo.has_projects,
      hasDiscussions: repo.has_discussions,
      isArchived: repo.archived,
      // Analyzed data
      readme: readme.status === 'fulfilled' ? readme.value : null,
      languages: languages.status === 'fulfilled' ? languages.value : {},
      contributors: contributors.status === 'fulfilled' ? contributors.value : { count: 0, topContributors: [] },
      commitActivity: commitActivity.status === 'fulfilled' ? commitActivity.value : null
    };
  }

  /**
   * Fetch README metadata without full content
   */
  async fetchReadmeMetadata(octokit, owner, repo) {
    try {
      const { data } = await octokit.rest.repos.getReadme({ owner, repo });
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      return {
        exists: true,
        size: data.size,
        quality: this.assessReadmeQuality(content),
        sections: this.extractReadmeSections(content),
        firstParagraph: this.extractFirstParagraph(content)
      };
    } catch (error) {
      if (error.status === 404) return { exists: false, quality: 'none', sections: [], firstParagraph: '' };
      throw error;
    }
  }

  /**
   * Assess README quality based on structure
   */
  assessReadmeQuality(content) {
    if (!content || content.length < 50) return 'poor';
    
    const lower = content.toLowerCase();
    let score = 0;
    
    // Essential sections
    if (lower.includes('## installation') || lower.includes('## setup') || lower.includes('## getting started')) score += 2;
    if (lower.includes('## usage') || lower.includes('## example')) score += 2;
    if (lower.includes('## api') || lower.includes('## documentation')) score += 1;
    if (lower.includes('## contributing')) score += 1;
    if (lower.includes('## license')) score += 1;
    if (lower.includes('## test')) score += 1;
    
    // Quality indicators
    if (content.includes('```')) score += 1; // Code blocks
    if (content.includes('![') || content.includes('<img')) score += 1; // Images/badges
    if (content.length > 1000) score += 1;
    if (content.length > 3000) score += 1;
    
    if (score >= 8) return 'excellent';
    if (score >= 5) return 'good';
    if (score >= 2) return 'basic';
    return 'poor';
  }

  /**
   * Extract README section headers
   */
  extractReadmeSections(content) {
    const headers = content.match(/^#{1,3}\s+.+$/gm) || [];
    return headers.slice(0, 10).map(h => h.replace(/^#+\s*/, '').trim());
  }

  /**
   * Extract first meaningful paragraph
   */
  extractFirstParagraph(content) {
    const lines = content.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('![') && !l.startsWith('[![') && !l.startsWith('<'));
    
    return lines.slice(0, 2).join(' ').substring(0, 250);
  }

  /**
   * Fetch language breakdown
   */
  async fetchLanguages(octokit, owner, repo) {
    try {
      const { data } = await octokit.rest.repos.listLanguages({ owner, repo });
      return data;
    } catch {
      return {};
    }
  }

  /**
   * Fetch contributor stats - limited to top 5
   */
  async fetchContributorStats(octokit, owner, repo) {
    try {
      const { data } = await octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 10
      });
      
      return {
        count: data.length,
        totalCommits: data.reduce((sum, c) => sum + c.contributions, 0),
        topContributors: data.slice(0, 5).map(c => ({
          login: c.login,
          contributions: c.contributions
        }))
      };
    } catch {
      return { count: 0, totalCommits: 0, topContributors: [] };
    }
  }

  /**
   * Fetch commit activity (last year)
   */
  async fetchCommitActivity(octokit, owner, repo) {
    try {
      const { data } = await octokit.rest.repos.getCommitActivityStats({ owner, repo });
      
      if (!data || !Array.isArray(data)) return null;
      
      // Last 52 weeks of commit data
      const totalCommits = data.reduce((sum, week) => sum + week.total, 0);
      const activeWeeks = data.filter(week => week.total > 0).length;
      const recentWeeks = data.slice(-12);
      const recentCommits = recentWeeks.reduce((sum, week) => sum + week.total, 0);
      
      return {
        totalCommitsLastYear: totalCommits,
        activeWeeks,
        recentCommits3Months: recentCommits,
        consistencyScore: Math.round((activeWeeks / 52) * 100)
      };
    } catch {
      return null;
    }
  }


  /**
   * Compute maturity signals from collected data
   */
  computeMaturitySignals(profile, repos, repoAnalyses, events) {
    const now = new Date();
    const accountAge = Math.floor((now - new Date(profile.createdAt)) / (365.25 * 24 * 60 * 60 * 1000));
    
    // Activity signals
    const sixMonthsAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);
    const recentPushEvents = events.filter(e => e.type === 'PushEvent' && new Date(e.created_at) > sixMonthsAgo);
    const recentPREvents = events.filter(e => e.type === 'PullRequestEvent');
    const recentIssueEvents = events.filter(e => e.type === 'IssuesEvent' || e.type === 'IssueCommentEvent');
    
    // Repo quality signals
    const ownedRepos = repos.filter(r => !r.fork);
    const reposWithReadme = repoAnalyses.filter(r => r.readme?.exists).length;
    const reposWithLicense = repoAnalyses.filter(r => r.license).length;
    const reposWithTopics = repoAnalyses.filter(r => r.topics?.length > 0).length;
    const reposWithDescription = repoAnalyses.filter(r => r.description?.length > 10).length;
    
    // Language diversity
    const allLanguages = new Set();
    repoAnalyses.forEach(r => {
      if (r.language) allLanguages.add(r.language);
      Object.keys(r.languages || {}).forEach(l => allLanguages.add(l));
    });
    
    // Collaboration signals
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
    const multiContributorRepos = repoAnalyses.filter(r => r.contributors?.count > 1).length;
    
    // Commit consistency
    const commitActivities = repoAnalyses.map(r => r.commitActivity).filter(Boolean);
    const avgConsistency = commitActivities.length > 0
      ? Math.round(commitActivities.reduce((sum, a) => sum + a.consistencyScore, 0) / commitActivities.length)
      : 0;

    return {
      // Profile maturity
      accountAgeYears: accountAge,
      hasCompleteBio: !!(profile.bio && profile.name && (profile.blog || profile.company)),
      followerRatio: profile.followers / Math.max(profile.following, 1),
      
      // Activity maturity
      recentPushCount: recentPushEvents.length,
      recentPRCount: recentPREvents.length,
      recentIssueActivity: recentIssueEvents.length,
      lastActivityDate: events[0]?.created_at || null,
      commitConsistency: avgConsistency,
      
      // Repository maturity
      totalOwnedRepos: ownedRepos.length,
      documentationRate: Math.round((reposWithReadme / Math.max(repoAnalyses.length, 1)) * 100),
      licenseRate: Math.round((reposWithLicense / Math.max(repoAnalyses.length, 1)) * 100),
      topicsRate: Math.round((reposWithTopics / Math.max(repoAnalyses.length, 1)) * 100),
      descriptionRate: Math.round((reposWithDescription / Math.max(repoAnalyses.length, 1)) * 100),
      
      // Technical breadth
      languageCount: allLanguages.size,
      primaryLanguages: Array.from(allLanguages).slice(0, 5),
      
      // Community engagement
      totalStars,
      totalForks,
      collaborativeRepos: multiContributorRepos,
      
      // Quality indicators
      readmeQualityDistribution: this.computeReadmeDistribution(repoAnalyses),
      hasGitHubPages: repoAnalyses.some(r => r.hasPages),
      hasWiki: repoAnalyses.some(r => r.hasWiki),
      usesProjects: repoAnalyses.some(r => r.hasProjects),
      usesDiscussions: repoAnalyses.some(r => r.hasDiscussions)
    };
  }

  /**
   * Compute README quality distribution
   */
  computeReadmeDistribution(repoAnalyses) {
    const dist = { excellent: 0, good: 0, basic: 0, poor: 0, none: 0 };
    repoAnalyses.forEach(r => {
      const quality = r.readme?.quality || 'none';
      dist[quality] = (dist[quality] || 0) + 1;
    });
    return dist;
  }

  /**
   * Build LLM-ready maturity summary
   * Optimized for limited context window
   */
  buildMaturitySummary(username, profile, signals, repoAnalyses) {
    // Compute overall maturity score (0-100)
    const maturityScore = this.computeMaturityScore(signals);
    
    // Select top 5 repos for detailed summary
    const topRepoSummaries = repoAnalyses.slice(0, 5).map(r => ({
      name: r.name,
      description: r.description?.substring(0, 100) || '',
      language: r.language,
      stars: r.stars,
      forks: r.forks,
      readmeQuality: r.readme?.quality || 'none',
      readmeSummary: r.readme?.firstParagraph || '',
      hasLicense: !!r.license,
      topics: r.topics?.slice(0, 5) || [],
      lastPush: r.pushedAt,
      commitActivity: r.commitActivity ? {
        yearlyCommits: r.commitActivity.totalCommitsLastYear,
        consistency: r.commitActivity.consistencyScore
      } : null
    }));

    return {
      // Identity
      username,
      profileUrl: `https://github.com/${username}`,
      name: profile.name,
      bio: profile.bio?.substring(0, 200) || '',
      
      // Overall assessment
      maturityScore,
      maturityLevel: this.getMaturityLevel(maturityScore),
      
      // Key metrics (LLM-friendly)
      metrics: {
        accountAge: `${signals.accountAgeYears} years`,
        totalRepos: signals.totalOwnedRepos,
        totalStars: signals.totalStars,
        totalForks: signals.totalForks,
        languages: signals.primaryLanguages,
        languageCount: signals.languageCount,
        documentationRate: `${signals.documentationRate}%`,
        licenseRate: `${signals.licenseRate}%`,
        commitConsistency: `${signals.commitConsistency}%`,
        recentActivity: signals.recentPushCount > 0 ? 'Active' : 'Inactive'
      },
      
      // Maturity signals breakdown
      signals: {
        profile: {
          completeness: signals.hasCompleteBio ? 'Complete' : 'Incomplete',
          communityEngagement: signals.followerRatio > 1 ? 'High' : signals.followerRatio > 0.5 ? 'Medium' : 'Low'
        },
        activity: {
          recentPushes: signals.recentPushCount,
          recentPRs: signals.recentPRCount,
          issueEngagement: signals.recentIssueActivity,
          lastActive: signals.lastActivityDate
        },
        quality: {
          readmeDistribution: signals.readmeQualityDistribution,
          usesGitHubFeatures: {
            pages: signals.hasGitHubPages,
            wiki: signals.hasWiki,
            projects: signals.usesProjects,
            discussions: signals.usesDiscussions
          }
        },
        collaboration: {
          collaborativeRepos: signals.collaborativeRepos,
          communityInterest: signals.totalStars + signals.totalForks
        }
      },
      
      // Top repositories (detailed)
      topRepositories: topRepoSummaries,
      
      // LLM prompt-ready summary
      textSummary: this.generateTextSummary(username, profile, signals, maturityScore),
      
      // Timestamp
      evaluatedAt: new Date().toISOString()
    };
  }


  /**
   * Compute overall maturity score (0-100)
   */
  computeMaturityScore(signals) {
    let score = 0;
    
    // Account age (max 10 points)
    score += Math.min(signals.accountAgeYears * 2, 10);
    
    // Profile completeness (max 5 points)
    score += signals.hasCompleteBio ? 5 : 2;
    
    // Repository count (max 10 points)
    score += Math.min(signals.totalOwnedRepos, 10);
    
    // Documentation quality (max 15 points)
    score += Math.round(signals.documentationRate * 0.15);
    
    // License usage (max 10 points)
    score += Math.round(signals.licenseRate * 0.1);
    
    // Commit consistency (max 15 points)
    score += Math.round(signals.commitConsistency * 0.15);
    
    // Language diversity (max 10 points)
    score += Math.min(signals.languageCount * 2, 10);
    
    // Community engagement (max 15 points)
    const engagementScore = Math.log10(signals.totalStars + signals.totalForks + 1) * 5;
    score += Math.min(Math.round(engagementScore), 15);
    
    // Recent activity (max 10 points)
    score += Math.min(signals.recentPushCount, 10);
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Get maturity level label
   */
  getMaturityLevel(score) {
    if (score >= 80) return 'Expert';
    if (score >= 60) return 'Advanced';
    if (score >= 40) return 'Intermediate';
    if (score >= 20) return 'Developing';
    return 'Beginner';
  }

  /**
   * Generate text summary for LLM consumption
   */
  generateTextSummary(username, profile, signals, score) {
    const level = this.getMaturityLevel(score);
    const activeStatus = signals.recentPushCount > 5 ? 'highly active' : signals.recentPushCount > 0 ? 'moderately active' : 'inactive';
    
    const strengths = [];
    const improvements = [];
    
    // Identify strengths
    if (signals.documentationRate >= 70) strengths.push('strong documentation practices');
    if (signals.licenseRate >= 70) strengths.push('proper licensing');
    if (signals.commitConsistency >= 50) strengths.push('consistent commit history');
    if (signals.languageCount >= 4) strengths.push('diverse tech stack');
    if (signals.totalStars >= 50) strengths.push('community recognition');
    if (signals.collaborativeRepos >= 2) strengths.push('collaboration experience');
    
    // Identify improvements
    if (signals.documentationRate < 50) improvements.push('improve README documentation');
    if (signals.licenseRate < 30) improvements.push('add licenses to repositories');
    if (signals.commitConsistency < 30) improvements.push('maintain more consistent commit activity');
    if (!signals.hasCompleteBio) improvements.push('complete GitHub profile bio');
    if (signals.topicsRate < 30) improvements.push('add topics/tags to repositories');
    if (signals.descriptionRate < 50) improvements.push('add descriptions to repositories');

    return `GitHub Profile: ${username} (${profile.name || 'No name'})
Maturity: ${level} (${score}/100)
Account Age: ${signals.accountAgeYears} years | Repos: ${signals.totalOwnedRepos} | Stars: ${signals.totalStars}
Languages: ${signals.primaryLanguages.join(', ') || 'None detected'}
Activity: ${activeStatus} (${signals.recentPushCount} pushes in 6 months)
Documentation: ${signals.documentationRate}% of repos have READMEs
${strengths.length > 0 ? `Strengths: ${strengths.join(', ')}` : ''}
${improvements.length > 0 ? `Areas to improve: ${improvements.join(', ')}` : ''}`;
  }

  /**
   * Quick evaluation - minimal API calls for fast assessment
   * Use when you need basic signals without full repo analysis
   */
  async quickEvaluate(username, userToken = null) {
    const octokit = this.getOctokit(userToken);
    
    const [profile, repos] = await Promise.all([
      this.fetchUserProfile(octokit, username),
      this.fetchRepositories(octokit, username, userToken)
    ]);

    const ownedRepos = repos.filter(r => !r.fork);
    const languages = new Set(ownedRepos.map(r => r.language).filter(Boolean));
    const totalStars = ownedRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const recentRepos = ownedRepos.filter(r => new Date(r.pushed_at) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000));

    return {
      username,
      name: profile.name,
      bio: profile.bio,
      accountAgeYears: Math.floor((new Date() - new Date(profile.createdAt)) / (365.25 * 24 * 60 * 60 * 1000)),
      totalRepos: ownedRepos.length,
      totalStars,
      languageCount: languages.size,
      primaryLanguages: Array.from(languages).slice(0, 5),
      recentlyActive: recentRepos.length > 0,
      topRepos: ownedRepos.slice(0, 3).map(r => ({
        name: r.name,
        description: r.description?.substring(0, 100) || '',
        language: r.language,
        stars: r.stargazers_count
      }))
    };
  }
}

export default new GitHubMaturityService();
