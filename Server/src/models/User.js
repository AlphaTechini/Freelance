import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  // Username for authentication (Requirement 1.5)
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-z0-9_-]+$/,
    index: true
  },
  
  // Password for email authentication
  password: {
    type: String,
    required: function() {
      return !this.walletAddress; // Password required if no wallet
    },
    minlength: 6
  },
  
  // Wallet information (optional for email-only users)
  walletAddress: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    lowercase: true,
    index: true
  },
  
  // Nonce for wallet signature verification (Requirement 1.5)
  nonce: {
    type: String,
    default: ''
  },
  
  // User role (Requirement 1.1)
  role: {
    type: String,
    required: true,
    enum: ['freelancer', 'recruiter', 'student', 'graduate', 'phd'],
    index: true
  },
  
  // Basic profile information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  
  // Skills array for freelancers
  skills: [{
    type: String,
    trim: true
  }],
  
  // Profile image URL (Cloudinary)
  profileImage: {
    type: String,
    default: ''
  },
  
  // Rating and statistics
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // User preferences
  preferences: {
    preferredTokens: [{
      type: String,
      enum: ['USDT', 'ETH', 'BTC']
    }],
    notifications: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isSuspended: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  joinDate: {
    type: Date,
    default: Date.now
  },
  
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for efficient queries
userSchema.index({ displayName: 'text', bio: 'text', skills: 'text' });
userSchema.index({ rating: -1, totalOrders: -1 });
userSchema.index({ isActive: 1, isSuspended: 1 });
userSchema.index({ username: 1, walletAddress: 1 });

// Virtual for full profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/profile/${this._id}`;
});

// Method to update rating
userSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating * this.totalReviews) + newRating;
  this.totalReviews += 1;
  this.rating = totalRating / this.totalReviews;
  return this.save();
};

// Method to increment order count
userSchema.methods.incrementOrderCount = function() {
  this.totalOrders += 1;
  return this.save();
};

// Method to update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Static method to find by wallet address
userSchema.statics.findByWallet = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

// Static method to check username availability
userSchema.statics.isUsernameAvailable = async function(username) {
  const user = await this.findOne({ username: username.toLowerCase() });
  return !user;
};

// Static method to search users
userSchema.statics.searchUsers = function(query, options = {}) {
  const { limit = 20, skip = 0, sortBy = 'rating', sortOrder = -1 } = options;
  
  const searchQuery = {
    isActive: true,
    isSuspended: false
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery)
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip)
    .select('-firebaseUid -__v');
};

// Pre-save middleware to hash password and normalize fields
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password') && this.password) {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  
  // Normalize fields
  if (this.isModified('walletAddress') && this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  if (this.isModified('username')) {
    this.username = this.username.toLowerCase();
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
