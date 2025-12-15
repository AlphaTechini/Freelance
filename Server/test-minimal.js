import Fastify from 'fastify';
import dotenv from 'dotenv';

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

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Test endpoint
fastify.get('/api/test', async (request, reply) => {
  return { message: 'MeritStack API is running!' };
});

// Start server
const start = async () => {
  try {
    console.log('🚀 Starting minimal test server...');
    
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    console.log(`🌐 Starting server on ${host}:${port}...`);
    await fastify.listen({ port, host });
    console.log(`✅ Server listening on http://${host}:${port}`);
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
};

start();