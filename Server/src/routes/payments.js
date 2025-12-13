import paymentService from '../services/paymentService.js';
import { authenticateToken } from '../middleware/auth.js';

async function paymentRoutes(fastify, options) {

  // Send payment
  fastify.post('/payments/send', {
  preHandler: [authenticateToken],
  schema: {
    body: {
      type: 'object',
      required: ['candidateId', 'amount', 'tokenType'],
      properties: {
        candidateId: { type: 'string' },
        amount: { type: 'number', minimum: 0.001, maximum: 1000 },
        tokenType: { type: 'string', enum: ['ETH', 'USDC', 'KIRO'] },
        jobId: { type: 'string' },
        purpose: { type: 'string', enum: ['candidate_payment', 'gig_payment', 'bonus', 'refund'] },
        notes: { type: 'string', maxLength: 500 }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { user } = request;
    const { candidateId, amount, tokenType, jobId, purpose, notes } = request.body;

    // Get candidate user ID
    const CandidateProfile = (await import('../models/CandidateProfile.js')).default;
    const User = (await import('../models/User.js')).default;
    
    const candidate = await CandidateProfile.findById(candidateId);
    if (!candidate) {
      return reply.code(404).send({
        success: false,
        message: 'Candidate not found'
      });
    }

    const candidateUser = await User.findOne({
      $or: [
        { username: candidate.username },
        { walletAddress: candidate.walletAddress }
      ]
    });

    if (!candidateUser) {
      return reply.code(404).send({
        success: false,
        message: 'Candidate user account not found'
      });
    }

    // Prepare payment data
    const paymentData = {
      fromUserId: user.id,
      toUserId: candidateUser._id,
      amount,
      tokenType,
      jobId,
      purpose: purpose || 'candidate_payment',
      notes: notes || ''
    };

    // Validate payment data
    paymentService.validatePaymentData(paymentData);

    // Process payment
    const payment = await paymentService.sendPayment(paymentData);

    reply.send({
      success: true,
      payment,
      message: 'Payment sent successfully'
    });

  } catch (error) {
    console.error('Send payment error:', error);
    reply.code(500).send({
      success: false,
      message: error.message || 'Failed to send payment'
    });
  }
});

  // Get payment history
  fastify.get('/payments/history', {
  preHandler: [authenticateToken],
  schema: {
    querystring: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['all', 'sent', 'received'], default: 'all' },
        page: { type: 'number', minimum: 1, default: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100, default: 20 }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { user } = request;
    const { type, page, limit } = request.query;

    const result = await paymentService.getPaymentHistory(user.id, {
      type,
      page,
      limit
    });

    reply.send({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Payment history error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

  // Get user earnings
  fastify.get('/payments/earnings', {
  preHandler: [authenticateToken]
}, async (request, reply) => {
  try {
    const { user } = request;

    const earnings = await paymentService.getUserEarnings(user.id);

    reply.send({
      success: true,
      earnings
    });

  } catch (error) {
    console.error('Earnings fetch error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch earnings'
    });
  }
});

  // Get payment statistics
  fastify.get('/payments/stats', {
  preHandler: [authenticateToken]
}, async (request, reply) => {
  try {
    const { user } = request;

    const stats = await paymentService.getPaymentStats(user.id);

    reply.send({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Payment stats error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

  // Get exchange rates
  fastify.get('/payments/rates', async (request, reply) => {
  try {
    const rates = paymentService.getExchangeRates();

    reply.send({
      success: true,
      rates
    });

  } catch (error) {
    console.error('Exchange rates error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch exchange rates'
    });
  }
});

  // Verify payment (for testing purposes)
  fastify.post('/payments/verify', {
  preHandler: [authenticateToken],
  schema: {
    body: {
      type: 'object',
      required: ['transactionId'],
      properties: {
        transactionId: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { transactionId } = request.body;

    const Payment = (await import('../models/Payment.js')).default;
    const payment = await Payment.findOne({ transactionId })
      .populate('sender', 'displayName email')
      .populate('recipient', 'displayName email')
      .populate('job', 'title');

    if (!payment) {
      return reply.code(404).send({
        success: false,
        message: 'Payment not found'
      });
    }

    reply.send({
      success: true,
      payment,
      verified: payment.status === 'completed'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

}

export default paymentRoutes;