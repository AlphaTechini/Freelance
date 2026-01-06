/**
 * GitHub Repository Metrics Service
 * 
 * Computes detailed metrics per repository across four categories:
 * - ACTIVITY: repo age, commits per month, inactivity gaps, last push
 * - COLLABORATION: PRs, merge rates, PR sizes, external contributors
 * - QUALITY SIGNALS: tests, CI, linters, security alerts (metadata only)
 * - HYGIENE: README quality, license, changelog/releases
 * 
 * Design principles:
 * - Accepts pre-authenticated Octokit instance (flexible for OAuth or PAT)
 * - Uses REST for single-resource fetches and file existence checks
 * - Uses GraphQL for aggregated PR data and security alerts (reduces API calls)
 * - Respects rate limits with monitoring and exponential backoff
 * - Returns normalized JSON objects per repository
 * 
 * @module githubRepoMetricsService
 */

// Constants for analysis windows
const COMMIT_WEEKS_WINDOW = 30; // Analyze last 30 weeks of commit activity
const BATCH_SIZE = 5; // Process repos in batches to avoid rate limit bursts
const BACKOFF_BASE_MS = 1000; // Base delay for exponential backoff

// ============================================================================
// SCORING THRESHOLDS AND WEIGHTS
// ============================================================================
const SCORING_CONFIG = {
  // Activity scoring thresholds
  activity: {
    idealCommitsPerMonth: { min: 2, max: 50 }, // Healthy range
    commitSpamThreshold: 100, // Commits/month that triggers spam penalty
    inactivityDaysWarning: 90, // Days without commits that lowers score
    inactivityDaysCritical: 180, // Severe inactivity
    maxAgeBonus: 3 // Years of track record that gives full maturity bonus
  },
  // Collaboration scoring thresholds
  collaboration: {
    idealMergeRate: { min: 0.5, max: 0.95 }, // 50-95% is healthy
    giantPRThreshold: 50, // Files changed that indicates a giant PR
    idealPRSize: { min: 1, max: 15 }, // Healthy PR size range
    minExternalContributors: 1 // Shows project is collaborative
  },
  // Quality signals scoring weights
  qualitySignals: {
    testsWeight: 3,
    ciWeight: 3,
    lintersWeight: 2,
    securityWeight: 2
  },
  // Documentation scoring thresholds
  documentation: {
    minReadmeLength: 500, // Minimal acceptable README
    goodReadmeLength: 2000, // Well-documented README
    excellentReadmeLength: 5000 // Comprehensive README
  }
};

// ============================================================================
// ANTI-GAMING HEURISTICS CONFIGURATION
// ============================================================================
const GAMING_DETECTION_CONFIG = {
  // Commit burst detection
  commitBurst: {
    // If >X commits in a single week, flag as burst
    weeklyBurstThreshold: 50,
    // If >X% of all commits came in a single week, suspicious
    singleWeekConcentrationThreshold: 0.6,
    // Minimum commits to apply concentration check
    minCommitsForConcentrationCheck: 20
  },
  // Activity vs engagement mismatch
  activityMismatch: {
    // High commits but very low PRs (ratio threshold)
    highCommitLowPRThreshold: { commits: 50, maxPRRatio: 0.02 },
    // High commits but zero issues (not using issue tracker)
    highCommitNoIssueThreshold: 30
  },
  // Fork detection (for portfolio-level analysis)
  forkOnly: {
    // If repo is a fork with minimal unique commits
    minUniqueCommitsToCount: 5
  },
  // Single-day creation spike
  creationSpike: {
    // If repo created and heavily committed within N days
    initialPeriodDays: 7,
    // Commits threshold in initial period that looks artificial
    artificialBurstThreshold: 100
  },
  // File diversity (low diversity = possible gaming)
  fileDiversity: {
    // If average files per commit < X, low diversity
    minFilesPerCommitHealthy: 1.5,
    // Max commits to sample for diversity check
    diversitySampleSize: 50
  }
};

/**
 * Main entry point: Analyze multiple repositories for a given user
 * 
 * API Choice: Uses parallel batch processing with rate limit checks between batches.
 * This balances throughput with rate limit safety.
 * 
 * @param {Octokit} octokit - Pre-authenticated Octokit instance
 * @param {string} username - GitHub username (repository owner)
 * @param {string[]} repositories - List of repository names to analyze
 * @returns {Promise<Object[]>} - Array of normalized metric objects per repository
 */
export async function analyzeRepositories(octokit, username, repositories) {
  const results = [];

  // Process in batches to respect rate limits
  for (let i = 0; i < repositories.length; i += BATCH_SIZE) {
    const batch = repositories.slice(i, i + BATCH_SIZE);

    // Check rate limit before each batch
    // API Choice: REST rateLimit.get() - simple and accurate for monitoring
    const rateInfo = await checkRateLimit(octokit);
    console.log(`[Rate Limit] Remaining: ${rateInfo.remaining}/${rateInfo.limit} | Resets: ${rateInfo.resetAt}`);

    // If rate limit is low, wait for reset
    if (rateInfo.remaining < 50) {
      const waitMs = Math.max(0, rateInfo.resetTimestamp - Date.now()) + 1000;
      console.log(`[Rate Limit] Low remaining calls. Waiting ${Math.ceil(waitMs / 1000)}s for reset...`);
      await sleep(waitMs);
    }

    // Analyze batch in parallel
    const batchResults = await Promise.all(
      batch.map(repoName => analyzeRepository(octokit, username, repoName))
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Analyze a single repository across all metric categories
 * 
 * @param {Octokit} octokit - Pre-authenticated Octokit instance
 * @param {string} owner - Repository owner username
 * @param {string} repoName - Repository name
 * @returns {Promise<Object>} - Normalized metrics object
 */
async function analyzeRepository(octokit, owner, repoName) {
  console.log(`[Analyzing] ${owner}/${repoName}`);

  try {
    // Fetch all data in parallel for efficiency
    // API Choice: Promise.allSettled allows partial results if some calls fail
    const [
      repoData,
      commitActivity,
      contributors,
      prMetrics,
      qualitySignals,
      readmeData,
      releases
    ] = await Promise.allSettled([
      fetchRepoMetadata(octokit, owner, repoName),
      fetchCommitActivity(octokit, owner, repoName),
      fetchContributors(octokit, owner, repoName),
      fetchPRMetrics(octokit, owner, repoName),
      fetchQualitySignals(octokit, owner, repoName),
      fetchReadmeData(octokit, owner, repoName),
      fetchReleases(octokit, owner, repoName)
    ]);

    // Build normalized output
    return buildMetricsObject(
      owner,
      repoName,
      unwrap(repoData),
      unwrap(commitActivity),
      unwrap(contributors),
      unwrap(prMetrics),
      unwrap(qualitySignals),
      unwrap(readmeData),
      unwrap(releases)
    );
  } catch (error) {
    console.error(`[Error] Failed to analyze ${owner}/${repoName}:`, error.message);
    return {
      repository: repoName,
      url: `https://github.com/${owner}/${repoName}`,
      analyzedAt: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Fetch basic repository metadata
 * 
 * API Choice: REST repos.get - single call returns all basic repo info including
 * created_at, pushed_at, license, default_branch, etc.
 */
async function fetchRepoMetadata(octokit, owner, repo) {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

/**
 * Fetch commit activity statistics (last 52 weeks from GitHub, we use last 30)
 * 
 * API Choice: REST repos.getCommitActivityStats - returns weekly commit counts
 * for the past year in a single call. GitHub computes this on their end.
 * We slice to last 30 weeks per user requirement.
 * 
 * Note: This endpoint may return 202 if stats are being computed. We retry once.
 */
async function fetchCommitActivity(octokit, owner, repo) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const { data, status } = await octokit.rest.repos.getCommitActivityStats({ owner, repo });

      // 202 means GitHub is computing stats - wait and retry
      if (status === 202) {
        attempts++;
        await sleep(2000 * attempts);
        continue;
      }

      if (!data || !Array.isArray(data)) {
        return null;
      }

      // Slice to last 30 weeks as per user requirement
      return data.slice(-COMMIT_WEEKS_WINDOW);
    } catch (error) {
      if (error.status === 202) {
        attempts++;
        await sleep(2000 * attempts);
        continue;
      }
      throw error;
    }
  }

  return null;
}

/**
 * Fetch repository contributors
 * 
 * API Choice: REST repos.listContributors - paginated list of contributors
 * with their commit counts. We fetch up to 100 to identify external contributors.
 */
async function fetchContributors(octokit, owner, repo) {
  try {
    const { data } = await octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 100
    });
    return data || [];
  } catch (error) {
    // 204 No Content means no contributors (empty repo)
    if (error.status === 204) return [];
    throw error;
  }
}

/**
 * Fetch PR metrics using GraphQL
 * 
 * API Choice: GraphQL - allows fetching PR counts by state (open, merged, closed)
 * and sampling PR details (files changed) in a SINGLE query. REST would require
 * multiple paginated calls.
 * 
 * Security alerts also use GraphQL as it's the only API that exposes
 * Dependabot and Code Scanning alert counts.
 */
async function fetchPRMetrics(octokit, owner, repo) {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        # Fork status
        isFork
        parent {
          nameWithOwner
        }
        # Issue counts for activity mismatch detection
        allIssues: issues {
          totalCount
        }
        openIssues: issues(states: OPEN) {
          totalCount
        }
        # Total PRs count
        allPRs: pullRequests {
          totalCount
        }
        # Merged PRs
        mergedPRs: pullRequests(states: MERGED) {
          totalCount
        }
        # Closed (not merged) PRs
        closedPRs: pullRequests(states: CLOSED) {
          totalCount
        }
        # Open PRs
        openPRs: pullRequests(states: OPEN) {
          totalCount
        }
        # Sample last 50 merged PRs for average size calculation
        recentMergedPRs: pullRequests(states: MERGED, last: 50) {
          nodes {
            changedFiles
          }
        }
        # Sample recent commits for file diversity analysis
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 50) {
                nodes {
                  changedFilesIfAvailable
                  committedDate
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await octokit.graphql(query, { owner, repo });
    const data = result.repository;

    // Calculate average PR size from sample
    const prSizes = data.recentMergedPRs.nodes.map(pr => pr.changedFiles);
    const avgPRSize = prSizes.length > 0
      ? prSizes.reduce((a, b) => a + b, 0) / prSizes.length
      : 0;

    // Extract commit file diversity data
    const commitHistory = data.defaultBranchRef?.target?.history?.nodes || [];
    const commitFileCounts = commitHistory
      .map(c => c.changedFilesIfAvailable)
      .filter(count => count !== null && count !== undefined);
    const avgFilesPerCommit = commitFileCounts.length > 0
      ? commitFileCounts.reduce((a, b) => a + b, 0) / commitFileCounts.length
      : null;

    // Extract commit dates for burst detection
    const recentCommitDates = commitHistory
      .map(c => c.committedDate)
      .filter(Boolean);

    return {
      totalPRs: data.allPRs.totalCount,
      mergedPRs: data.mergedPRs.totalCount,
      closedPRs: data.closedPRs.totalCount - data.mergedPRs.totalCount, // Closed = all closed - merged
      openPRs: data.openPRs.totalCount,
      averagePRSizeFiles: Math.round(avgPRSize * 10) / 10,
      // Issue tracking for gaming detection
      totalIssues: data.allIssues.totalCount,
      openIssues: data.openIssues.totalCount,
      // Fork info
      isFork: data.isFork,
      parentRepo: data.parent?.nameWithOwner ?? null,
      // File diversity
      avgFilesPerCommit: avgFilesPerCommit !== null ? Math.round(avgFilesPerCommit * 10) / 10 : null,
      // Recent commit dates for burst analysis
      recentCommitDates
    };
  } catch (error) {
    // GraphQL errors often contain useful info
    console.warn(`[GraphQL] PR metrics failed for ${owner}/${repo}:`, error.message);
    return null;
  }
}

/**
 * Fetch quality signals: tests, CI, linters presence
 * 
 * API Choice: REST repos.getContent - checks for file/directory existence.
 * We make parallel calls for each path to check. This is more efficient than
 * fetching the entire tree for repos with many files.
 * 
 * Note: 404 means the path doesn't exist (expected), other errors are real failures.
 */
async function fetchQualitySignals(octokit, owner, repo) {
  // Paths to check for each quality signal
  const checks = {
    // Test directories
    hasTests: ['test', '__tests__', 'tests', 'spec', 'specs'],
    // CI configuration
    hasCI: ['.github/workflows'],
    // Linter/formatter configs
    linters: {
      eslint: ['.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml', 'eslint.config.js', 'eslint.config.mjs'],
      prettier: ['.prettierrc', '.prettierrc.js', '.prettierrc.json', '.prettierrc.yml', '.prettierrc.yaml', 'prettier.config.js', 'prettier.config.mjs'],
      biome: ['biome.json', 'biome.jsonc']
    }
  };

  // Check test directories (any match = has tests)
  const hasTests = await checkPathsExist(octokit, owner, repo, checks.hasTests);

  // Check CI
  const hasCI = await checkPathsExist(octokit, owner, repo, checks.hasCI);

  // Check linters
  const linterResults = {};
  for (const [linter, paths] of Object.entries(checks.linters)) {
    linterResults[linter] = await checkPathsExist(octokit, owner, repo, paths);
  }

  // Fetch security alerts via GraphQL
  // API Choice: GraphQL is the ONLY way to access vulnerability alerts programmatically
  const securityAlerts = await fetchSecurityAlerts(octokit, owner, repo);

  return {
    hasTests,
    hasCI,
    hasLinters: linterResults,
    openSecurityAlertsCount: securityAlerts
  };
}

/**
 * Check if any of the given paths exist in the repository
 * 
 * @param {Octokit} octokit 
 * @param {string} owner 
 * @param {string} repo 
 * @param {string[]} paths - Array of paths to check
 * @returns {Promise<boolean>} - true if any path exists
 */
async function checkPathsExist(octokit, owner, repo, paths) {
  // Check paths in parallel, return true if any exists
  const results = await Promise.all(
    paths.map(path => checkPathExists(octokit, owner, repo, path))
  );
  return results.some(exists => exists);
}

/**
 * Check if a single path exists in the repository
 */
async function checkPathExists(octokit, owner, repo, path) {
  try {
    await octokit.rest.repos.getContent({ owner, repo, path });
    return true;
  } catch (error) {
    if (error.status === 404) return false;
    // For other errors, assume not exists to avoid blocking
    console.warn(`[Warning] Path check failed for ${path}:`, error.message);
    return false;
  }
}

/**
 * Fetch security alerts count via GraphQL
 * 
 * API Choice: GraphQL vulnerabilityAlerts - the ONLY API that exposes
 * Dependabot vulnerability alerts. REST API doesn't provide this.
 * 
 * Note: Requires repo admin access or security_events scope to see alerts.
 * Returns 0 if access denied (graceful degradation).
 */
async function fetchSecurityAlerts(octokit, owner, repo) {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        vulnerabilityAlerts(states: OPEN, first: 0) {
          totalCount
        }
      }
    }
  `;

  try {
    const result = await octokit.graphql(query, { owner, repo });
    return result.repository?.vulnerabilityAlerts?.totalCount ?? 0;
  } catch (error) {
    // Security alerts require special permissions - graceful degradation
    console.warn(`[Security] Cannot access alerts for ${owner}/${repo} (permission required)`);
    return 0;
  }
}

/**
 * Fetch README data including content for section analysis
 * 
 * API Choice: REST repos.getReadme - returns README content encoded in base64.
 * Single call that includes file size. We decode and analyze content locally.
 */
async function fetchReadmeData(octokit, owner, repo) {
  try {
    const { data } = await octokit.rest.repos.getReadme({ owner, repo });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    // Analyze README content for sections
    const lowerContent = content.toLowerCase();
    const sections = {
      install: /#{1,3}\s*(install|installation|setup|getting started)/i.test(content),
      usage: /#{1,3}\s*(usage|how to use|examples?|quick start)/i.test(content)
    };

    return {
      exists: true,
      length: content.length,
      sections
    };
  } catch (error) {
    if (error.status === 404) {
      return { exists: false, length: 0, sections: { install: false, usage: false } };
    }
    throw error;
  }
}

/**
 * Fetch releases list
 * 
 * API Choice: REST repos.listReleases - simple paginated list.
 * We only need the count, so we fetch first page and use total from response.
 */
async function fetchReleases(octokit, owner, repo) {
  try {
    const { data } = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: 100
    });
    return data || [];
  } catch (error) {
    console.warn(`[Warning] Could not fetch releases for ${owner}/${repo}`);
    return [];
  }
}

/**
 * Check rate limit status
 * 
 * API Choice: REST rateLimit.get - dedicated endpoint for rate limit info.
 * Returns remaining calls and reset timestamp.
 */
async function checkRateLimit(octokit) {
  try {
    const { data } = await octokit.rest.rateLimit.get();
    const core = data.resources.core;
    return {
      limit: core.limit,
      remaining: core.remaining,
      resetTimestamp: core.reset * 1000, // Convert to milliseconds
      resetAt: new Date(core.reset * 1000).toISOString()
    };
  } catch (error) {
    // If rate limit check fails, return safe defaults
    return { limit: 5000, remaining: 100, resetTimestamp: Date.now() + 3600000, resetAt: 'unknown' };
  }
}

/**
 * Build the normalized metrics object from raw data
 */
function buildMetricsObject(owner, repoName, repo, commitActivity, contributors, prMetrics, qualitySignals, readmeData, releases) {
  const now = new Date();
  const createdAt = repo ? new Date(repo.created_at) : now;
  const pushedAt = repo ? new Date(repo.pushed_at) : null;

  // ACTIVITY METRICS
  // Repo age in years
  const repoAgeYears = (now - createdAt) / (365.25 * 24 * 60 * 60 * 1000);

  // Commits per month (rolling average over 30 weeks ≈ 7 months)
  let commitsPerMonth = 0;
  let longestInactivityGapDays = 0;

  if (commitActivity && commitActivity.length > 0) {
    const totalCommits = commitActivity.reduce((sum, week) => sum + week.total, 0);
    const months = COMMIT_WEEKS_WINDOW / 4.33; // ~7 months
    commitsPerMonth = Math.round((totalCommits / months) * 10) / 10;

    // Find longest inactivity gap
    let currentGap = 0;
    for (const week of commitActivity) {
      if (week.total === 0) {
        currentGap++;
      } else {
        longestInactivityGapDays = Math.max(longestInactivityGapDays, currentGap * 7);
        currentGap = 0;
      }
    }
    // Check final gap
    longestInactivityGapDays = Math.max(longestInactivityGapDays, currentGap * 7);
  }

  // COLLABORATION METRICS
  // External contributors (everyone except the owner)
  const externalContributorsCount = contributors
    ? contributors.filter(c => c.login.toLowerCase() !== owner.toLowerCase()).length
    : 0;

  // PR metrics with merge rate calculation
  const mergeRate = prMetrics && prMetrics.totalPRs > 0
    ? Math.round((prMetrics.mergedPRs / prMetrics.totalPRs) * 100) / 100
    : 0;

  // HYGIENE: Check for CHANGELOG.md
  // Note: We don't make a separate API call for this, we rely on releases count
  const hasChangelog = releases && releases.length > 0;

  return {
    repository: repoName,
    url: `https://github.com/${owner}/${repoName}`,
    analyzedAt: now.toISOString(),

    activity: {
      repoAgeYears: Math.round(repoAgeYears * 10) / 10,
      commitsPerMonth,
      longestInactivityGapDays,
      lastPushDate: pushedAt ? pushedAt.toISOString() : null
    },

    collaboration: {
      totalPRs: prMetrics?.totalPRs ?? 0,
      prsMerged: prMetrics?.mergedPRs ?? 0,
      prsClosed: prMetrics?.closedPRs ?? 0,
      prsOpen: prMetrics?.openPRs ?? 0,
      mergeRate,
      averagePRSizeFiles: prMetrics?.averagePRSizeFiles ?? 0,
      externalContributorsCount
    },

    qualitySignals: {
      hasTests: qualitySignals?.hasTests ?? false,
      hasCI: qualitySignals?.hasCI ?? false,
      hasLinters: qualitySignals?.hasLinters ?? { eslint: false, prettier: false, biome: false },
      openSecurityAlertsCount: qualitySignals?.openSecurityAlertsCount ?? 0
    },

    hygiene: {
      readmeLength: readmeData?.length ?? 0,
      readmeSections: readmeData?.sections ?? { install: false, usage: false },
      hasLicense: repo?.license !== null,
      licenseType: repo?.license?.spdx_id ?? null,
      hasChangelog,
      releasesCount: releases?.length ?? 0
    },

    // Gaming detection data (for anti-gaming heuristics)
    _gamingDetection: buildGamingDetectionData(
      repo,
      commitActivity,
      prMetrics,
      createdAt
    )
  };
}

/**
 * Build gaming detection data from raw metrics
 * This data is used by detectGamingFlags to identify suspicious patterns
 */
function buildGamingDetectionData(repo, commitActivity, prMetrics, createdAt) {
  const data = {
    isFork: prMetrics?.isFork ?? false,
    parentRepo: prMetrics?.parentRepo ?? null,
    totalIssues: prMetrics?.totalIssues ?? 0,
    avgFilesPerCommit: prMetrics?.avgFilesPerCommit ?? null,
    recentCommitDates: prMetrics?.recentCommitDates ?? [],
    createdAt: createdAt?.toISOString() ?? null
  };

  // Analyze commit activity for burst patterns
  if (commitActivity && commitActivity.length > 0) {
    const totalCommits = commitActivity.reduce((sum, week) => sum + week.total, 0);
    const maxWeekCommits = Math.max(...commitActivity.map(w => w.total));
    const weeksWithCommits = commitActivity.filter(w => w.total > 0).length;

    data.totalCommitsInWindow = totalCommits;
    data.maxWeekCommits = maxWeekCommits;
    data.weeksWithActivity = weeksWithCommits;
    data.commitConcentration = totalCommits > 0 ? maxWeekCommits / totalCommits : 0;

    // Detect burst weeks (weeks with unusually high activity)
    const burstWeeks = commitActivity.filter(
      w => w.total >= GAMING_DETECTION_CONFIG.commitBurst.weeklyBurstThreshold
    ).length;
    data.burstWeeksCount = burstWeeks;
  } else {
    data.totalCommitsInWindow = 0;
    data.maxWeekCommits = 0;
    data.weeksWithActivity = 0;
    data.commitConcentration = 0;
    data.burstWeeksCount = 0;
  }

  // Calculate initial burst (commits in first week after creation)
  if (createdAt && prMetrics?.recentCommitDates?.length > 0) {
    const initialPeriodEnd = new Date(createdAt);
    initialPeriodEnd.setDate(initialPeriodEnd.getDate() + GAMING_DETECTION_CONFIG.creationSpike.initialPeriodDays);

    const initialPeriodCommits = prMetrics.recentCommitDates.filter(dateStr => {
      const commitDate = new Date(dateStr);
      return commitDate >= createdAt && commitDate <= initialPeriodEnd;
    }).length;

    data.initialPeriodCommits = initialPeriodCommits;
  } else {
    data.initialPeriodCommits = 0;
  }

  return data;
}

/**
 * Utility: Unwrap Promise.allSettled result
 */
function unwrap(result) {
  return result?.status === 'fulfilled' ? result.value : null;
}

/**
 * Utility: Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Compute activity score (0-10)
 * 
 * Factors:
 * - Commits per month in healthy range (+)
 * - Commit spam (extreme high frequency) (-)
 * - Inactivity gaps (-)
 * - Days since last push (-)
 * - Repo maturity/age (+)
 */
function computeActivityScore(activity) {
  const { idealCommitsPerMonth, commitSpamThreshold, inactivityDaysWarning, inactivityDaysCritical, maxAgeBonus } = SCORING_CONFIG.activity;

  let score = 5; // Start at neutral

  // Commits per month scoring
  const cpm = activity.commitsPerMonth;
  if (cpm >= idealCommitsPerMonth.min && cpm <= idealCommitsPerMonth.max) {
    score += 2; // Healthy activity
  } else if (cpm < idealCommitsPerMonth.min) {
    score -= 1; // Low activity
  } else if (cpm > commitSpamThreshold) {
    score -= 3; // Possible commit spam
  } else if (cpm > idealCommitsPerMonth.max) {
    score += 1; // High but not spam
  }

  // Inactivity gap penalty
  const gap = activity.longestInactivityGapDays;
  if (gap > inactivityDaysCritical) {
    score -= 2;
  } else if (gap > inactivityDaysWarning) {
    score -= 1;
  }

  // Days since last push
  if (activity.daysSinceLastPush !== null) {
    if (activity.daysSinceLastPush > inactivityDaysCritical) {
      score -= 2; // Abandoned
    } else if (activity.daysSinceLastPush > inactivityDaysWarning) {
      score -= 1;
    } else if (activity.daysSinceLastPush < 30) {
      score += 1; // Recently active
    }
  }

  // Maturity bonus
  if (activity.repoAgeYears >= maxAgeBonus) {
    score += 1;
  } else if (activity.repoAgeYears >= 1) {
    score += 0.5;
  }

  return clampScore(score);
}

/**
 * Compute collaboration score (0-10)
 * 
 * Factors:
 * - Healthy PR merge rate (+)
 * - External contributors (+)
 * - Reasonable PR sizes (+)
 * - Giant/bloated PRs (-)
 * - Very low merge rate (-)
 */
function computeCollaborationScore(collaboration) {
  const { idealMergeRate, giantPRThreshold, idealPRSize, minExternalContributors } = SCORING_CONFIG.collaboration;

  let score = 5;

  // No PRs at all - could be solo dev or not using PRs
  if (collaboration.totalPRs === 0) {
    return 5; // Neutral - can't judge without data
  }

  // Merge rate
  const mr = collaboration.mergeRate;
  if (mr >= idealMergeRate.min && mr <= idealMergeRate.max) {
    score += 2;
  } else if (mr < 0.3) {
    score -= 2; // Too many rejected PRs
  } else if (mr > 0.98) {
    score -= 0.5; // Suspiciously high - might not have review process
  }

  // External contributors
  if (collaboration.externalContributorsCount >= 3) {
    score += 2;
  } else if (collaboration.externalContributorsCount >= minExternalContributors) {
    score += 1;
  }

  // PR size
  const prSize = collaboration.averagePRSizeFiles;
  if (prSize >= idealPRSize.min && prSize <= idealPRSize.max) {
    score += 1;
  } else if (prSize > giantPRThreshold) {
    score -= 2; // Giant PRs are a code smell
  } else if (prSize > idealPRSize.max) {
    score -= 0.5;
  }

  // Open PRs stagnation (if many open vs total)
  if (collaboration.totalPRs > 5) {
    const openRatio = collaboration.prsOpen / collaboration.totalPRs;
    if (openRatio > 0.5) {
      score -= 1; // Half or more PRs are stale
    }
  }

  return clampScore(score);
}

/**
 * Compute quality signals score (0-10)
 * 
 * Factors:
 * - Tests presence (+)
 * - CI configured (+)
 * - Linters configured (+)
 * - Security alerts (-)
 */
function computeQualityScore(qualitySignals) {
  const { testsWeight, ciWeight, lintersWeight, securityWeight } = SCORING_CONFIG.qualitySignals;
  const totalWeight = testsWeight + ciWeight + lintersWeight + securityWeight;

  let weightedScore = 0;

  // Tests (3 points)
  if (qualitySignals.hasTests) {
    weightedScore += testsWeight;
  }

  // CI (3 points)
  if (qualitySignals.hasCI) {
    weightedScore += ciWeight;
  }

  // Linters (2 points, partial for any linter)
  const linters = qualitySignals.hasLinters;
  const hasAnyLinter = linters.eslint || linters.prettier || linters.biome;
  const hasMultipleLinters = [linters.eslint, linters.prettier, linters.biome].filter(Boolean).length >= 2;
  if (hasMultipleLinters) {
    weightedScore += lintersWeight;
  } else if (hasAnyLinter) {
    weightedScore += lintersWeight * 0.5;
  }

  // Security alerts penalty (2 points deducted for many alerts)
  const alerts = qualitySignals.openSecurityAlertsCount;
  if (alerts === 0) {
    weightedScore += securityWeight;
  } else if (alerts <= 2) {
    weightedScore += securityWeight * 0.5;
  } else if (alerts >= 10) {
    weightedScore -= 1; // Extra penalty for many alerts
  }

  // Normalize to 0-10
  return clampScore((weightedScore / totalWeight) * 10);
}

/**
 * Compute documentation score (0-10)
 * 
 * Factors:
 * - README presence and length (+)
 * - README sections (install, usage) (+)
 * - License (+)
 * - Releases/changelog (+)
 */
function computeDocumentationScore(hygiene) {
  const { minReadmeLength, goodReadmeLength, excellentReadmeLength } = SCORING_CONFIG.documentation;

  let score = 0;

  // README length (0-4 points)
  const len = hygiene.readmeLength;
  if (len >= excellentReadmeLength) {
    score += 4;
  } else if (len >= goodReadmeLength) {
    score += 3;
  } else if (len >= minReadmeLength) {
    score += 2;
  } else if (len > 0) {
    score += 1;
  }

  // README sections (2 points)
  if (hygiene.readmeSections?.install) score += 1;
  if (hygiene.readmeSections?.usage) score += 1;

  // License (2 points)
  if (hygiene.hasLicense) {
    score += 2;
  }

  // Releases (2 points)
  if (hygiene.releasesCount >= 5) {
    score += 2;
  } else if (hygiene.releasesCount >= 1) {
    score += 1;
  }

  return clampScore(score);
}

/**
 * Clamp score to 0-10 range and round to 1 decimal
 */
function clampScore(score) {
  return Math.round(Math.max(0, Math.min(10, score)) * 10) / 10;
}

// ============================================================================
// RISK FLAGS AND STRENGTHS DETECTION
// ============================================================================

/**
 * Detect risk flags from metrics data
 * 
 * Includes both quality risk flags and anti-gaming heuristics.
 * These flags are for downstream human/LLM review - they do NOT block candidates.
 */
function detectRiskFlags(metrics) {
  const flags = [];
  const gaming = metrics._gamingDetection || {};

  // =========================================================================
  // ANTI-GAMING HEURISTICS (detect potential profile manipulation)
  // =========================================================================

  // 1. COMMIT BURST: Concentrated activity in single week
  // Gaming pattern: Bulk commits before a job application
  if (gaming.commitConcentration > GAMING_DETECTION_CONFIG.commitBurst.singleWeekConcentrationThreshold &&
    gaming.totalCommitsInWindow >= GAMING_DETECTION_CONFIG.commitBurst.minCommitsForConcentrationCheck) {
    flags.push({
      flag: 'gaming:commit_burst',
      reason: `${Math.round(gaming.commitConcentration * 100)}% of commits in single week`,
      severity: 'medium'
    });
  }

  // 2. WEEKLY SPIKE: Unusually high commits in one or more weeks
  if (gaming.burstWeeksCount > 0) {
    flags.push({
      flag: 'gaming:weekly_spike',
      reason: `${gaming.burstWeeksCount} week(s) with ${GAMING_DETECTION_CONFIG.commitBurst.weeklyBurstThreshold}+ commits`,
      severity: gaming.burstWeeksCount > 2 ? 'high' : 'low'
    });
  }

  // 3. LOW FILE DIVERSITY: Many commits but few files changed per commit
  // Gaming pattern: Trivial commits (single character changes, whitespace)
  const avgFiles = gaming.avgFilesPerCommit;
  if (avgFiles !== null &&
    avgFiles < GAMING_DETECTION_CONFIG.fileDiversity.minFilesPerCommitHealthy &&
    gaming.totalCommitsInWindow > 30) {
    flags.push({
      flag: 'gaming:low_file_diversity',
      reason: `Avg ${avgFiles} files/commit (${gaming.totalCommitsInWindow} commits sampled)`,
      severity: avgFiles < 1 ? 'high' : 'medium'
    });
  }

  // 4. HIGH COMMIT / LOW PR RATIO: Suspicious activity pattern
  // Gaming pattern: Direct pushes to avoid PR review, or commits to personal branch only
  const { highCommitLowPRThreshold } = GAMING_DETECTION_CONFIG.activityMismatch;
  const monthlyCommits = metrics.activity.commitsPerMonth * 7; // ~7 months window
  const totalPRs = metrics.collaboration.totalPRs;
  if (monthlyCommits > highCommitLowPRThreshold.commits) {
    const prRatio = monthlyCommits > 0 ? totalPRs / monthlyCommits : 0;
    if (prRatio < highCommitLowPRThreshold.maxPRRatio) {
      flags.push({
        flag: 'gaming:high_commit_low_pr',
        reason: `${Math.round(monthlyCommits)} commits but only ${totalPRs} PRs (ratio: ${Math.round(prRatio * 100)}%)`,
        severity: 'medium'
      });
    }
  }

  // 5. HIGH COMMIT / NO ISSUES: Not using issue tracker
  // Gaming pattern: Solo work without planning, or gaming commits
  if (metrics.activity.commitsPerMonth > GAMING_DETECTION_CONFIG.activityMismatch.highCommitNoIssueThreshold &&
    gaming.totalIssues === 0) {
    flags.push({
      flag: 'gaming:no_issue_tracking',
      reason: `${metrics.activity.commitsPerMonth} commits/month but 0 issues ever created`,
      severity: 'low'
    });
  }

  // 6. FORK-ONLY REPO: Repo is a fork with minimal unique work
  // Gaming pattern: Forking popular repos to pad portfolio
  if (gaming.isFork) {
    const uniqueCommits = gaming.totalCommitsInWindow;
    if (uniqueCommits < GAMING_DETECTION_CONFIG.forkOnly.minUniqueCommitsToCount) {
      flags.push({
        flag: 'gaming:fork_minimal_contribution',
        reason: `Fork of ${gaming.parentRepo || 'unknown'} with only ${uniqueCommits} commits in analysis window`,
        severity: 'high'
      });
    } else {
      // Still flag as fork but lower severity
      flags.push({
        flag: 'info:is_fork',
        reason: `Fork of ${gaming.parentRepo || 'unknown'}`,
        severity: 'info'
      });
    }
  }

  // 7. CREATION SPIKE: Heavy commits right after repo creation
  // Gaming pattern: Bulk uploading existing code or generated content
  if (gaming.initialPeriodCommits >= GAMING_DETECTION_CONFIG.creationSpike.artificialBurstThreshold) {
    flags.push({
      flag: 'gaming:creation_spike',
      reason: `${gaming.initialPeriodCommits} commits in first ${GAMING_DETECTION_CONFIG.creationSpike.initialPeriodDays} days`,
      severity: 'medium'
    });
  }

  // =========================================================================
  // QUALITY RISK FLAGS (original functionality)
  // =========================================================================

  // Abandoned repo
  if (metrics.activity.daysSinceLastPush > 180) {
    flags.push({
      flag: 'quality:abandoned',
      reason: `No activity for ${metrics.activity.daysSinceLastPush} days`,
      severity: 'high'
    });
  }

  // Commit spam (extreme volume)
  if (metrics.activity.commitsPerMonth > 100) {
    flags.push({
      flag: 'quality:commit_spam',
      reason: `${metrics.activity.commitsPerMonth} commits/month is unusually high`,
      severity: 'medium'
    });
  }

  // Giant PRs
  if (metrics.collaboration.averagePRSizeFiles > 50) {
    flags.push({
      flag: 'quality:giant_prs',
      reason: `Avg PR size ${metrics.collaboration.averagePRSizeFiles} files`,
      severity: 'low'
    });
  }

  // No tests
  if (!metrics.qualitySignals.hasTests) {
    flags.push({
      flag: 'quality:no_tests',
      reason: 'No test directory detected',
      severity: 'medium'
    });
  }

  // Security alerts
  if (metrics.qualitySignals.openSecurityAlertsCount > 5) {
    flags.push({
      flag: 'quality:security_alerts',
      reason: `${metrics.qualitySignals.openSecurityAlertsCount} open security alerts`,
      severity: 'high'
    });
  }

  // Poor documentation
  if (metrics.hygiene.readmeLength < 100) {
    flags.push({
      flag: 'quality:poor_docs',
      reason: 'README missing or very short',
      severity: 'low'
    });
  }

  // Stale PRs
  if (metrics.collaboration.totalPRs > 5 &&
    metrics.collaboration.prsOpen / metrics.collaboration.totalPRs > 0.5) {
    flags.push({
      flag: 'quality:stale_prs',
      reason: `${Math.round(metrics.collaboration.prsOpen / metrics.collaboration.totalPRs * 100)}% of PRs still open`,
      severity: 'low'
    });
  }

  // No license
  if (!metrics.hygiene.hasLicense) {
    flags.push({
      flag: 'quality:no_license',
      reason: 'No license file detected',
      severity: 'info'
    });
  }

  // Sort by severity and limit to avoid noise
  const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return flags.slice(0, 5); // Max 5 flags per requirement
}

/**
 * Detect strengths from metrics data
 */
function detectStrengths(metrics) {
  const strengths = [];

  // Well maintained
  if (metrics.activity.daysSinceLastPush !== null &&
    metrics.activity.daysSinceLastPush < 30 &&
    metrics.activity.commitsPerMonth >= 2) {
    strengths.push('actively_maintained');
  }

  // Good collaboration
  if (metrics.collaboration.externalContributorsCount >= 3) {
    strengths.push('community_driven');
  }

  // Clean PR process
  if (metrics.collaboration.mergeRate >= 0.6 &&
    metrics.collaboration.mergeRate <= 0.95 &&
    metrics.collaboration.averagePRSizeFiles <= 15) {
    strengths.push('clean_pr_workflow');
  }

  // Comprehensive testing
  if (metrics.qualitySignals.hasTests && metrics.qualitySignals.hasCI) {
    strengths.push('tested_with_ci');
  }

  // Well documented
  if (metrics.hygiene.readmeLength >= 2000 &&
    metrics.hygiene.readmeSections?.install &&
    metrics.hygiene.readmeSections?.usage) {
    strengths.push('well_documented');
  }

  // Regular releases
  if (metrics.hygiene.releasesCount >= 5) {
    strengths.push('versioned_releases');
  }

  // Mature project
  if (metrics.activity.repoAgeYears >= 2 &&
    metrics.activity.longestInactivityGapDays < 90) {
    strengths.push('mature_stable');
  }

  // Linted codebase
  const linters = metrics.qualitySignals.hasLinters;
  if (linters.eslint || linters.prettier || linters.biome) {
    strengths.push('code_quality_tools');
  }

  return strengths.slice(0, 5); // Max 5 strengths per requirement
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

/**
 * Generate LLM-optimized summary with scores and signals
 * 
 * Constraints:
 * - Max depth: 3
 * - No arrays longer than 5 items
 * - No raw timestamps (relative values only)
 * 
 * @param {Object} metrics - Full metrics object from buildMetricsObject
 * @returns {Object} - Compact summary optimized for LLM input
 */
function generateSummary(metrics) {
  // Add derived fields needed for scoring
  const enrichedMetrics = enrichMetricsForScoring(metrics);

  // Compute scores
  const scores = {
    activity: computeActivityScore(enrichedMetrics.activity),
    collaboration: computeCollaborationScore(enrichedMetrics.collaboration),
    quality_signals: computeQualityScore(enrichedMetrics.qualitySignals),
    documentation: computeDocumentationScore(enrichedMetrics.hygiene)
  };

  // Compute overall (weighted average)
  scores.overall = clampScore(
    (scores.activity * 0.25) +
    (scores.collaboration * 0.2) +
    (scores.quality_signals * 0.3) +
    (scores.documentation * 0.25)
  );

  // Build compact signals object (depth 2)
  const signals = {
    activity: {
      commits_monthly: enrichedMetrics.activity.commitsPerMonth,
      last_push: formatRelativeTime(enrichedMetrics.activity.daysSinceLastPush),
      age: `${enrichedMetrics.activity.repoAgeYears}y`,
      max_gap: `${enrichedMetrics.activity.longestInactivityGapDays}d`
    },
    collaboration: {
      prs: enrichedMetrics.collaboration.totalPRs,
      merge_rate: `${Math.round(enrichedMetrics.collaboration.mergeRate * 100)}%`,
      pr_size_avg: enrichedMetrics.collaboration.averagePRSizeFiles,
      contributors: enrichedMetrics.collaboration.externalContributorsCount + 1 // +1 for owner
    },
    quality: {
      tests: enrichedMetrics.qualitySignals.hasTests,
      ci: enrichedMetrics.qualitySignals.hasCI,
      linters: countLinters(enrichedMetrics.qualitySignals.hasLinters),
      security_issues: enrichedMetrics.qualitySignals.openSecurityAlertsCount
    },
    docs: {
      readme_size: categorizeReadmeSize(enrichedMetrics.hygiene.readmeLength),
      has_install: enrichedMetrics.hygiene.readmeSections?.install ?? false,
      has_usage: enrichedMetrics.hygiene.readmeSections?.usage ?? false,
      license: enrichedMetrics.hygiene.licenseType || 'none',
      releases: enrichedMetrics.hygiene.releasesCount
    }
  };

  return {
    repo: metrics.repository,
    scores,
    signals,
    risk_flags: detectRiskFlags(enrichedMetrics),
    strengths: detectStrengths(enrichedMetrics)
  };
}

/**
 * Enrich metrics object with derived fields for scoring
 */
function enrichMetricsForScoring(metrics) {
  const now = new Date();
  let daysSinceLastPush = null;

  if (metrics.activity.lastPushDate) {
    const lastPush = new Date(metrics.activity.lastPushDate);
    daysSinceLastPush = Math.floor((now - lastPush) / (1000 * 60 * 60 * 24));
  }

  return {
    ...metrics,
    activity: {
      ...metrics.activity,
      daysSinceLastPush
    }
  };
}

/**
 * Format days to relative time string
 */
function formatRelativeTime(days) {
  if (days === null || days === undefined) return 'unknown';
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * Count active linters
 */
function countLinters(linters) {
  if (!linters) return 0;
  return [linters.eslint, linters.prettier, linters.biome].filter(Boolean).length;
}

/**
 * Categorize README size
 */
function categorizeReadmeSize(length) {
  if (length >= 5000) return 'comprehensive';
  if (length >= 2000) return 'good';
  if (length >= 500) return 'basic';
  if (length > 0) return 'minimal';
  return 'none';
}

// ============================================================================
// ENHANCED EXPORTS
// ============================================================================

/**
 * Analyze repositories and return both full metrics and LLM summaries
 * 
 * @param {Octokit} octokit - Pre-authenticated Octokit instance
 * @param {string} username - GitHub username (repository owner)
 * @param {string[]} repositories - List of repository names to analyze
 * @param {Object} options - Options
 * @param {boolean} options.includeFull - Include full metrics (default: true)
 * @param {boolean} options.includeSummary - Include LLM summary (default: true)
 * @returns {Promise<Object[]>} - Array of result objects per repository
 */
export async function analyzeRepositoriesWithScoring(octokit, username, repositories, options = {}) {
  const { includeFull = true, includeSummary = true } = options;

  // Get base metrics
  const baseResults = await analyzeRepositories(octokit, username, repositories);

  // Enhance with scoring and summaries
  return baseResults.map(metrics => {
    if (metrics.error) {
      return metrics; // Pass through errors
    }

    const result = {};

    if (includeFull) {
      result.metrics = metrics;
    }

    if (includeSummary) {
      result.summary = generateSummary(metrics);
    }

    return includeFull && includeSummary ? result : (includeSummary ? result.summary : metrics);
  });
}

/**
 * Generate summary for existing metrics object
 * Useful when you already have metrics and just need the summary
 */
export { generateSummary };

// Default export as object with main function
export default {
  analyzeRepositories,
  analyzeRepositoriesWithScoring,
  generateSummary,

  // Export individual functions for testing/advanced usage
  analyzeRepository,
  fetchRepoMetadata,
  fetchCommitActivity,
  fetchContributors,
  fetchPRMetrics,
  fetchQualitySignals,
  fetchReadmeData,
  fetchReleases,
  checkRateLimit,

  // Scoring functions
  computeActivityScore,
  computeCollaborationScore,
  computeQualityScore,
  computeDocumentationScore,
  detectRiskFlags,
  detectStrengths
};
