/**
 * GitHub OAuth Service
 * 
 * Minimal OAuth flow for GitHub Apps authentication in a SaaS context.
 * Returns authenticated Octokit instances from OAuth tokens.
 * 
 * Prerequisites:
 * - Register a GitHub OAuth App at https://github.com/settings/developers
 * - Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in environment
 * - Configure callback URL in OAuth App settings
 * 
 * @module githubOAuthService
 */

import { Octokit } from '@octokit/rest';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GITHUB_OAUTH_CONFIG = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    // Scopes needed for repository analysis
    scopes: ['read:user', 'repo'],
    // GitHub OAuth endpoints
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user'
};

// ============================================================================
// TOKEN STORAGE INTERFACE (Abstract - implement per your DB/session layer)
// ============================================================================

/**
 * @typedef {Object} TokenStorage
 * @property {function(string, TokenData): Promise<void>} save - Save token for user
 * @property {function(string): Promise<TokenData|null>} get - Get token for user
 * @property {function(string): Promise<void>} delete - Delete token for user
 * 
 * @typedef {Object} TokenData
 * @property {string} accessToken - GitHub access token
 * @property {string} tokenType - Token type (usually 'bearer')
 * @property {string} scope - Granted scopes
 * @property {Date} createdAt - When token was created
 */

/**
 * In-memory token storage for development/testing only.
 * Replace with your actual storage implementation (Redis, DB, etc.)
 */
const memoryStorage = new Map();

const defaultTokenStorage = {
    async save(userId, tokenData) {
        memoryStorage.set(userId, tokenData);
    },
    async get(userId) {
        return memoryStorage.get(userId) || null;
    },
    async delete(userId) {
        memoryStorage.delete(userId);
    }
};

// ============================================================================
// OAUTH FLOW
// ============================================================================

/**
 * Generate the GitHub OAuth authorization URL.
 * Redirect users to this URL to begin the OAuth flow.
 * 
 * @param {Object} options
 * @param {string} options.state - CSRF protection token (store in session)
 * @param {string} [options.redirectUri] - Override callback URL
 * @returns {string} - Full authorization URL
 */
export function getAuthorizationUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
        client_id: GITHUB_OAUTH_CONFIG.clientId,
        scope: GITHUB_OAUTH_CONFIG.scopes.join(' '),
        state,
        allow_signup: 'true'
    });

    if (redirectUri) {
        params.set('redirect_uri', redirectUri);
    }

    return `${GITHUB_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange OAuth authorization code for access token.
 * Call this in your OAuth callback route after GitHub redirects back.
 * 
 * @param {string} code - Authorization code from GitHub callback
 * @returns {Promise<TokenData>} - Token data to store
 * @throws {Error} - If token exchange fails
 */
export async function exchangeCodeForToken(code) {
    const response = await fetch(GITHUB_OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: GITHUB_OAUTH_CONFIG.clientId,
            client_secret: GITHUB_OAUTH_CONFIG.clientSecret,
            code
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        scope: data.scope,
        createdAt: new Date()
    };
}

/**
 * Fetch the authenticated GitHub user's profile.
 * Use after token exchange to get user identity.
 * 
 * @param {string} accessToken - Valid GitHub access token
 * @returns {Promise<Object>} - GitHub user object (id, login, email, etc.)
 */
export async function fetchGitHubUser(accessToken) {
    const response = await fetch(GITHUB_OAUTH_CONFIG.userUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch GitHub user: ${response.status}`);
    }

    return response.json();
}

// ============================================================================
// OCTOKIT FACTORY
// ============================================================================

/**
 * Create an authenticated Octokit instance from a stored token.
 * This is the main handoff point for using the GitHub API.
 * 
 * @param {string} accessToken - Valid GitHub OAuth access token
 * @returns {Octokit} - Authenticated Octokit instance
 */
export function createOctokitFromToken(accessToken) {
    return new Octokit({
        auth: accessToken,
        userAgent: 'SaaS-GitHub-Analyzer/1.0',
        // Optional: Add retries for rate limiting
        request: {
            retries: 3,
            retryAfter: 60
        }
    });
}

/**
 * Get an authenticated Octokit instance for a user.
 * Retrieves stored token and creates Octokit.
 * 
 * @param {string} userId - Your app's user ID
 * @param {TokenStorage} [tokenStorage] - Token storage implementation
 * @returns {Promise<Octokit|null>} - Octokit instance or null if no token
 */
export async function getOctokitForUser(userId, tokenStorage = defaultTokenStorage) {
    const tokenData = await tokenStorage.get(userId);

    if (!tokenData?.accessToken) {
        return null;
    }

    return createOctokitFromToken(tokenData.accessToken);
}

/**
 * Verify a token is still valid by making a test API call.
 * 
 * @param {string} accessToken - Token to verify
 * @returns {Promise<{valid: boolean, user?: Object, error?: string}>}
 */
export async function verifyToken(accessToken) {
    try {
        const user = await fetchGitHubUser(accessToken);
        return { valid: true, user };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// ============================================================================
// COMPLETE OAUTH CALLBACK HANDLER
// ============================================================================

/**
 * Complete OAuth callback handler.
 * Call this in your /auth/github/callback route.
 * 
 * @param {Object} options
 * @param {string} options.code - Auth code from GitHub
 * @param {string} options.state - State param for CSRF validation
 * @param {string} options.expectedState - State stored in session
 * @param {TokenStorage} [options.tokenStorage] - Storage implementation
 * @returns {Promise<{user: Object, octokit: Octokit, tokenData: TokenData}>}
 * @throws {Error} - If state mismatch or auth fails
 * 
 * @example
 * // In your callback route handler:
 * app.get('/auth/github/callback', async (req, res) => {
 *   try {
 *     const { user, octokit } = await handleOAuthCallback({
 *       code: req.query.code,
 *       state: req.query.state,
 *       expectedState: req.session.oauthState,
 *       tokenStorage: myDbTokenStorage
 *     });
 *     
 *     req.session.userId = user.id;
 *     res.redirect('/dashboard');
 *   } catch (err) {
 *     res.redirect('/login?error=auth_failed');
 *   }
 * });
 */
export async function handleOAuthCallback({
    code,
    state,
    expectedState,
    tokenStorage = defaultTokenStorage
}) {
    // CSRF protection
    if (state !== expectedState) {
        throw new Error('OAuth state mismatch - possible CSRF attack');
    }

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code);

    // Fetch user info
    const user = await fetchGitHubUser(tokenData.accessToken);

    // Store token
    await tokenStorage.save(String(user.id), tokenData);

    // Create Octokit instance
    const octokit = createOctokitFromToken(tokenData.accessToken);

    return { user, octokit, tokenData };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // OAuth flow
    getAuthorizationUrl,
    exchangeCodeForToken,
    handleOAuthCallback,

    // User fetching
    fetchGitHubUser,
    verifyToken,

    // Octokit creation
    createOctokitFromToken,
    getOctokitForUser,

    // Config (for inspection)
    config: GITHUB_OAUTH_CONFIG
};
