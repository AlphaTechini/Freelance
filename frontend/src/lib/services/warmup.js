// Backend warmup service to prevent cold starts
import { apiService } from './api.js';

class WarmupService {
  constructor() {
    this.isWarming = false;
    this.isWarmed = false;
    this.warmupPromise = null;
    this.retryCount = 0;
    this.maxRetries = 5; // 5 attempts before giving up
    this.retryDelay = 3000; // 3000ms base delay
    this.shouldReloadOnSuccess = false; // Flag to trigger reload
    this.statusMessage = 'Connecting...'; // Current status message
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
        this.statusMessage = `Starting backend... (attempt ${this.retryCount + 1}/${this.maxRetries})`;
        console.log(`🔄 Warming up backend (attempt ${this.retryCount + 1}/${this.maxRetries})...`);
        
        // Try health check first (faster endpoint)
        await apiService.healthCheck();
        
        this.statusMessage = 'Backend started!';
        console.log('✅ Backend warmed up successfully');
        console.log('✅ Backend is now warm and ready');
        
        // If this was attempt 3, 4, or 5, trigger page reload
        if (this.shouldReloadOnSuccess) {
          console.log('🔄 Backend warmed up successfully! Reloading page in 2 seconds...');
          setTimeout(() => {
            window.location.reload();
          }, 2000); // 2 second delay to show "Backend started!" message
        }
        
        this.retryCount = 0; // Reset on success
        return;
        
      } catch (error) {
        this.retryCount++;
        
        // Set reload flag if we're on attempt 3 or higher
        if (this.retryCount >= 3) {
          this.shouldReloadOnSuccess = true;
        }
        
        if (this.retryCount >= this.maxRetries) {
          this.statusMessage = 'Backend warmup failed';
          console.warn(`❌ Backend warmup failed after ${this.maxRetries} attempts:`, error.message);
          throw new Error(`Backend warmup failed: ${error.message}`);
        }
        
        // Linear backoff - more predictable
        const delay = this.retryDelay + (this.retryCount * 1000); // 3s, 4s, 5s, 6s, 7s
        console.log(`⏳ Retrying in ${Math.round(delay / 1000)}s...`);
        
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
    this.shouldReloadOnSuccess = false;
    this.statusMessage = 'Connecting...';
  }

  // Get warmup status
  getStatus() {
    return {
      isWarming: this.isWarming,
      isWarmed: this.isWarmed,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      statusMessage: this.statusMessage
    };
  }
}

// Create and export singleton instance
export const warmupService = new WarmupService();

// Export class for testing
export default WarmupService;