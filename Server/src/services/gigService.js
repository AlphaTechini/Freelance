import Gig from '../models/Gig.js';
import User from '../models/User.js';
import { validateGigCreation, validateGigUpdate, sanitizeGigData } from '../utils/gigValidation.js';

/**
 * Create a new gig
 */
export const createGig = async (gigData) => {
  try {
    // Sanitize input data
    const sanitized = sanitizeGigData(gigData);
    
    // Validate gig data
    const validation = validateGigCreation({ ...sanitized, ownerId: gigData.ownerId });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Verify owner exists
    const owner = await User.findById(gigData.ownerId);
    if (!owner) {
      throw new Error('Owner not found');
    }
    
    // Create gig
    const gig = new Gig({
      ownerId: gigData.ownerId,
      ...sanitized
    });
    
    await gig.save();
    
    // Populate owner information
    await gig.populate('ownerId', 'displayName profileImage rating totalOrders');
    
    return {
      success: true,
      gig
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get gig by ID
 */
export const getGigById = async (gigId, incrementView = false) => {
  try {
    const gig = await Gig.findById(gigId)
      .populate('ownerId', 'displayName profileImage rating totalOrders bio skills');
    
    if (!gig) {
      throw new Error('Gig not found');
    }
    
    // Increment view count if requested
    if (incrementView && gig.isActive) {
      await gig.incrementViews();
    }
    
    return {
      success: true,
      gig
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update gig
 */
export const updateGig = async (gigId, ownerId, updateData) => {
  try {
    // Find gig
    const gig = await Gig.findById(gigId);
    
    if (!gig) {
      throw new Error('Gig not found');
    }
    
    // Verify ownership
    if (gig.ownerId.toString() !== ownerId) {
      throw new Error('Unauthorized: You can only update your own gigs');
    }
    
    // Sanitize update data
    const sanitized = sanitizeGigData(updateData);
    
    // Validate update data
    const validation = validateGigUpdate(sanitized);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Update gig
    Object.assign(gig, sanitized);
    await gig.save();
    
    // Populate owner information
    await gig.populate('ownerId', 'displayName profileImage rating totalOrders');
    
    return {
      success: true,
      gig
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete gig (soft delete by setting isActive to false)
 */
export const deleteGig = async (gigId, ownerId) => {
  try {
    // Find gig
    const gig = await Gig.findById(gigId);
    
    if (!gig) {
      throw new Error('Gig not found');
    }
    
    // Verify ownership
    if (gig.ownerId.toString() !== ownerId) {
      throw new Error('Unauthorized: You can only delete your own gigs');
    }
    
    // Soft delete
    gig.isActive = false;
    await gig.save();
    
    return {
      success: true,
      message: 'Gig deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get gigs by owner
 */
export const getGigsByOwner = async (ownerId, includeInactive = false) => {
  try {
    const gigs = await Gig.findByOwner(ownerId, includeInactive);
    
    return {
      success: true,
      gigs,
      count: gigs.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Browse gigs with filters and pagination
 */
export const browseGigs = async (filters = {}, options = {}) => {
  try {
    const {
      category,
      currency,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = -1,
      page = 1,
      limit = 20
    } = { ...filters, ...options };
    
    const skip = (page - 1) * limit;
    
    // Build query filters
    const queryFilters = {};
    
    if (category) {
      queryFilters.category = category;
    }
    
    if (currency) {
      queryFilters['pricing.currency'] = currency;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      queryFilters['pricing.basePrice'] = {};
      if (minPrice !== undefined) {
        queryFilters['pricing.basePrice'].$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        queryFilters['pricing.basePrice'].$lte = parseFloat(maxPrice);
      }
    }
    
    // Execute query
    let gigs;
    if (search) {
      gigs = await Gig.searchGigs(search, queryFilters, { limit, skip, sortBy, sortOrder });
    } else {
      gigs = await Gig.find({ isActive: true, ...queryFilters })
        .populate('ownerId', 'displayName profileImage rating totalOrders')
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(skip);
    }
    
    // Get total count for pagination
    const total = await Gig.countDocuments({ isActive: true, ...queryFilters });
    
    return {
      success: true,
      gigs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get gigs by category
 */
export const getGigsByCategory = async (category, options = {}) => {
  try {
    const {
      sortBy = 'createdAt',
      sortOrder = -1,
      page = 1,
      limit = 20
    } = options;
    
    const skip = (page - 1) * limit;
    
    const gigs = await Gig.findByCategory(category, { limit, skip, sortBy, sortOrder });
    const total = await Gig.countDocuments({ category, isActive: true });
    
    return {
      success: true,
      gigs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Search gigs
 */
export const searchGigs = async (query, options = {}) => {
  try {
    const {
      sortBy = 'createdAt',
      sortOrder = -1,
      page = 1,
      limit = 20
    } = options;
    
    const skip = (page - 1) * limit;
    
    const gigs = await Gig.searchGigs(query, {}, { limit, skip, sortBy, sortOrder });
    
    return {
      success: true,
      gigs,
      count: gigs.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get featured/popular gigs
 */
export const getFeaturedGigs = async (limit = 10) => {
  try {
    const gigs = await Gig.find({ isActive: true })
      .populate('ownerId', 'displayName profileImage rating totalOrders')
      .sort({ 'stats.orders': -1, 'stats.rating': -1 })
      .limit(limit);
    
    return {
      success: true,
      gigs
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update gig statistics
 */
export const updateGigStats = async (gigId, statsUpdate) => {
  try {
    const gig = await Gig.findById(gigId);
    
    if (!gig) {
      throw new Error('Gig not found');
    }
    
    if (statsUpdate.incrementOrders) {
      await gig.incrementOrders();
    }
    
    if (statsUpdate.rating !== undefined) {
      await gig.updateRating(statsUpdate.rating);
    }
    
    return {
      success: true,
      gig
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
