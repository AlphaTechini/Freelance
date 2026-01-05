import mongoose from 'mongoose';

const candidateProfileSchema = new mongoose.Schema({
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
  
  // Bio and description
  bio: {
    type: String,
    default: '',
    maxlength: 1000
  },
  
  // Education information
  major: {
    type: String,
    default: '',
    trim: true
  },
  
  fieldOfStudy: {
    type: String,
    default: '',
    trim: true
  },
  
  educationLevel: {
    type: String,
    enum: ['student', 'graduate', 'phd', ''],
    default: '',
    index: true
  },
  
  university: {
    type: String,
    default: '',
    trim: true
  },
  
  // Skills
  skills: [{
    type: String,
    trim: true
  }],
  
  // Experience
  yearsOfExperience: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Portfolio and GitHub
  portfolioUrl: {
    type: String,
    default: '',
    trim: true
  },
  
  githubUrl: {
    type: String,
    default: '',
    trim: true
  },
  
  // Availability
  availability: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', '6 Months', '3 Months', 'Months', ''],
    default: ''
  },
  
  // Work history
  workHistory: [{
    company: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    }
  }],
  
  // Profile visibility
  isPublished: {
    type: Boolean,
    default: false
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
  collection: 'candidateProfiles'
});

// Indexes for efficient queries
candidateProfileSchema.index({ userId: 1 });
candidateProfileSchema.index({ username: 1 });
candidateProfileSchema.index({ walletAddress: 1 });
candidateProfileSchema.index({ skills: 1, isPublished: 1 });
candidateProfileSchema.index({ educationLevel: 1, isPublished: 1 });
candidateProfileSchema.index({ yearsOfExperience: 1, isPublished: 1 });

// Static method to find by user ID
candidateProfileSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Static method to search candidates
candidateProfileSchema.statics.searchCandidates = function(filters = {}, options = {}) {
  const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  const query = { isPublished: true };
  
  if (filters.skills && filters.skills.length > 0) {
    query.skills = { $in: filters.skills };
  }
  
  if (filters.educationLevel) {
    query.educationLevel = filters.educationLevel;
  }
  
  if (filters.minExperience !== undefined) {
    query.yearsOfExperience = { $gte: filters.minExperience };
  }
  
  if (filters.availability) {
    query.availability = filters.availability;
  }
  
  return this.find(query)
    .populate('userId', 'displayName email profileImage rating')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip);
};

const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);

export default CandidateProfile;
