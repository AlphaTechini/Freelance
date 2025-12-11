import {
  createGig,
  getGigById,
  updateGig,
  deleteGig,
  getGigsByOwner,
  browseGigs,
  getGigsByCategory,
  searchGigs,
  getFeaturedGigs
} from '../services/gigService.js';

export default async function gigRoutes(fastify, options) {
  
  // Create a new gig (authenticated)
  fastify.post('/gigs', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['title', 'description', 'category', 'pricing', 'deliveryTime'],
        properties: {
          title: { type: 'string', minLength: 10, maxLength: 100 },
          description: { type: 'string', minLength: 50, maxLength: 5000 },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          pricing: {
            type: 'object',
            required: ['basePrice', 'currency', 'packages'],
            properties: {
              basePrice: { type: 'number', minimum: 0 },
              currency: { type: 'string', enum: ['USDT', 'ETH', 'BTC'] },
              packages: { type: 'object' }
            }
          },
          deliveryTime: { type: 'number', minimum: 1, maximum: 365 },
          revisions: { type: 'number', minimum: 0 },
          tags: { type: 'array', items: { type: 'string' } },
          images: { type: 'array', items: { type: 'string' } },
          requirements: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const gigData = {
        ...request.body,
        ownerId: userId
      };
      
      const result = await createGig(gigData);
      
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error
        });
      }
      
      return reply.code(201).send({
        success: true,
        gig: result.gig
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to create gig'
      });
    }
  });
  
  // Get all gigs with filters and pagination
  fastify.get('/gigs', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          currency: { type: 'string', enum: ['USDT', 'ETH', 'BTC'] },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          search: { type: 'string' },
          sortBy: { type: 'string', default: 'createdAt' },
          sortOrder: { type: 'number', enum: [1, -1], default: -1 },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await browseGigs(request.query, request.query);
      
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error
        });
      }
      
      return reply.send({
        success: true,
        gigs: result.gigs,
        pagination: result.pagination
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch gigs'
      });
    }
  });
  
  // Get featured gigs
  fastify.get('/gigs/featured', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { limit = 10 } = request.query;
      const result = await getFeaturedGigs(limit);
      
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error
        });
      }
      
      return reply.send({
        success: true,
        gigs: result.gigs
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch featured gigs'
      });
    }
  });
  
  // Get gigs by category
  fastify.get('/gigs/category/:category', {
    schema: {
      params: {
        type: 'object',
        required: ['category'],
        properties: {
          category: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          sortBy: { type: 'string', default: 'createdAt' },
          sortOrder: { type: 'number', enum: [1, -1], default: -1 },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { category } = request.params;
      const result = await getGigsByCategory(category, request.query);
      
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error
        });
      }
      
      return reply.send({
        success: true,
        gigs: result.gigs,
        pagination: result.pagination
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch gigs by category'
      });
    }
  });
  
  // Search gigs
  fastify.get('/gigs/search', {
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string' },
          sortBy: { type: 'string', default: 'createdAt' },
          sortOrder: { type: 'number', enum: [1, -1], default: -1 },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { q, ...options } = request.query;
      const result = await searchGigs(q, options);
      
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error
        });
      }
      
      return reply.send({
        success: true,
        gigs: result.gigs,
        count: result.count
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to search gigs'
      });
    }
  });
  
  // Get gig by ID
  fastify.get('/gigs/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          incrementView: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { incrementView = false } = request.query;
      
      const result = await getGigById(id, incrementView);
      
      if (!result.success) {
        return reply.code(404).send({
          success: false,
          error: result.error
        });
      }
      
      return reply.send({
        success: true,
        gig: result.gig
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch gig'
      });
    }
  });
  
  // Get gigs by owner
  fastify.get('/gigs/owner/:ownerId', {
    schema: {
      params: {
        type: 'object',
        required: ['ownerId'],
        properties: {
          ownerId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          includeInactive: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { ownerId } = request.params;
      const { includeInactive = false } = request.query;
      
      const result = await getGigsByOwner(ownerId, includeInactive);
      
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error
        });
      }
      
      return reply.send({
        success: true,
        gigs: result.gigs,
        count: result.count
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch gigs by owner'
      });
    }
  });
  
  // Update gig (authenticated)
  fastify.put('/gigs/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 10, maxLength: 100 },
          description: { type: 'string', minLength: 50, maxLength: 5000 },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          pricing: { type: 'object' },
          deliveryTime: { type: 'number', minimum: 1, maximum: 365 },
          revisions: { type: 'number', minimum: 0 },
          tags: { type: 'array', items: { type: 'string' } },
          images: { type: 'array', items: { type: 'string' } },
          requirements: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;
      
      const result = await updateGig(id, userId, request.body);
      
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error
        });
      }
      
      return reply.send({
        success: true,
        gig: result.gig
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update gig'
      });
    }
  });
  
  // Delete gig (authenticated)
  fastify.delete('/gigs/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;
      
      const result = await deleteGig(id, userId);
      
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error
        });
      }
      
      return reply.send({
        success: true,
        message: result.message
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete gig'
      });
    }
  });
}
