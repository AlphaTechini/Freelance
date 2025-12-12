import mongoose from 'mongoose';

const earningsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  totalEarnings: {
    ETH: {
      type: Number,
      default: 0,
      min: 0
    },
    USDC: {
      type: Number,
      default: 0,
      min: 0
    },
    KIRO: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  transactions: [{
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    tokenType: {
      type: String,
      enum: ['ETH', 'USDC', 'KIRO'],
      required: true
    },
    from: {
      type: String,
      required: true
    },
    jobTitle: {
      type: String
    },
    receivedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
earningsSchema.index({ userId: 1 });
earningsSchema.index({ 'transactions.paymentId': 1 });
earningsSchema.index({ 'transactions.receivedAt': -1 });

// Virtual for user details
earningsSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for total earnings across all tokens
earningsSchema.virtual('totalEarningsUSD').get(function() {
  // Simple conversion rates for demo (in production, use real-time rates)
  const rates = {
    ETH: 2000,   // $2000 per ETH
    USDC: 1,     // $1 per USDC
    KIRO: 0.5    // $0.50 per KIRO
  };

  return (
    (this.totalEarnings.ETH * rates.ETH) +
    (this.totalEarnings.USDC * rates.USDC) +
    (this.totalEarnings.KIRO * rates.KIRO)
  );
});

// Virtual for transaction count
earningsSchema.virtual('transactionCount').get(function() {
  return this.transactions ? this.transactions.length : 0;
});

// Static methods
earningsSchema.statics.findByUser = function(userId) {
  return this.findOne({ userId }).populate('user', 'displayName email');
};

earningsSchema.statics.createOrUpdate = async function(userId, paymentData) {
  const { amount, tokenType, paymentId, from, jobTitle } = paymentData;

  let earnings = await this.findOne({ userId });

  if (!earnings) {
    // Create new earnings record
    earnings = new this({
      userId,
      totalEarnings: {
        ETH: tokenType === 'ETH' ? amount : 0,
        USDC: tokenType === 'USDC' ? amount : 0,
        KIRO: tokenType === 'KIRO' ? amount : 0
      },
      transactions: [{
        paymentId,
        amount,
        tokenType,
        from,
        jobTitle,
        receivedAt: new Date()
      }]
    });
  } else {
    // Update existing earnings
    earnings.totalEarnings[tokenType] += amount;
    earnings.transactions.push({
      paymentId,
      amount,
      tokenType,
      from,
      jobTitle,
      receivedAt: new Date()
    });
  }

  return earnings.save();
};

// Instance methods
earningsSchema.methods.addTransaction = function(paymentData) {
  const { amount, tokenType, paymentId, from, jobTitle } = paymentData;

  // Update total earnings
  this.totalEarnings[tokenType] += amount;

  // Add transaction record
  this.transactions.push({
    paymentId,
    amount,
    tokenType,
    from,
    jobTitle,
    receivedAt: new Date()
  });

  return this.save();
};

earningsSchema.methods.getRecentTransactions = function(limit = 10) {
  return this.transactions
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
    .slice(0, limit);
};

earningsSchema.methods.getEarningsByToken = function(tokenType) {
  return {
    total: this.totalEarnings[tokenType] || 0,
    transactions: this.transactions.filter(tx => tx.tokenType === tokenType)
  };
};

// Pre-save middleware
earningsSchema.pre('save', function(next) {
  // Sort transactions by date (newest first)
  if (this.transactions && this.transactions.length > 0) {
    this.transactions.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  }

  next();
});

const Earnings = mongoose.model('Earnings', earningsSchema);

export default Earnings;