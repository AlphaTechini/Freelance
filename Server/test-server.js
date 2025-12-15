import Fastify from 'fastify';

console.log('🚀 Starting test server...');

const fastify = Fastify({
  logger: true
});

// Simple health check
fastify.get('/health', async (request, reply) => {
  console.log('Health check requested');
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Test endpoint
fastify.get('/test', async (request, reply) => {
  console.log('Test endpoint requested');
  return { message: 'Test server is working!' };
});

const start = async () => {
  try {
    console.log('🌐 Starting server on localhost:3001...');
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('✅ Test server listening on http://0.0.0.0:3001');
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
};

start();