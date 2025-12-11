// API service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Upload file
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data to form
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`File upload failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Test API connection
  async testConnection() {
    return this.get('/test');
  }

  // ===== Authentication Methods =====

  // Request nonce for wallet authentication
  async requestNonce(walletAddress) {
    return this.post('/auth/nonce', { walletAddress });
  }

  // Verify wallet signature and get JWT token
  async verifyWalletSignature(walletAddress, signature, nonce, firebaseToken = null) {
    const response = await this.post('/auth/wallet-verify', {
      walletAddress,
      signature,
      nonce,
      firebaseToken
    });
    
    // Set the token for future requests
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  // Refresh JWT token
  async refreshToken() {
    return this.post('/auth/refresh');
  }

  // Get current user profile
  async getProfile() {
    return this.get('/auth/profile');
  }

  // Register user with role
  async registerUser(userData, firebaseToken) {
    // Temporarily set the Firebase token for registration
    const previousToken = this.token;
    this.setToken(firebaseToken);
    
    try {
      const response = await this.post('/auth/register', userData);
      
      // Set the JWT token from response
      if (response.token) {
        this.setToken(response.token);
      }
      
      return response;
    } catch (error) {
      // Restore previous token on error
      this.setToken(previousToken);
      throw error;
    }
  }

  // Logout
  async logout() {
    const response = await this.post('/auth/logout');
    this.setToken(null);
    return response;
  }

  // ===== User Profile Methods =====

  // Get user profile by ID
  async getUserProfile(userId) {
    return this.get(`/users/${userId}`);
  }

  // Update current user profile
  async updateProfile(profileData) {
    return this.put('/users/profile', profileData);
  }

  // Upload profile image
  async uploadProfileImage(imageFile) {
    return this.uploadFile('/users/upload-image', imageFile);
  }

  // Search users
  async searchUsers(query, options = {}) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (options.limit) params.append('limit', options.limit);
    if (options.skip) params.append('skip', options.skip);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    
    return this.get(`/users/search?${params.toString()}`);
  }

  // Get all users with pagination
  async getUsers(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.skip) params.append('skip', options.skip);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    
    return this.get(`/users?${params.toString()}`);
  }

  // Check username availability
  async checkUsernameAvailability(username) {
    return this.post('/auth/check-username', { username });
  }

  // ===== Candidate Profile Methods =====

  // Create candidate profile
  async createCandidateProfile(profileData) {
    return this.post('/users/candidate-profile', profileData);
  }

  // Get current user's candidate profile
  async getCandidateProfile() {
    return this.get('/users/candidate-profile');
  }

  // Update current user's candidate profile
  async updateCandidateProfile(profileData) {
    return this.put('/users/candidate-profile', profileData);
  }

  // ===== Recruiter Profile Methods =====

  // Create recruiter profile
  async createRecruiterProfile(profileData) {
    return this.post('/users/recruiter-profile', profileData);
  }

  // Get current user's recruiter profile
  async getRecruiterProfile() {
    return this.get('/users/recruiter-profile');
  }

  // Update current user's recruiter profile
  async updateRecruiterProfile(profileData) {
    return this.put('/users/recruiter-profile', profileData);
  }

  // ===== Gig Methods =====

  // Create a new gig
  async createGig(gigData) {
    return this.post('/gigs', gigData);
  }

  // Get all gigs with filters
  async getGigs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.currency) params.append('currency', filters.currency);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    return this.get(`/gigs?${params.toString()}`);
  }

  // Get featured gigs
  async getFeaturedGigs(limit = 10) {
    return this.get(`/gigs/featured?limit=${limit}`);
  }

  // Get gigs by category
  async getGigsByCategory(category, options = {}) {
    const params = new URLSearchParams();
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    
    return this.get(`/gigs/category/${category}?${params.toString()}`);
  }

  // Search gigs
  async searchGigs(query, options = {}) {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    
    return this.get(`/gigs/search?${params.toString()}`);
  }

  // Get gig by ID
  async getGigById(gigId, incrementView = false) {
    return this.get(`/gigs/${gigId}?incrementView=${incrementView}`);
  }

  // Get gigs by owner
  async getGigsByOwner(ownerId, includeInactive = false) {
    return this.get(`/gigs/owner/${ownerId}?includeInactive=${includeInactive}`);
  }

  // Update gig
  async updateGig(gigId, gigData) {
    return this.put(`/gigs/${gigId}`, gigData);
  }

  // Delete gig
  async deleteGig(gigId) {
    return this.delete(`/gigs/${gigId}`);
  }

  // ===== Price Methods =====

  // Get all cryptocurrency prices
  async getCryptoPrices() {
    return this.get('/prices');
  }

  // Get price for specific currency
  async getPrice(currency) {
    return this.get(`/prices/${currency}`);
  }

  // Convert crypto to USD
  async convertToUSD(amount, currency) {
    return this.post('/prices/convert-to-usd', { amount, currency });
  }

  // Convert USD to crypto
  async convertFromUSD(usdAmount, currency) {
    return this.post('/prices/convert-from-usd', { usdAmount, currency });
  }

  // ===== Portfolio Analysis Methods =====

  // Trigger portfolio analysis
  async analyzePortfolio(candidateId, portfolioUrl = null, githubUrl = null) {
    return this.post('/portfolio/analyze', {
      candidateId,
      portfolioUrl,
      githubUrl
    });
  }

  // Get latest analysis results
  async getPortfolioAnalysis(candidateId) {
    return this.get(`/portfolio/analysis/${candidateId}`);
  }

  // Get improvement suggestions
  async getImprovementSuggestions(candidateId) {
    return this.get(`/portfolio/suggestions/${candidateId}`);
  }

  // Get analysis history
  async getAnalysisHistory(candidateId) {
    return this.get(`/portfolio/history/${candidateId}`);
  }

  // Check analysis status
  async getAnalysisStatus(candidateId) {
    return this.get(`/portfolio/status/${candidateId}`);
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for testing or multiple instances
export default ApiService;