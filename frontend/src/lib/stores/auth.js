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

// Initialize auth state from localStorage
export const initializeAuth = () => {
  return new Promise((resolve) => {
    try {
      // Check for stored JWT token
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        // Set token in API service
        apiService.setToken(storedToken);
        
        // Parse and set user data
        const userData = JSON.parse(storedUser);
        authStore.set({
          user: userData,
          loading: false,
          error: null
        });
      } else {
        // No stored auth data
        authStore.set({
          user: null,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Clear invalid stored data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      authStore.set({
        user: null,
        loading: false,
        error: error.message
      });
    }
    
    resolve();
  });
};

// Sign up with email and password (MongoDB only)
export const signUp = async (username, email, password, displayName, role, walletAddress = null) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));
    
    // Register user in backend
    const response = await withWarmupHandling(
      () => apiService.registerWithEmail({
        username,
        email,
        password,
        displayName,
        role,
        walletAddress
      }),
      { retries: 5, retryDelay: 2000 }
    );
    
    if (response.success) {
      // Store auth data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
      // Set token in API service
      apiService.setToken(response.token);
      
      // Update store
      authStore.update(store => ({
        ...store,
        user: response.user,
        loading: false,
        error: null
      }));
      
      return response.user;
    } else {
      throw new Error(response.error?.message || 'Registration failed');
    }
  } catch (error) {
    authStore.update(store => ({ ...store, loading: false, error: error.message }));
    throw error;
  }
};

// Sign in with email and password (MongoDB only)
export const signIn = async (email, password) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));
    
    const response = await withWarmupHandling(
      () => apiService.loginWithEmail({ email, password }),
      { retries: 5, retryDelay: 2000 }
    );
    
    if (response.success) {
      // Store auth data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
      // Set token in API service
      apiService.setToken(response.token);
      
      // Update store
      authStore.update(store => ({
        ...store,
        user: response.user,
        loading: false,
        error: null
      }));
      
      return response.user;
    } else {
      throw new Error(response.error?.message || 'Login failed');
    }
  } catch (error) {
    authStore.update(store => ({ ...store, loading: false, error: error.message }));
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    // Clear stored auth data
    localStorage.removeItem('auth_token');
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

// Get current user's JWT token
export const getCurrentUserToken = async () => {
  return localStorage.getItem('auth_token');
};

// ===== Wallet Authentication Methods =====

// Authenticate with wallet (MetaMask or WalletConnect)
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

    // Step 4: Get JWT token if user is logged in
    const jwtToken = await getCurrentUserToken();

    // Step 5: Verify signature and get JWT
    const { token, user } = await withWarmupHandling(
      () => apiService.verifyWalletSignature(address, signature, nonce, jwtToken),
      { retries: 3, retryDelay: 1500 }
    );
    
    // Store auth data if successful
    if (token) {
      localStorage.setItem('auth_token', token);
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      
      // Set token in API service
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

// Combined authentication: Email + Wallet
export const signUpWithWallet = async (username, email, password, displayName, role, walletType = WALLET_TYPES.METAMASK) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));

    // Step 1: Connect wallet first
    const { address } = await connectWallet(walletType);
    
    // Step 2: Register with email and wallet
    const user = await signUp(username, email, password, displayName, role, address);

    return user;
  } catch (error) {
    console.error('Sign up with wallet failed:', error);
    authStore.update(store => ({
      ...store,
      loading: false,
      error: error.message
    }));
    throw error;
  }
};

// Sign in with email and link wallet
export const signInWithWallet = async (email, password, walletType = WALLET_TYPES.METAMASK) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));

    // Step 1: Sign in with email
    const user = await signIn(email, password);
    
    // Step 2: Authenticate wallet
    await authenticateWithWallet(walletType);

    return user;
  } catch (error) {
    console.error('Sign in with wallet failed:', error);
    authStore.update(store => ({
      ...store,
      loading: false,
      error: error.message
    }));
    throw error;
  }
};

// Wallet-only authentication (no Firebase)
export const signInWalletOnly = async (walletType = WALLET_TYPES.METAMASK) => {
  return await authenticateWithWallet(walletType);
};

// Listen to wallet changes
walletStore.subscribe((wallet) => {
  authStore.update(store => ({
    ...store,
    walletAddress: wallet.address,
    isWalletConnected: wallet.isConnected
  }));
});