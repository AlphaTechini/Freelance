import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    index: true
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
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  metadata: {
    purpose: {
      type: String,
      enum: ['candidate_payment', 'gig_payment', 'bonus', 'refund'],
      default: 'candidate_payment'
    },
    notes: {
      type: String,
      maxlength: 500
    }
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
paymentSchema.index({ fromUserId: 1, createdAt: -1 });
paymentSchema.index({ toUserId: 1, createdAt: -1 });
paymentSchema.index({ jobId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ tokenType: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });

// Virtual for sender details
paymentSchema.virtual('sender', {
  ref: 'User',
  localField: 'fromUserId',
  foreignField: '_id',
  justOne: true
});

// Virtual for recipient details
paymentSchema.virtual('recipient', {
  ref: 'User',
  localField: 'toUserId',
  foreignField: '_id',
  justOne: true
});

// Virtual for job details
paymentSchema.virtual('job', {
  ref: 'JobPosting',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true
});

// Static methods
paymentSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { fromUserId: userId },
      { toUserId: userId }
    ]
  }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByRecipient = function(userId) {
  return this.find({ toUserId: userId }).sort({ createdAt: -1 });
};

paymentSchema.statics.findBySender = function(userId) {
  return this.find({ fromUserId: userId }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByJob = function(jobId) {
  return this.find({ jobId }).sort({ createdAt: -1 });
};

paymentSchema.statics.getEarningsByUser = async function(userId) {
  const earnings = await this.aggregate([
    {
      $match: {
        toUserId: new mongoose.Types.ObjectId(userId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$tokenType',
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);

  // Format earnings by token type
  const formattedEarnings = {
    ETH: 0,
    USDC: 0,
    KIRO: 0
  };

  earnings.forEach(earning => {
    formattedEarnings[earning._id] = earning.totalAmount;
  });

  return formattedEarnings;
};

// Instance methods
paymentSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

paymentSchema.methods.fail = function() {
  this.status = 'failed';
  return this.save();
};

// Pre-save middleware (Mongoose 9+ style)
paymentSchema.pre('save', function() {
  // Generate transaction ID if not provided
  if (!this.transactionId) {
    this.transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set completion date when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;