import portfolioAnalyzer from '../services/portfolioAnalyzer.js';
import CandidateProfile from '../models/CandidateProfile.js';

async function portfolioRoutes(fastify, options) {
  // Schema for portfolio analysis request
  const analyzePortfolioSchema = {
    body: {
      type: 'object',
      required: ['candidateId'],
      properties: {
        candidateId: { type: 'string' },
        portfolioUrl: { type: 'string', format: 'uri' },
        githubUrl: { type: 'string', format: 'uri' }
      }
    }
  };

  // Schema for analysis response
  const analysisResponseSchema = {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          analysisId: { type: 'string' },
          scores: {
            type: 'object',
            properties: {
              overall: { type: 'number' },
              codeQuality: { type: 'number' },
              projectDepth: { type: 'number' },
              portfolioCompleteness: { type: 'number' }
            }
          },
          improvements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                priority: { type: 'number' },
                suggestion: { type: 'string' },
                category: { type: 'string' }
              }
            }
          },
          analyzedAt: { type: 'string', format: 'date-time' }
        }
      },
      error: { type: 'string' }
    }
  };

  /**
   * POST /api/portfolio/analyze
   * Trigger AI portfolio analysis (Requirement 2.1)
   */
  fastify.post('/portfolio/analyze', {
    schema: {
      body: analyzePortfolioSchema.body,
      response: {
        200: analysisResponseSchema,
        400: analysisResponseSchema,
        500: analysisResponseSchema
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { candidateId, portfolioUrl, githubUrl } = request.body;

      // Verify candidate exists
      const candidate = await CandidateProfile.findOne({ 
        $or: [
          { _id: candidateId },
          { userId: candidateId },
          { username: candidateId }
        ]
      });

      if (!candidate) {
        return reply.status(404).send({
          success: false,
          error: 'Candidate not found'
        });
      }

      // Use URLs from request or fall back to candidate profile
      const finalPortfolioUrl = portfolioUrl || candidate.portfolioUrl;
      const finalGithubUrl = githubUrl || candidate.githubUrl;

      if (!finalPortfolioUrl && !finalGithubUrl) {
        return reply.status(400).send({
          success: false,
          error: 'At least one URL (portfolio or GitHub) is required for analysis'
        });
      }

      // Check if analysis is already in progress
      if (portfolioAnalyzer.isAnalysisInProgress(candidateId)) {
        return reply.status(409).send({
          success: false,
          error: 'Analysis already in progress for this candidate'
        });
      }

      // Start analysis (async)
      const analysisPromise = portfolioAnalyzer.analyzePortfolio(
        candidateId,
        finalPortfolioUrl,
        finalGithubUrl
      );

      // Return immediately with analysis started status
      reply.send({
        success: true,
        data: {
          message: 'Portfolio analysis started',
          candidateId,
          status: 'analyzing'
        }
      });

      // Continue analysis in background
      try {
        await analysisPromise;
      } catch (error) {
        fastify.log.error(`Background analysis failed for candidate ${candidateId}:`, error);
      }

    } catch (error) {
      fastify.log.error('Portfolio analysis error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to start portfolio analysis'
      });
    }
  });

  /**
   * GET /api/portfolio/analysis/:candidateId
   * Get latest analysis results (Requirement 2.5)
   * Accepts candidateId (MongoDB ObjectId), username, or userId
   */
  fastify.get('/portfolio/analysis/:candidateId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          candidateId: { type: 'string' }
        },
        required: ['candidateId']
      },
      response: {
        200: analysisResponseSchema,
        404: analysisResponseSchema
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { candidateId } = request.params;

      // Try to find candidate by various identifiers
      const candidate = await CandidateProfile.findOne({
        $or: [
          { _id: candidateId },
          { userId: candidateId },
          { username: candidateId }
        ]
      });

      // Use the found candidate's _id or the original candidateId
      const lookupId = candidate ? candidate._id.toString() : candidateId;

      const analysis = await portfolioAnalyzer.getLatestAnalysis(lookupId);

      if (!analysis) {
        return reply.status(404).send({
          success: false,
          error: 'No analysis found for this candidate'
        });
      }

      reply.send({
        success: true,
        data: {
          analysisId: analysis._id,
          candidateId: analysis.candidateId,
          status: analysis.status,
          scores: analysis.scores,
          githubData: analysis.githubData,
          portfolioData: analysis.portfolioData,
          improvements: analysis.improvements,
          analyzedAt: analysis.analyzedAt,
          error: analysis.error
        }
      });

    } catch (error) {
      fastify.log.error('Get analysis error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to retrieve analysis'
      });
    }
  });

  /**
   * GET /api/portfolio/suggestions/:candidateId
   * Get improvement suggestions (Requirement 2.4)
   * Accepts candidateId (MongoDB ObjectId), username, or userId
   */
  fastify.get('/portfolio/suggestions/:candidateId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          candidateId: { type: 'string' }
        },
        required: ['candidateId']
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { candidateId } = request.params;

      // Try to find candidate by various identifiers
      const candidate = await CandidateProfile.findOne({
        $or: [
          { _id: candidateId },
          { userId: candidateId },
          { username: candidateId }
        ]
      });

      // Use the found candidate's _id or the original candidateId
      const lookupId = candidate ? candidate._id.toString() : candidateId;

      const analysis = await portfolioAnalyzer.getLatestAnalysis(lookupId);

      if (!analysis || !analysis.improvements) {
        return reply.status(404).send({
          success: false,
          error: 'No improvement suggestions found for this candidate'
        });
      }

      reply.send({
        success: true,
        data: {
          candidateId: lookupId,
          improvements: analysis.improvements,
          analyzedAt: analysis.analyzedAt
        }
      });

    } catch (error) {
      fastify.log.error('Get suggestions error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to retrieve improvement suggestions'
      });
    }
  });

  /**
   * GET /api/portfolio/history/:candidateId
   * Get analysis history for candidate
   * Accepts candidateId (MongoDB ObjectId), username, or userId
   */
  fastify.get('/portfolio/history/:candidateId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          candidateId: { type: 'string' }
        },
        required: ['candidateId']
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { candidateId } = request.params;

      // Try to find candidate by various identifiers
      const candidate = await CandidateProfile.findOne({
        $or: [
          { _id: candidateId },
          { userId: candidateId },
          { username: candidateId }
        ]
      });

      // Use the found candidate's _id or the original candidateId
      const lookupId = candidate ? candidate._id.toString() : candidateId;

      const analyses = await portfolioAnalyzer.getAllAnalyses(lookupId);

      reply.send({
        success: true,
        data: {
          candidateId: lookupId,
          analyses: analyses.map(analysis => ({
            analysisId: analysis._id,
            status: analysis.status,
            scores: analysis.scores,
            analyzedAt: analysis.analyzedAt,
            error: analysis.error
          }))
        }
      });

    } catch (error) {
      fastify.log.error('Get analysis history error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to retrieve analysis history'
      });
    }
  });

  /**
   * GET /api/portfolio/status/:candidateId
   * Check analysis status
   * Accepts candidateId (MongoDB ObjectId), username, or userId
   */
  fastify.get('/portfolio/status/:candidateId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          candidateId: { type: 'string' }
        },
        required: ['candidateId']
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { candidateId } = request.params;

      // Try to find candidate by various identifiers
      const candidate = await CandidateProfile.findOne({
        $or: [
          { _id: candidateId },
          { userId: candidateId },
          { username: candidateId }
        ]
      });

      // Use the found candidate's _id or the original candidateId
      const lookupId = candidate ? candidate._id.toString() : candidateId;

      const inProgress = portfolioAnalyzer.isAnalysisInProgress(lookupId);
      const latestAnalysis = await portfolioAnalyzer.getLatestAnalysis(lookupId);

      reply.send({
        success: true,
        data: {
          candidateId: lookupId,
          inProgress,
          latestStatus: latestAnalysis ? latestAnalysis.status : null,
          lastAnalyzed: latestAnalysis ? latestAnalysis.analyzedAt : null
        }
      });

    } catch (error) {
      fastify.log.error('Get analysis status error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to check analysis status'
      });
    }
  });
}

export default portfolioRoutes;