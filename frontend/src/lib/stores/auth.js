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

// Sign up with wallet (wallet-only registration)
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

    // Step 4: Verify signature and get JWT
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

    // Step 5: If new user, register with profile data
    if (isNewUser) {
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
        // Store auth data
        localStorage.setItem('auth_token', registrationResponse.token);
        localStorage.setItem('auth_user', JSON.stringify(registrationResponse.user));
        
        // Set token in API service
        apiService.setToken(registrationResponse.token);
        
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
    } else {
      throw new Error('User already exists. Please sign in instead.');
    }
  } catch (error) {
    authStore.update(store => ({ ...store, loading: false, error: error.message }));
    throw error;
  }
};

// Sign in with wallet (wallet-only authentication)
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

    // Step 4: Verify signature and get JWT
    const { token, user, isNewUser } = await withWarmupHandling(
      () => apiService.verifyWalletSignature(address, signature, nonce),
      { retries: 3, retryDelay: 1500 }
    );
    
    if (isNewUser) {
      throw new Error('No account found. Please register first.');
    }

    // Store auth data
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    // Set token in API service
    apiService.setToken(token);

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
    authStore.update(store => ({
      ...store,
      loading: false,
      error: error.message
    }));
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



// Listen to wallet changes
walletStore.subscribe((wallet) => {
  authStore.update(store => ({
    ...store,
    walletAddress: wallet.address,
    isWalletConnected: wallet.isConnected
  }));
});