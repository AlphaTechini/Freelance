import User from '../models/User.js';
import { validateUserCreation, validateUserUpdate, sanitizeUserData } from '../utils/userValidation.js';

class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      // Validate user data
      const validation = validateUserCreation(userData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Sanitize input
      const sanitizedData = sanitizeUserData(userData);
      
      // Check if user already exists
      const orConditions = [
        { username: userData.username.toLowerCase() },
        { walletAddress: userData.walletAddress.toLowerCase() },
        { email: userData.email.toLowerCase() }
      ];
      
      // Only check firebaseUid if provided
      if (userData.firebaseUid) {
        orConditions.push({ firebaseUid: userData.firebaseUid });
      }
      
      const existingUser = await User.findOne({ $or: orConditions });
      
      if (existingUser) {
        if (existingUser.username === userData.username.toLowerCase()) {
          throw new Error('User with this username already exists');
        }
        if (existingUser.firebaseUid === userData.firebaseUid) {
          throw new Error('User with this Firebase UID already exists');
        }
        if (existingUser.walletAddress === userData.walletAddress.toLowerCase()) {
          throw new Error('User with this wallet address already exists');
        }
        if (existingUser.email === userData.email.toLowerCase()) {
          throw new Error('User with this email already exists');
        }
      }
      
      // Validate role
      if (!userData.role || !['freelancer', 'recruiter', 'student', 'graduate', 'phd'].includes(userData.role)) {
        throw new Error('Valid role is required (freelancer, recruiter, student, graduate, phd)');
      }
      
      // Create user - firebaseUid is optional for wallet-only auth
      const userDoc = {
        username: userData.username.toLowerCase(),
        walletAddress: userData.walletAddress.toLowerCase(),
        email: userData.email.toLowerCase(),
        displayName: sanitizedData.displayName,
        role: userData.role,
        bio: sanitizedData.bio || '',
        skills: sanitizedData.skills || [],
        profileImage: sanitizedData.profileImage || '',
        preferences: sanitizedData.preferences || {
          preferredTokens: [],
          notifications: true,
          emailNotifications: true
        }
      };
      
      // Only add firebaseUid if provided
      if (userData.firebaseUid) {
        userDoc.firebaseUid = userData.firebaseUid;
      }
      
      const user = new User(userDoc);
      
      await user.save();
      
      // Return user without sensitive fields
      return this.sanitizeUserOutput(user);
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
  
  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-firebaseUid -__v');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }
  
  /**
   * Get user by Firebase UID
   * @param {String} firebaseUid - Firebase UID
   * @returns {Promise<Object>} User object
   */
  async getUserByFirebaseUid(firebaseUid) {
    try {
      const user = await User.findByFirebaseUid(firebaseUid);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this.sanitizeUserOutput(user);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }
  
  /**
   * Get user by wallet address
   * @param {String} walletAddress - Wallet address
   * @returns {Promise<Object>} User object
   */
  async getUserByWallet(walletAddress) {
    try {
      const user = await User.findByWallet(walletAddress);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this.sanitizeUserOutput(user);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }
  
  /**
   * Get user by username
   * @param {String} username - Username
   * @returns {Promise<Object>} User object
   */
  async getUserByUsername(username) {
    try {
      const user = await User.findByUsername(username);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this.sanitizeUserOutput(user);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }
  
  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      // Validate update data
      const validation = validateUserUpdate(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Sanitize input
      const sanitizedData = sanitizeUserData(updateData);
      
      // Prevent updating sensitive fields
      delete sanitizedData.username;
      delete sanitizedData.firebaseUid;
      delete sanitizedData.walletAddress;
      delete sanitizedData.rating;
      delete sanitizedData.totalOrders;
      delete sanitizedData.totalReviews;
      delete sanitizedData.isVerified;
      delete sanitizedData.joinDate;
      
      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: sanitizedData },
        { new: true, runValidators: true }
      ).select('-firebaseUid -__v');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
  
  /**
   * Delete user (soft delete by deactivating)
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { isActive: false } },
        { new: true }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return { success: true, message: 'User deactivated successfully' };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
  
  /**
   * Search users
   * @param {String} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of users
   */
  async searchUsers(query, options = {}) {
    try {
      const users = await User.searchUsers(query, options);
      return users;
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }
  
  /**
   * Get all users with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Users and pagination info
   */
  async getAllUsers(options = {}) {
    try {
      const { limit = 20, skip = 0, sortBy = 'joinDate', sortOrder = -1 } = options;
      
      const query = { isActive: true, isSuspended: false };
      
      const [users, total] = await Promise.all([
        User.find(query)
          .sort({ [sortBy]: sortOrder })
          .limit(limit)
          .skip(skip)
          .select('-firebaseUid -__v'),
        User.countDocuments(query)
      ]);
      
      return {
        users,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + users.length < total
        }
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }
  
  /**
   * Update user rating
   * @param {String} userId - User ID
   * @param {Number} rating - New rating (1-5)
   * @returns {Promise<Object>} Updated user
   */
  async updateUserRating(userId, rating) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.updateRating(rating);
      
      return this.sanitizeUserOutput(user);
    } catch (error) {
      throw new Error(`Failed to update rating: ${error.message}`);
    }
  }
  
  /**
   * Increment user order count
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async incrementOrderCount(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.incrementOrderCount();
      
      return this.sanitizeUserOutput(user);
    } catch (error) {
      throw new Error(`Failed to increment order count: ${error.message}`);
    }
  }
  
  /**
   * Update user last active timestamp
   * @param {String} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastActive(userId) {
    try {
      const user = await User.findById(userId);
      if (user) {
        await user.updateLastActive();
      }
    } catch (error) {
      // Silent fail for last active update
      console.error('Failed to update last active:', error.message);
    }
  }
  
  /**
   * Sanitize user output (remove sensitive fields)
   * @param {Object} user - User object
   * @returns {Object} Sanitized user
   */
  sanitizeUserOutput(user) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.firebaseUid;
    delete userObj.__v;
    return userObj;
  }
}

export default new UserService();
