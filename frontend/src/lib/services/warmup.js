// Backend warmup service to prevent cold starts
import { apiService } from './api.js';

class WarmupService {
  constructor() {
    this.isWarming = false;
    this.isWarmed = false;
    this.warmupPromise = null;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // Start with 5 seconds to reduce frequency
  }

  // Ping backend to wake it up
  async warmupBackend() {
    if (this.isWarming || this.isWarmed) {
      return this.warmupPromise;
    }

    this.isWarming = true;
    this.warmupPromise = this._performWarmup();
    
    try {
      await this.warmupPromise;
      this.isWarmed = true;
      console.log('✅ Backend warmup completed successfully');
    } catch (error) {
      console.warn('⚠️ Backend warmup failed, but continuing:', error.message);
    } finally {
      this.isWarming = false;
    }

    return this.warmupPromise;
  }

  async _performWarmup() {
    while (this.retryCount < this.maxRetries) {
      try {
        console.log(`🔄 Warming up backend (attempt ${this.retryCount + 1}/${this.maxRetries})...`);
        
        // Try health check first (faster endpoint)
        await apiService.healthCheck();
        
        console.log('✅ Backend is now warm and ready');
        this.retryCount = 0; // Reset on success
        return;
        
      } catch (error) {
        this.retryCount++;
        
        if (this.retryCount >= this.maxRetries) {
          console.warn(`❌ Backend warmup failed after ${this.maxRetries} attempts:`, error.message);
          throw new Error(`Backend warmup failed: ${error.message}`);
        }
        
        // Exponential backoff with jitter - less aggressive
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1) + Math.random() * 2000;
        console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Check if backend is ready
  async isBackendReady() {
    if (this.isWarmed) return true;
    
    try {
      await apiService.healthCheck();
      this.isWarmed = true;
      return true;
    } catch (error) {
      return false;
    }
  }

  // Reset warmup state (useful for testing or manual retry)
  reset() {
    this.isWarming = false;
    this.isWarmed = false;
    this.warmupPromise = null;
    this.retryCount = 0;
  }

  // Get warmup status
  getStatus() {
    return {
      isWarming: this.isWarming,
      isWarmed: this.isWarmed,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

// Create and export singleton instance
export const warmupService = new WarmupService();

// Export class for testing
export default WarmupService;