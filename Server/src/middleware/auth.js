// Authentication middleware - checks both Authorization header and cookie
export const authenticateToken = async (request, reply) => {
  try {
    // First try to verify from Authorization header
    await request.jwtVerify();
  } catch (headerErr) {
    // If header auth fails, try cookie
    try {
      const token = request.cookies?.auth_token;
      if (token) {
        // Manually verify the cookie token
        const decoded = request.server.jwt.verify(token);
        request.user = decoded;
      } else {
        throw new Error('No authentication token provided');
      }
    } catch (cookieErr) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing authentication token' });
    }
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (request, reply) => {
  try {
    // First try Authorization header
    await request.jwtVerify();
  } catch (headerErr) {
    // Try cookie
    try {
      const token = request.cookies?.auth_token;
      if (token) {
        const decoded = request.server.jwt.verify(token);
        request.user = decoded;
      } else {
        request.user = null;
      }
    } catch (cookieErr) {
      // Don't fail, just continue without user
      request.user = null;
    }
  }
};