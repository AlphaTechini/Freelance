import { writable, get } from 'svelte/store';
import { apiService } from '../services/api.js';
import { withWarmupHandling } from '../utils/api-wrapper.js';
import { 
  connectWallet, 
  signAuthMessage, 
  walletStore,
  WALLET_TYPES 
} from '../services/wallet.js';

// Auth store
export const authStore = writable({
  user: null,
  walletAddress: null,
  isWalletConnected: false,
  loading: true,
  error: null
});

// Initialize auth state - now primarily uses cookies (sent automatically)
// localStorage is kept as fallback for SSR hydration
export const initializeAuth = async () => {
  try {
    // Try to verify auth via cookie (cookies are sent automatically with credentials: 'include')
    try {
      const profileResponse = await apiService.getProfile();
      if (profileResponse.success && profileResponse.user) {
        // Cookie auth successful - update store
        // Also cache user in localStorage for quick hydration
        localStorage.setItem('auth_user', JSON.stringify(profileResponse.user));
        authStore.set({
          user: profileResponse.user,
          loading: false,
          error: null
        });
        return;
      }
    } catch (verifyError) {
      // Cookie auth failed - this is normal for logged out users
      console.log('Cookie auth not available:', verifyError.message);
    }
    
    // Fallback: Check localStorage for cached user (for quick UI hydration)
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      // We have cached user data but cookie auth failed
      // Clear the stale localStorage data
      console.warn('Clearing stale localStorage auth data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    
    // No valid auth
    authStore.set({
      user: null,
      loading: false,
      error: null
    });
  } catch (error) {
    console.error('Error initializing auth:', error);
    // Clear any stored data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    authStore.set({
      user: null,
      loading: false,
      error: null
    });
  }
};

// Sign up with wallet (wallet-only registration)
// Cookie is set by backend automatically on successful auth
export const signUpWithWallet = async (username, email, displayName, role, walletType = WALLET_TYPES.METAMASK) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));

    // Step 1: Get wallet address from current connection (wallet should already be connected by the register page)
    const currentWallet = get(walletStore);
    
    if (!currentWallet.isConnected || !currentWallet.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    const address = currentWallet.address;
    
    // Step 2: Request nonce from backend
    const { nonce } = await withWarmupHandling(
      () => apiService.requestNonce(address),
      { retries: 5, retryDelay: 2000 }
    );

    // Step 3: Sign authentication message
    const signature = await signAuthMessage(nonce);

    // Step 4: Verify signature and get JWT (cookie is set automatically by backend)
    const verifyResponse = await withWarmupHandling(
      () => apiService.verifyWalletSignature(address, signature, nonce),
      { retries: 3, retryDelay: 1500 }
    );
    
    console.log('Wallet verification response:', { 
      isNewUser: verifyResponse.isNewUser, 
      hasUser: !!verifyResponse.user,
      address 
    });

    const { token, user, isNewUser } = verifyResponse;

    // Keep token in API service as fallback for any edge cases
    if (token) {
      apiService.setToken(token);
    }

    // Step 5: If new user, register with profile data
    if (isNewUser) {
      try {
        const registrationResponse = await withWarmupHandling(
          () => apiService.registerUser({
            username,
            email,
            displayName,
            role
          }, token),
          { retries: 3, retryDelay: 1500 }
        );

        if (registrationResponse.success) {
          // Cache user in localStorage for quick hydration
          localStorage.setItem('auth_user', JSON.stringify(registrationResponse.user));
          
          // Update store
          authStore.update(store => ({
            ...store,
            user: registrationResponse.user,
            walletAddress: address,
            isWalletConnected: true,
            loading: false,
            error: null
          }));
          
          return registrationResponse.user;
        } else {
          throw new Error(registrationResponse.error?.message || 'Registration failed');
        }
      } catch (regError) {
        // Clear any cached data if registration fails
        localStorage.removeItem('auth_user');
        apiService.setToken(null);
        throw regError;
      }
    } else {
      // User already exists
      if (user) {
        // They're already registered, just log them in
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        authStore.update(store => ({
          ...store,
          user,
          walletAddress: address,
          isWalletConnected: true,
          loading: false,
          error: null
        }));
        
        throw new Error('User already exists. Redirecting to dashboard...');
      } else {
        throw new Error('User already exists. Please sign in instead.');
      }
    }
  } catch (error) {
    authStore.update(store => ({ ...store, loading: false, error: error.message }));
    throw error;
  }
};

// Sign in with wallet (wallet-only authentication)
// Cookie is set by backend automatically on successful auth
export const signInWithWallet = async (walletType = WALLET_TYPES.METAMASK) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));

    // Step 1: Get wallet address (use existing connection if available)
    const currentWallet = get(walletStore);
    let address;
    
    if (currentWallet.isConnected && currentWallet.address) {
      address = currentWallet.address;
    } else {
      const result = await connectWallet(walletType);
      address = result.address;
    }

    // Step 2: Request nonce from backend
    const { nonce } = await withWarmupHandling(
      () => apiService.requestNonce(address),
      { retries: 5, retryDelay: 2000 }
    );

    // Step 3: Sign authentication message
    const signature = await signAuthMessage(nonce);

    // Step 4: Verify signature and get JWT (cookie is set automatically by backend)
    const verifyResponse = await withWarmupHandling(
      () => apiService.verifyWalletSignature(address, signature, nonce),
      { retries: 3, retryDelay: 1500 }
    );
    
    const { token, user, isNewUser } = verifyResponse;
    
    if (isNewUser || !user) {
      // Clear any stale data
      localStorage.removeItem('auth_user');
      apiService.setToken(null);
      throw new Error('No account found. Please register first.');
    }

    // Cache user in localStorage for quick hydration
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    // Keep token in API service as fallback
    if (token) {
      apiService.setToken(token);
    }

    // Update auth store
    authStore.update(store => ({
      ...store,
      user,
      walletAddress: address,
      isWalletConnected: true,
      loading: false,
      error: null
    }));

    return user;
  } catch (error) {
    console.error('Wallet authentication failed:', error);
    
    // Clear any cached auth data on error
    localStorage.removeItem('auth_user');
    apiService.setToken(null);
    
    authStore.update(store => ({
      ...store,
      user: null,
      loading: false,
      error: error.message
    }));
    throw error;
  }
};

// Sign out - calls backend to clear cookie
export const signOutUser = async () => {
  try {
    // Call backend to clear the HTTP-only cookie
    try {
      await apiService.logout();
    } catch (logoutError) {
      // Even if backend call fails, clear local state
      console.warn('Backend logout failed:', logoutError.message);
    }
    
    // Clear cached auth data
    localStorage.removeItem('auth_user');
    
    // Clear token from API service
    apiService.setToken(null);
    
    // Update store
    authStore.set({
      user: null,
      walletAddress: null,
      isWalletConnected: false,
      loading: false,
      error: null
    });
  } catch (error) {
    authStore.update(store => ({ ...store, error: error.message }));
    throw error;
  }
};

// Get current user's JWT token (now primarily from cookie, this is for backward compat)
export const getCurrentUserToken = async () => {
  // Token is now in HTTP-only cookie, can't access directly
  // Return null - API calls will use cookie automatically
  return null;
};

// Clear all auth data (helper function)
export const clearAuthData = async () => {
  // Call backend to clear cookie
  try {
    await apiService.logout();
  } catch (error) {
    console.warn('Could not clear server cookie:', error.message);
  }
  
  localStorage.removeItem('auth_user');
  apiService.setToken(null);
  authStore.set({
    user: null,
    walletAddress: null,
    isWalletConnected: false,
    loading: false,
    error: null
  });
};

// ===== Wallet Authentication Methods =====

// Authenticate with wallet (MetaMask or WalletConnect)
// Cookie is set by backend automatically on successful auth
export const authenticateWithWallet = async (walletType = WALLET_TYPES.METAMASK) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));

    // Step 1: Connect wallet
    const { address } = await connectWallet(walletType);

    // Step 2: Request nonce from backend
    const { nonce } = await withWarmupHandling(
      () => apiService.requestNonce(address),
      { retries: 5, retryDelay: 2000 }
    );

    // Step 3: Sign authentication message
    const signature = await signAuthMessage(nonce);

    // Step 4: Verify signature and get JWT (cookie is set automatically by backend)
    const { token, user } = await withWarmupHandling(
      () => apiService.verifyWalletSignature(address, signature, nonce),
      { retries: 3, retryDelay: 1500 }
    );
    
    // Cache user data if successful
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    
    // Keep token in API service as fallback
    if (token) {
      apiService.setToken(token);
    }

    // Update auth store
    authStore.update(store => ({
      ...store,
      walletAddress: address,
      isWalletConnected: true,
      loading: false,
      error: null
    }));

    return { token, user, address };
  } catch (error) {
    console.error('Wallet authentication failed:', error);
    authStore.update(store => ({
      ...store,
      loading: false,
      error: error.message
    }));
    throw error;
  }
};



// Listen to wallet changes
walletStore.subscribe((wallet) => {
  authStore.update(store => ({
    ...store,
    walletAddress: wallet.address,
    isWalletConnected: wallet.isConnected
  }));
});