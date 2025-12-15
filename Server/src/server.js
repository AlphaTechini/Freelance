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
import paymentRoutes from './routes/payments.js';

// Load environment variables
dotenv.config();

// Configure logger based on environment
const loggerConfig = process.env.NODE_ENV === 'production' 
  ? { level: process.env.LOG_LEVEL || 'info' }
  : {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    };

const fastify = Fastify({
  logger: loggerConfig
});

// Register plugins function
async function registerPlugins() {
  try {
    console.log('📦 Registering CORS plugin...');
    await fastify.register(cors, {
      origin: [
        'https://freelance-orpin-omega.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
      ],
      credentials: true
    });

    console.log('🚦 Registering rate limit plugin...');
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute'
    });

    console.log('🔐 Registering JWT plugin...');
    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    });

    console.log('📎 Registering multipart plugin...');
    await fastify.register(multipart);

    console.log('🔧 Decorating fastify with authenticate method...');
    // Decorate fastify with authenticate method
    fastify.decorate('authenticate', authenticateToken);
    
    console.log('✅ All plugins registered successfully');
  } catch (error) {
    console.error('❌ Plugin registration failed:', error);
    throw error;
  }
}

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Check database connection
    const { mongoose } = await import('mongoose');
    health.services.database = {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: 'MongoDB'
    };

    // Check external services
    health.services.github = {
      status: process.env.GITHUB_TOKEN ? 'configured' : 'not_configured',
      name: 'GitHub API'
    };

    health.services.cloudinary = {
      status: (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) ? 'configured' : 'not_configured',
      name: 'Cloudinary'
    };

    health.services.invokellm = {
      status: process.env.INVOKELLM_API_KEY ? 'configured' : 'not_configured',
      name: 'InvokeLLM API'
    };

    // Check if any critical services are down
    const criticalServices = ['database'];
    const failedCritical = criticalServices.filter(service => 
      health.services[service]?.status !== 'connected' && 
      health.services[service]?.status !== 'configured'
    );

    if (failedCritical.length > 0) {
      health.status = 'degraded';
      health.issues = failedCritical.map(service => `${service} is not available`);
    }

  } catch (error) {
    health.status = 'error';
    health.error = error.message;
  }

  const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500;
  return reply.code(statusCode).send(health);
});

// Register routes function
async function registerRoutes() {
  // Import and register job routes
  const jobRoutes = await import('./routes/jobs.js');
  
  // Import and register candidate routes  
  const candidateRoutes = await import('./routes/candidates.js');

  // Register API routes
  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(userRoutes, { prefix: '/api' });
  await fastify.register(gigRoutes, { prefix: '/api' });
  await fastify.register(priceRoutes, { prefix: '/api' });
  await fastify.register(portfolioRoutes, { prefix: '/api' });
  await fastify.register(paymentRoutes, { prefix: '/api' });
  await fastify.register(jobRoutes.default, { prefix: '/api' });
  await fastify.register(candidateRoutes.default, { prefix: '/api' });
}

// Favicon endpoint to prevent 500 errors
fastify.get('/favicon.ico', async (request, reply) => {
  return reply.code(204).send();
});

// Test endpoint
fastify.get('/api/test', async (request, reply) => {
  return { message: 'MeritStack API is running!' };
});

// Start server
const start = async () => {
  try {
    console.log('🚀 Starting MeritStack server...');
    
    // Register plugins first
    await registerPlugins();
    
    // Register routes
    await registerRoutes();
    
    // Try to connect to MongoDB (non-blocking)
    connectDatabase()
      .then(() => {
        console.log('✅ Database connected successfully');
        fastify.log.info('Database connected successfully');
      })
      .catch((dbError) => {
        console.log('⚠️ Database connection failed, continuing without database:', dbError.message);
        fastify.log.warn('Database connection failed, continuing without database:', dbError.message);
      });
    
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    console.log(`🌐 Starting server on ${host}:${port}...`);
    await fastify.listen({ port, host });
    console.log(`✅ Server listening on http://${host}:${port}`);
    fastify.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();