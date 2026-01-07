import mongoose from 'mongoose';

const portfolioAnalysisSchema = new mongoose.Schema({
  // Reference to candidate
  candidateId: {
    type: String,
    required: true,
    index: true
  },

  // URLs analyzed
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

  // AI-generated scores (Requirement 2.3)
  scores: {
    overall: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    codeQuality: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    projectDepth: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    portfolioCompleteness: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    portfolioWebsite: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // GitHub data extracted (Requirement 2.2)
  githubData: {
    repositories: {
      type: Number,
      default: 0
    },
    stars: {
      type: Number,
      default: 0
    },
    commits: {
      type: Number,
      default: 0
    },
    languages: [{
      type: String,
      trim: true
    }],
    lastActivity: {
      type: Date
    },
    topProjects: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        default: '',
        trim: true
      },
      stars: {
        type: Number,
        default: 0
      },
      language: {
        type: String,
        default: '',
        trim: true
      },
      url: {
        type: String,
        required: true,
        trim: true
      }
    }]
  },

  // Portfolio data extracted (Requirement 2.2)
  portfolioData: {
    projects: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        default: '',
        trim: true
      },
      techStack: [{
        type: String,
        trim: true
      }],
      deploymentUrl: {
        type: String,
        default: '',
        trim: true
      },
      complexity: {
        type: String,
        enum: ['simple', 'moderate', 'complex'],
        default: 'simple'
      }
    }],
    readmeQuality: {
      type: String,
      enum: ['poor', 'good', 'excellent'],
      default: 'poor'
    },
    hasDeployedProjects: {
      type: Boolean,
      default: false
    }
  },

  // AI-generated improvement suggestions (Requirement 2.4)
  improvements: [{
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    suggestion: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['code', 'portfolio', 'github', 'documentation'],
      trim: true
    }
  }],

  // Analysis metadata
  analyzedAt: {
    type: Date,
    default: Date.now
  },

  // Analysis status
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  },

  // Error information if analysis failed
  error: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'portfolioAnalyses'
});

// Indexes for efficient queries
portfolioAnalysisSchema.index({ candidateId: 1 });
portfolioAnalysisSchema.index({ analyzedAt: -1 });
portfolioAnalysisSchema.index({ status: 1 });

// Static method to find latest analysis for candidate
portfolioAnalysisSchema.statics.findLatestForCandidate = function (candidateId) {
  return this.findOne({ candidateId })
    .sort({ analyzedAt: -1 });
};

// Static method to find all analyses for candidate
portfolioAnalysisSchema.statics.findAllForCandidate = function (candidateId) {
  return this.find({ candidateId })
    .sort({ analyzedAt: -1 });
};

// Method to calculate overall score
portfolioAnalysisSchema.methods.calculateOverallScore = function () {
  const { codeQuality, projectDepth, portfolioCompleteness, portfolioWebsite } = this.scores;
  // If portfolioWebsite score exists and is > 0, include it in the average
  if (portfolioWebsite && portfolioWebsite > 0) {
    this.scores.overall = Math.round((codeQuality + projectDepth + portfolioCompleteness + portfolioWebsite) / 4);
  } else {
    this.scores.overall = Math.round((codeQuality + projectDepth + portfolioCompleteness) / 3);
  }
  return this.scores.overall;
};

const PortfolioAnalysis = mongoose.model('PortfolioAnalysis', portfolioAnalysisSchema);

export default PortfolioAnalysis;