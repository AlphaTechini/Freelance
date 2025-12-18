import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  deliveryDays: {
    type: Number,
    required: true,
    min: 1,
    max: 365
  },
  revisions: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const gigSchema = new mongoose.Schema({
  // Owner reference
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Basic information
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 100
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 50,
    maxlength: 5000
  },
  
  // Category and tags
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  subcategory: {
    type: String,
    trim: true,
    default: ''
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Pricing structure
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      enum: ['USDT', 'ETH', 'BTC'],
      default: 'USDT'
    },
    packages: {
      basic: packageSchema,
      standard: packageSchema,
      premium: packageSchema
    }
  },
  
  // Media
  images: [{
    type: String,
    trim: true
  }],
  
  // Requirements and delivery
  requirements: {
    type: String,
    default: '',
    maxlength: 2000
  },
  
  deliveryTime: {
    type: Number,
    required: true,
    min: 1,
    max: 365
  },
  
  revisions: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Statistics
  stats: {
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    orders: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true,
  collection: 'gigs'
});

// Compound indexes for efficient queries
gigSchema.index({ category: 1, isActive: 1, createdAt: -1 });
gigSchema.index({ ownerId: 1, isActive: 1 });
gigSchema.index({ 'pricing.currency': 1, isActive: 1 });
gigSchema.index({ title: 'text', description: 'text', tags: 'text' });
gigSchema.index({ 'stats.rating': -1, 'stats.orders': -1 });

// Virtual for gig URL
gigSchema.virtual('gigUrl').get(function() {
  return `/gigs/${this._id}`;
});

// Method to increment view count
gigSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

// Method to increment order count
gigSchema.methods.incrementOrders = function() {
  this.stats.orders += 1;
  return this.save();
};

// Method to update rating
gigSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.stats.rating * this.stats.totalReviews) + newRating;
  this.stats.totalReviews += 1;
  this.stats.rating = totalRating / this.stats.totalReviews;
  return this.save();
};

// Static method to find active gigs
gigSchema.statics.findActive = function(options = {}) {
  const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  return this.find({ isActive: true })
    .populate('ownerId', 'displayName profileImage rating totalOrders')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip);
};

// Static method to find by category
gigSchema.statics.findByCategory = function(category, options = {}) {
  const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  return this.find({ category, isActive: true })
    .populate('ownerId', 'displayName profileImage rating totalOrders')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip);
};

// Static method to search gigs
gigSchema.statics.searchGigs = function(query, filters = {}, options = {}) {
  const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  const searchQuery = {
    isActive: true,
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery)
    .populate('ownerId', 'displayName profileImage rating totalOrders')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip);
};

// Static method to find by owner
gigSchema.statics.findByOwner = function(ownerId, includeInactive = false) {
  const query = { ownerId };
  if (!includeInactive) {
    query.isActive = true;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 });
};

// Pre-save middleware to ensure at least one package is defined (Mongoose 9+ style)
gigSchema.pre('save', function() {
  if (!this.pricing.packages.basic && !this.pricing.packages.standard && !this.pricing.packages.premium) {
    throw new Error('At least one pricing package must be defined');
  }
});

const Gig = mongoose.model('Gig', gigSchema);

export default Gig;
