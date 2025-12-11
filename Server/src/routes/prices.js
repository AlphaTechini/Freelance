import {
  getCryptoPrices,
  convertToUSD,
  convertFromUSD,
  getPrice
} from '../services/priceService.js';

export default async function priceRoutes(fastify, options) {
  
  // Get all cryptocurrency prices
  fastify.get('/prices', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            prices: {
              type: 'object',
              properties: {
                USDT: { type: 'number' },
                ETH: { type: 'number' },
                BTC: { type: 'number' }
              }
            },
            cached: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await getCryptoPrices();
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch prices'
      });
    }
  });
  
  // Get price for specific currency
  fastify.get('/prices/:currency', {
    schema: {
      params: {
        type: 'object',
        required: ['currency'],
        properties: {
          currency: { type: 'string', enum: ['USDT', 'ETH', 'BTC'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { currency } = request.params;
      const result = await getPrice(currency);
      
      if (!result.success) {
        return reply.code(400).send(result);
      }
      
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch price'
      });
    }
  });
  
  // Convert crypto to USD
  fastify.post('/prices/convert-to-usd', {
    schema: {
      body: {
        type: 'object',
        required: ['amount', 'currency'],
        properties: {
          amount: { type: 'number', minimum: 0 },
          currency: { type: 'string', enum: ['USDT', 'ETH', 'BTC'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { amount, currency } = request.body;
      const result = await convertToUSD(amount, currency);
      
      if (!result.success) {
        return reply.code(400).send(result);
      }
      
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to convert price'
      });
    }
  });
  
  // Convert USD to crypto
  fastify.post('/prices/convert-from-usd', {
    schema: {
      body: {
        type: 'object',
        required: ['usdAmount', 'currency'],
        properties: {
          usdAmount: { type: 'number', minimum: 0 },
          currency: { type: 'string', enum: ['USDT', 'ETH', 'BTC'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { usdAmount, currency } = request.body;
      const result = await convertFromUSD(usdAmount, currency);
      
      if (!result.success) {
        return reply.code(400).send(result);
      }
      
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to convert price'
      });
    }
  });
}
