/**
 * GitHub Maturity Evaluation Routes
 * Production-grade endpoints for evaluating software engineering maturity
 */

import githubMaturityService from '../services/githubMaturityService.js';

async function githubRoutes(fastify, options) {
  // Schema for maturity evaluation request
  const evaluateSchema = {
    body: {
      type: 'object',
      required: ['username'],
      properties: {
        username: { type: 'string', minLength: 1, maxLength: 39 },
        accessToken: { type: 'string', description: 'OAuth token for private repo access' }
      }
    }
  };

  // Schema for quick evaluation
  const quickEvaluateSchema = {
    params: {
      type: 'object',
      required: ['username'],
      properties: {
        username: { type: 'string', minLength: 1, maxLength: 39 }
      }
    },
    querystring: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'OAuth token for private repo access' }
      }
    }
  };

  /**
   * POST /api/github/evaluate
   * Full maturity evaluation - comprehensive analysis
   * Returns LLM-ready structured summary
   */
  fastify.post('/github/evaluate', {
    schema: {
      body: evaluateSchema.body,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { username, accessToken } = request.body;
      
      fastify.log.info(`Starting full maturity evaluation for: ${username}`);
      
      const evaluation = await githubMaturityService.evaluateMaturity(username, accessToken);
      
      reply.send({
        success: true,
        data: evaluation
      });
    } catch (error) {
      fastify.log.error(`GitHub evaluation error for ${request.body.username}:`, error);
      
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          error: error.message
        });
      }
      
      reply.status(500).send({
        success: false,
        error: 'Failed to evaluate GitHub profile'
      });
    }
  });

  /**
   * GET /api/github/quick/:username
   * Quick evaluation - minimal API calls for fast assessment
   * Use for initial screening or when full analysis isn't needed
   */
  fastify.get('/github/quick/:username', {
    schema: quickEvaluateSchema,
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { username } = request.params;
      const { token } = request.query;
      
      fastify.log.info(`Quick evaluation for: ${username}`);
      
      const evaluation = await githubMaturityService.quickEvaluate(username, token);
      
      reply.send({
        success: true,
        data: evaluation
      });
    } catch (error) {
      fastify.log.error(`Quick evaluation error for ${request.params.username}:`, error);
      
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          error: error.message
        });
      }
      
      reply.status(500).send({
        success: false,
        error: 'Failed to evaluate GitHub profile'
      });
    }
  });

  /**
   * POST /api/github/batch-evaluate
   * Batch evaluation for multiple users
   * Useful for recruiter candidate screening
   */
  fastify.post('/github/batch-evaluate', {
    schema: {
      body: {
        type: 'object',
        required: ['usernames'],
        properties: {
          usernames: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 10,
            minItems: 1
          },
          quick: { type: 'boolean', default: true }
        }
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { usernames, quick = true } = request.body;
      
      fastify.log.info(`Batch evaluation for ${usernames.length} users (quick: ${quick})`);
      
      const evaluateFunc = quick 
        ? (u) => githubMaturityService.quickEvaluate(u)
        : (u) => githubMaturityService.evaluateMaturity(u);
      
      const results = await Promise.allSettled(
        usernames.map(username => evaluateFunc(username))
      );
      
      const evaluations = results.map((result, index) => ({
        username: usernames[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));
      
      reply.send({
        success: true,
        data: {
          total: usernames.length,
          successful: evaluations.filter(e => e.success).length,
          evaluations
        }
      });
    } catch (error) {
      fastify.log.error('Batch evaluation error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to perform batch evaluation'
      });
    }
  });

  /**
   * GET /api/github/profile/:username
   * Get basic GitHub profile info
   * Lightweight endpoint for profile cards
   */
  fastify.get('/github/profile/:username', {
    schema: {
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { username } = request.params;
      const octokit = githubMaturityService.getOctokit();
      
      const profile = await githubMaturityService.fetchUserProfile(octokit, username);
      
      reply.send({
        success: true,
        data: profile
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          error: error.message
        });
      }
      
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch GitHub profile'
      });
    }
  });
}

export default githubRoutes;
