import Payment from '../models/Payment.js';
import Earnings from '../models/Earnings.js';
import User from '../models/User.js';
import JobPosting from '../models/JobPosting.js';

class PaymentService {
  constructor() {
    // Test token exchange rates (for demo purposes)
    this.exchangeRates = {
      ETH: 2000,   // $2000 per ETH
      USDC: 1,     // $1 per USDC
      KIRO: 0.5    // $0.50 per KIRO
    };
  }

  // Send test token payment
  async sendPayment(paymentData) {
    const { fromUserId, toUserId, amount, tokenType, jobId, purpose, notes } = paymentData;

    try {
      // Validate users exist
      const [sender, recipient] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId)
      ]);

      if (!sender) {
        throw new Error('Sender not found');
      }

      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Validate job if provided
      let job = null;
      if (jobId) {
        job = await JobPosting.findById(jobId);
        if (!job) {
          throw new Error('Job not found');
        }
      }

      // Validate payment amount
      if (amount <= 0 || amount > 1000) {
        throw new Error('Invalid payment amount. Must be between 0 and 1000 tokens.');
      }

      // Validate token type
      if (!['ETH', 'USDC', 'KIRO'].includes(tokenType)) {
        throw new Error('Invalid token type');
      }

      // Create payment record
      const payment = new Payment({
        fromUserId,
        toUserId,
        jobId,
        amount,
        tokenType,
        status: 'pending',
        metadata: {
          purpose: purpose || 'candidate_payment',
          notes: notes || ''
        }
      });

      await payment.save();

      // Simulate payment processing (in real implementation, this would interact with blockchain)
      await this.processTestPayment(payment);

      // Update recipient earnings
      await this.updateEarnings(payment, sender, job);

      // Return payment with populated data
      const populatedPayment = await Payment.findById(payment._id)
        .populate('sender', 'displayName email')
        .populate('recipient', 'displayName email')
        .populate('job', 'title');

      return populatedPayment;

    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  // Simulate test token payment processing
  async processTestPayment(payment) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate 95% success rate
      const success = Math.random() > 0.05;

      if (success) {
        await payment.complete();
        console.log(`Test payment completed: ${payment.transactionId}`);
      } else {
        await payment.fail();
        throw new Error('Simulated payment failure');
      }

    } catch (error) {
      await payment.fail();
      throw error;
    }
  }

  // Update recipient earnings
  async updateEarnings(payment, sender, job) {
    try {
      const earningsData = {
        amount: payment.amount,
        tokenType: payment.tokenType,
        paymentId: payment._id,
        from: sender.displayName || sender.name || 'Unknown',
        jobTitle: job ? job.title : 'Direct Payment'
      };

      await Earnings.createOrUpdate(payment.toUserId, earningsData);
      console.log(`Earnings updated for user ${payment.toUserId}`);

    } catch (error) {
      console.error('Failed to update earnings:', error);
      // Don't throw error here as payment was successful
    }
  }

  // Get payment history for user
  async getPaymentHistory(userId, options = {}) {
    const { type = 'all', limit = 50, page = 1 } = options;

    let query = {};
    
    if (type === 'sent') {
      query.fromUserId = userId;
    } else if (type === 'received') {
      query.toUserId = userId;
    } else {
      query = {
        $or: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      };
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('sender', 'displayName email')
        .populate('recipient', 'displayName email')
        .populate('job', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get earnings for user
  async getUserEarnings(userId) {
    try {
      const earnings = await Earnings.findByUser(userId);
      
      if (!earnings) {
        // Return default earnings structure
        return {
          userId,
          totalEarnings: {
            ETH: 0,
            USDC: 0,
            KIRO: 0
          },
          transactions: [],
          totalEarningsUSD: 0,
          transactionCount: 0
        };
      }

      return earnings;

    } catch (error) {
      console.error('Failed to get user earnings:', error);
      throw error;
    }
  }

  // Get payment statistics
  async getPaymentStats(userId) {
    try {
      const [sentStats, receivedStats] = await Promise.all([
        Payment.aggregate([
          { $match: { fromUserId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
          {
            $group: {
              _id: '$tokenType',
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]),
        Payment.aggregate([
          { $match: { toUserId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
          {
            $group: {
              _id: '$tokenType',
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        sent: this.formatTokenStats(sentStats),
        received: this.formatTokenStats(receivedStats)
      };

    } catch (error) {
      console.error('Failed to get payment stats:', error);
      throw error;
    }
  }

  // Format token statistics
  formatTokenStats(stats) {
    const formatted = {
      ETH: { amount: 0, count: 0 },
      USDC: { amount: 0, count: 0 },
      KIRO: { amount: 0, count: 0 }
    };

    stats.forEach(stat => {
      formatted[stat._id] = {
        amount: stat.totalAmount,
        count: stat.count
      };
    });

    return formatted;
  }

  // Convert token amount to USD (for display purposes)
  convertToUSD(amount, tokenType) {
    const rate = this.exchangeRates[tokenType] || 0;
    return amount * rate;
  }

  // Get exchange rates
  getExchangeRates() {
    return { ...this.exchangeRates };
  }

  // Validate payment data
  validatePaymentData(paymentData) {
    const { fromUserId, toUserId, amount, tokenType } = paymentData;

    if (!fromUserId || !toUserId) {
      throw new Error('Sender and recipient are required');
    }

    if (fromUserId === toUserId) {
      throw new Error('Cannot send payment to yourself');
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount > 1000) {
      throw new Error('Maximum payment amount is 1000 tokens');
    }

    if (!['ETH', 'USDC', 'KIRO'].includes(tokenType)) {
      throw new Error('Invalid token type');
    }

    return true;
  }
}

export default new PaymentService();