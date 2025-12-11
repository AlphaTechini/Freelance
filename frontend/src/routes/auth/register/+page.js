import { redirectIfAuthenticated } from '$lib/utils/auth-guard.js';

export function load({ url }) {
  // Get redirect parameter from URL
  const redirect = url.searchParams.get('redirect') || '/';
  
  // Redirect to home if already authenticated
  redirectIfAuthenticated(redirect);
  
  return {
    redirect
  };
}
