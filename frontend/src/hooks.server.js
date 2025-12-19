// SvelteKit server hooks for cookie-based authentication
const API_BASE_URL = process.env.VITE_API_BASE_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://freelance-45tf.onrender.com' : 'http://localhost:3000');

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Get auth token from cookie
  const token = event.cookies.get('auth_token');
  
  if (token) {
    try {
      // Verify token by fetching user profile from backend
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Set user in locals for use in load functions
          event.locals.user = data.user;
          event.locals.token = token;
        } else {
          // Invalid response, clear user
          event.locals.user = null;
          event.locals.token = null;
        }
      } else {
        // Token is invalid or expired
        event.locals.user = null;
        event.locals.token = null;
        
        // Clear the invalid cookie
        event.cookies.delete('auth_token', { path: '/' });
      }
    } catch (error) {
      // Network error or server unavailable - don't clear cookie
      // User might still be valid, just can't verify right now
      console.warn('Could not verify auth token:', error.message);
      event.locals.user = null;
      event.locals.token = token; // Keep token for client-side retry
    }
  } else {
    event.locals.user = null;
    event.locals.token = null;
  }
  
  return resolve(event);
}
