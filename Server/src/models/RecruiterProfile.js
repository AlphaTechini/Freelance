import mongoose from 'mongoose';

const recruiterProfileSchema = new mongoose.Schema({
  // Reference to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Username reference (Requirement 1.2)
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Wallet address reference (Requirement 1.2)
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  
  // Company information
  company: {
    type: String,
    default: '',
    trim: true
  },
  
  position: {
    type: String,
    default: '',
    trim: true
  },
  
  // Bio
  bio: {
    type: String,
    default: '',
    maxlength: 1000
  },
  
  // Industry
  industry: {
    type: String,
    default: '',
    trim: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'recruiterProfiles'
});

// Indexes
recruiterProfileSchema.index({ userId: 1 });
recruiterProfileSchema.index({ username: 1 });
recruiterProfileSchema.index({ walletAddress: 1 });

// Static method to find by user ID
recruiterProfileSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

const RecruiterProfile = mongoose.model('RecruiterProfile', recruiterProfileSchema);

export default RecruiterProfile;
