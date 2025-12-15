// API wrapper with warmup-aware error handling
import { warmupService } from '$lib/services/warmup.js';

/**
 * Wraps API calls with intelligent error handling during backend warmup
 * @param {Function} apiCall - The API function to call
 * @param {Object} options - Configuration options
 * @param {boolean} options.showToast - Whether to show error toasts (default: true)
 * @param {number} options.retries - Number of retries during warmup (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise} - The API call result or throws error
 */
export async function withWarmupHandling(apiCall, options = {}) {
  const {
    showToast = true,
    retries = 3,
    retryDelay = 1000
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Check if this looks like a backend not ready error
      const isWarmupError = (
        error.message.includes('fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_NETWORK') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.status === 503 ||
        error.status === 502 ||
        error.status === 504
      );
      
      // If it's not a warmup-related error, throw immediately
      if (!isWarmupError) {
        throw error;
      }
      
      // If we're on the last attempt, throw the error
      if (attempt === retries) {
        if (showToast) {
          console.warn('API call failed after retries. Backend may still be starting up.');
        }
        throw error;
      }
      
      // Wait before retrying
      console.log(`API call failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError;
}

/**
 * Creates a wrapped version of an API service method
 * @param {Object} apiService - The API service instance
 * @param {string} methodName - The method name to wrap
 * @param {Object} options - Wrapper options
 * @returns {Function} - Wrapped method
 */
export function wrapApiMethod(apiService, methodName, options = {}) {
  const originalMethod = apiService[methodName].bind(apiService);
  
  return async (...args) => {
    return withWarmupHandling(() => originalMethod(...args), options);
  };
}

/**
 * Check if backend is ready before making critical API calls
 * @param {number} timeout - Maximum time to wait in ms (default: 30000)
 * @returns {Promise<boolean>} - True if backend is ready
 */
export async function waitForBackend(timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const isReady = await warmupService.isBackendReady();
      if (isReady) {
        return true;
      }
    } catch (error) {
      // Continue waiting
    }
    
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

/**
 * Show user-friendly error messages based on error type
 * @param {Error} error - The error to handle
 * @param {string} context - Context of where the error occurred
 */
export function handleApiError(error, context = 'API call') {
  console.error(`${context} failed:`, error);
  
  // Check if it's a warmup-related error
  const isWarmupError = (
    error.message.includes('fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('Failed to fetch') ||
    error.status === 503 ||
    error.status === 502 ||
    error.status === 504
  );
  
  if (isWarmupError) {
    return {
      title: 'Service Starting Up',
      message: 'The backend is starting up. Please wait a moment and try again.',
      type: 'warning',
      retry: true
    };
  }
  
  // Handle other common errors
  if (error.status === 401) {
    return {
      title: 'Authentication Required',
      message: 'Please log in to continue.',
      type: 'error',
      retry: false
    };
  }
  
  if (error.status === 403) {
    return {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      type: 'error',
      retry: false
    };
  }
  
  if (error.status === 404) {
    return {
      title: 'Not Found',
      message: 'The requested resource was not found.',
      type: 'error',
      retry: false
    };
  }
  
  if (error.status >= 500) {
    return {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      type: 'error',
      retry: true
    };
  }
  
  // Default error
  return {
    title: 'Something went wrong',
    message: error.message || 'An unexpected error occurred.',
    type: 'error',
    retry: true
  };
}