import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/auth.js';

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export function isAuthenticated() {
  const auth = get(authStore);
  return !!auth.user;
}

/**
 * Check if wallet is connected
 * @returns {boolean} True if wallet is connected
 */
export function isWalletConnected() {
  const auth = get(authStore);
  return auth.isWalletConnected;
}

/**
 * Require authentication - redirect to login if not authenticated
 * @param {string} redirectTo - Optional redirect path after login
 */
export function requireAuth(redirectTo = null) {
  if (!isAuthenticated()) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const redirect = redirectTo || currentPath;
    goto(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
    return false;
  }
  return true;
}

/**
 * Require wallet connection - redirect to wallet connect if not connected
 * @param {string} redirectTo - Optional redirect path after wallet connection
 */
export function requireWallet(redirectTo = null) {
  if (!isWalletConnected()) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const redirect = redirectTo || currentPath;
    goto(`/wallet/connect?redirect=${encodeURIComponent(redirect)}`);
    return false;
  }
  return true;
}

/**
 * Require both authentication and wallet connection
 * @param {string} redirectTo - Optional redirect path
 */
export function requireAuthAndWallet(redirectTo = null) {
  if (!requireAuth(redirectTo)) {
    return false;
  }
  if (!requireWallet(redirectTo)) {
    return false;
  }
  return true;
}

/**
 * Redirect authenticated users away from auth pages
 * @param {string} redirectTo - Path to redirect to (default: home)
 */
export function redirectIfAuthenticated(redirectTo = '/') {
  if (isAuthenticated()) {
    goto(redirectTo);
    return true;
  }
  return false;
}
