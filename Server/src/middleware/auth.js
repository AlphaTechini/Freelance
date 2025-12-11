// Authentication middleware
export const authenticateToken = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: err.message });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Don't fail, just continue without user
    request.user = null;
  }
};