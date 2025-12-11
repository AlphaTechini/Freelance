import mongoose from 'mongoose';

const jobPostingSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  minExperience: {
    type: Number,
    default: 0,
    min: 0,
    max: 50
  },
  educationPreference: {
    type: String,
    enum: ['Any', 'Student', 'Graduate', 'PhD'],
    default: 'Any'
  },
  roleType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    required: true
  },
  budget: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      enum: ['USD', 'ETH', 'USDC', 'KIRO'],
      default: 'USD'
    }
  },
  location: {
    type: String,
    enum: ['Remote', 'On-site', 'Hybrid'],
    default: 'Remote'
  },
  maxCandidates: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'filled'],
    default: 'active'
  },
  applicationDeadline: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Shortlist management
  shortlist: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    matchDetails: {
      type: mongoose.Schema.Types.Mixed
    },
    matchExplanation: {
      type: String
    },
    status: {
      type: String,
      enum: ['shortlisted', 'contacted', 'interviewed', 'hired', 'rejected'],
      default: 'shortlisted'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: 1000
    }
  }],
  // Analytics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    shortlistGenerated: {
      type: Date
    },
    lastShortlistUpdate: {
      type: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
jobPostingSchema.index({ recruiterId: 1, status: 1 });
jobPostingSchema.index({ requiredSkills: 1 });
jobPostingSchema.index({ roleType: 1, status: 1 });
jobPostingSchema.index({ createdAt: -1 });
jobPostingSchema.index({ 'shortlist.candidateId': 1 });

// Virtual for recruiter details
jobPostingSchema.virtual('recruiter', {
  ref: 'User',
  localField: 'recruiterId',
  foreignField: '_id',
  justOne: true
});

// Virtual for shortlist count
jobPostingSchema.virtual('shortlistCount').get(function() {
  return this.shortlist ? this.shortlist.length : 0;
});

// Virtual for active shortlist
jobPostingSchema.virtual('activeShortlist').get(function() {
  return this.shortlist ? this.shortlist.filter(item => item.status === 'shortlisted') : [];
});

// Static methods
jobPostingSchema.statics.findActiveJobs = function() {
  return this.find({ status: 'active' }).sort({ createdAt: -1 });
};

jobPostingSchema.statics.findByRecruiter = function(recruiterId) {
  return this.find({ recruiterId }).sort({ createdAt: -1 });
};

jobPostingSchema.statics.findBySkills = function(skills) {
  return this.find({ 
    requiredSkills: { $in: skills },
    status: 'active'
  }).sort({ createdAt: -1 });
};

// Instance methods
jobPostingSchema.methods.addToShortlist = function(candidateData) {
  // Check if candidate already in shortlist
  const existingIndex = this.shortlist.findIndex(
    item => item.candidateId.toString() === candidateData.candidateId.toString()
  );

  if (existingIndex >= 0) {
    // Update existing entry
    this.shortlist[existingIndex] = {
      ...this.shortlist[existingIndex],
      ...candidateData,
      addedAt: this.shortlist[existingIndex].addedAt // Preserve original date
    };
  } else {
    // Add new entry
    this.shortlist.push(candidateData);
  }

  this.analytics.lastShortlistUpdate = new Date();
  return this.save();
};

jobPostingSchema.methods.updateCandidateStatus = function(candidateId, status, notes = '') {
  const candidate = this.shortlist.find(
    item => item.candidateId.toString() === candidateId.toString()
  );

  if (candidate) {
    candidate.status = status;
    if (notes) candidate.notes = notes;
    this.analytics.lastShortlistUpdate = new Date();
    return this.save();
  }

  throw new Error('Candidate not found in shortlist');
};

jobPostingSchema.methods.getShortlistByStatus = function(status) {
  return this.shortlist.filter(item => item.status === status);
};

jobPostingSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  return this.save();
};

// Pre-save middleware
jobPostingSchema.pre('save', function(next) {
  // Ensure shortlist doesn't exceed maxCandidates
  if (this.shortlist && this.shortlist.length > this.maxCandidates) {
    // Keep only the highest scoring candidates
    this.shortlist.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    this.shortlist = this.shortlist.slice(0, this.maxCandidates);
  }

  // Set shortlist generation date if first time
  if (this.shortlist && this.shortlist.length > 0 && !this.analytics.shortlistGenerated) {
    this.analytics.shortlistGenerated = new Date();
  }

  next();
});

// Pre-remove middleware
jobPostingSchema.pre('remove', function(next) {
  // Clean up any related data if needed
  next();
});

const JobPosting = mongoose.model('JobPosting', jobPostingSchema);

export default JobPosting;