# Cookie-Based Authentication Implementation Plan

## Why Cookies Are Better

### Current (localStorage):
- ❌ Vulnerable to XSS attacks
- ❌ Can be accessed by any JavaScript
- ❌ Not sent automatically with requests
- ❌ Requires manual token management

### With HTTP-Only Cookies:
- ✅ Protected from XSS attacks
- ✅ Cannot be accessed by JavaScript
- ✅ Automatically sent with every request
- ✅ Can be set as Secure and SameSite
- ✅ SvelteKit has built-in support

---

## Implementation Steps

### 1. Backend Changes (Fastify)

**Install cookie plugin:**
```bash
pnpm add @fastify/cookie
```

**Update `Server/src/server.js`:**
```javascript
import fastifyCookie from '@fastify/cookie';

// Register cookie plugin
await fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'your-secret-key',
  parseOptions: {}
});
```

**Update auth routes to set cookies:**
```javascript
// After successful authentication
reply.setCookie('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/'
});
```

### 2. Frontend Changes (SvelteKit)

**Create `frontend/src/hooks.server.js`:**
```javascript
export async function handle({ event, resolve }) {
  // Get token from cookie
  const token = event.cookies.get('auth_token');
  
  if (token) {
    // Verify token and set user in locals
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const { user } = await response.json();
        event.locals.user = user;
      }
    } catch (error) {
      // Invalid token, clear cookie
      event.cookies.delete('auth_token', { path: '/' });
    }
  }
  
  return resolve(event);
}
```

**Update API service to use cookies:**
```javascript
// Remove manual token management
// Cookies are sent automatically with fetch
```

**Create server-side load functions:**
```javascript
// frontend/src/routes/dashboard/+page.server.js
export async function load({ locals, cookies }) {
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }
  
  return {
    user: locals.user
  };
}
```

### 3. Authentication Flow

**Registration:**
1. User connects wallet
2. Signs message
3. Backend verifies signature
4. Backend sets HTTP-only cookie with JWT
5. Frontend redirects to dashboard
6. Cookie is automatically sent with all requests

**Login:**
1. User connects wallet
2. Signs message
3. Backend verifies signature
4. Backend sets HTTP-only cookie with JWT
5. Frontend redirects to dashboard

**Logout:**
1. Call `/auth/logout` endpoint
2. Backend clears cookie
3. Frontend redirects to login

### 4. Protected Routes

**Using SvelteKit's load functions:**
```javascript
// +page.server.js
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }
  
  return { user: locals.user };
}
```

---

## Benefits

1. **Security**: Tokens can't be stolen via XSS
2. **Simplicity**: No manual token management
3. **SSR Support**: Works with server-side rendering
4. **Automatic**: Cookies sent with every request
5. **SvelteKit Native**: Uses built-in features

---

## Migration Steps

1. ✅ Keep current localStorage implementation working
2. Add cookie support to backend
3. Add SvelteKit hooks for cookie handling
4. Update auth flows to use cookies
5. Test thoroughly
6. Remove localStorage code
7. Deploy

---

## Environment Variables Needed

```env
# Backend (.env)
COOKIE_SECRET=your-secure-random-secret-key
FRONTEND_URL=https://your-frontend-url.com

# Frontend (.env)
PUBLIC_API_URL=https://your-backend-url.com
```

---

## Security Considerations

1. **HTTPS Only**: Set `secure: true` in production
2. **SameSite**: Use `lax` or `strict`
3. **HttpOnly**: Always true for auth tokens
4. **CORS**: Configure properly for cross-origin requests
5. **CSRF**: Consider adding CSRF protection

---

## Next Steps

Would you like me to implement this cookie-based authentication system?
It will be more secure and work better with SvelteKit's architecture.
