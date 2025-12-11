import { writable, get } from 'svelte/store';
import { auth } from '../services/firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { apiService } from '../services/api.js';
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

// Initialize auth state listener
export const initializeAuth = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get Firebase ID token
          const idToken = await user.getIdToken();
          
          // Set token in API service
          apiService.setToken(idToken);
          
          // Update store
          authStore.set({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified
            },
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Error getting ID token:', error);
          authStore.set({
            user: null,
            loading: false,
            error: error.message
          });
        }
      } else {
        // Clear token from API service
        apiService.setToken(null);
        
        authStore.set({
          user: null,
          loading: false,
          error: null
        });
      }
      
      resolve();
    });

    // Return unsubscribe function
    return unsubscribe;
  });
};

// Sign up with email and password
export const signUp = async (username, email, password, displayName, role) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Get Firebase ID token
    const idToken = await userCredential.user.getIdToken();
    
    // Register user in backend with role
    await apiService.registerUser({
      username,
      email,
      displayName,
      role,
      firebaseUid: userCredential.user.uid
    }, idToken);
    
    return userCredential.user;
  } catch (error) {
    authStore.update(store => ({ ...store, loading: false, error: error.message }));
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    authStore.update(store => ({ ...store, loading: false, error: error.message }));
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    authStore.update(store => ({ ...store, error: error.message }));
    throw error;
  }
};

// Get current user's ID token
export const getCurrentUserToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

// ===== Wallet Authentication Methods =====

// Authenticate with wallet (MetaMask or WalletConnect)
export const authenticateWithWallet = async (walletType = WALLET_TYPES.METAMASK) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));

    // Step 1: Connect wallet
    const { address } = await connectWallet(walletType);

    // Step 2: Request nonce from backend
    const { nonce } = await apiService.requestNonce(address);

    // Step 3: Sign authentication message
    const signature = await signAuthMessage(nonce);

    // Step 4: Get Firebase token if user is logged in
    const firebaseToken = await getCurrentUserToken();

    // Step 5: Verify signature and get JWT
    const { token, user } = await apiService.verifyWalletSignature(
      address,
      signature,
      nonce,
      firebaseToken
    );

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

// Combined authentication: Firebase + Wallet
export const signUpWithWallet = async (username, email, password, displayName, role, walletType = WALLET_TYPES.METAMASK) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));

    // Step 1: Create Firebase account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Step 2: Authenticate wallet
    await authenticateWithWallet(walletType);
    
    // Step 3: Get Firebase ID token
    const idToken = await userCredential.user.getIdToken();
    
    // Step 4: Register user in backend with role
    await apiService.registerUser({
      username,
      email,
      displayName,
      role,
      firebaseUid: userCredential.user.uid
    }, idToken);

    return userCredential.user;
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

// Sign in with Firebase and link wallet
export const signInWithWallet = async (email, password, walletType = WALLET_TYPES.METAMASK) => {
  try {
    authStore.update(store => ({ ...store, loading: true, error: null }));

    // Step 1: Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Step 2: Authenticate wallet
    await authenticateWithWallet(walletType);

    return userCredential.user;
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