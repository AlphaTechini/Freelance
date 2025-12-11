import { requireAuth } from '$lib/utils/auth-guard.js';

export function load() {
  // Require authentication to access this page
  requireAuth();
  
  return {};
}
