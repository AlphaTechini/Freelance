import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { connectDatabase } from './services/database.js';
import { authenticateToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gigRoutes from './routes/gigs.js';
import priceRoutes from './routes/prices.js';
import portfolioRoutes from './routes/portfolio.js';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
});

await fastify.register(multipart);

// Decorate fastify with authenticate method
fastify.decorate('authenticate', authenticateToken);

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register API routes
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(userRoutes, { prefix: '/api' });
await fastify.register(gigRoutes, { prefix: '/api' });
await fastify.register(priceRoutes, { prefix: '/api' });
await fastify.register(portfolioRoutes, { prefix: '/api' });

// Import and register job routes
import jobRoutes from './routes/jobs.js';
await fastify.register(jobRoutes, { prefix: '/api' });

// Test endpoint
fastify.get('/api/test', async (request, reply) => {
  return { message: 'CryptoGigs API is running!' };
});

// Start server
const start = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();