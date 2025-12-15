import { isValidEmail, isValidEthereumAddress, sanitizeString } from './validation.js';

// Validate user creation data
export const validateUserCreation = (userData) => {
  const errors = [];
  
  // Validate Firebase UID
  if (!userData.firebaseUid || typeof userData.firebaseUid !== 'string' || userData.firebaseUid.trim().length === 0) {
    errors.push('Firebase UID is required');
  }
  
  // Validate wallet address
  if (!userData.walletAddress) {
    errors.push('Wallet address is required');
  } else if (!isValidEthereumAddress(userData.walletAddress)) {
    errors.push('Invalid wallet address');
  }
  
  // Validate email
  if (!userData.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(userData.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate display name
  if (!userData.displayName || typeof userData.displayName !== 'string') {
    errors.push('Display name is required');
  } else {
    const trimmedName = userData.displayName.trim();
    if (trimmedName.length < 2) {
      errors.push('Display name must be at least 2 characters');
    } else if (trimmedName.length > 50) {
      errors.push('Display name must not exceed 50 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate user profile update
export const validateUserUpdate = (updateData) => {
  const errors = [];
  
  // Validate display name if provided
  if (updateData.displayName !== undefined) {
    if (typeof updateData.displayName !== 'string') {
      errors.push('Display name must be a string');
    } else {
      const trimmedName = updateData.displayName.trim();
      if (trimmedName.length < 2) {
        errors.push('Display name must be at least 2 characters');
      } else if (trimmedName.length > 50) {
        errors.push('Display name must not exceed 50 characters');
      }
    }
  }
  
  // Validate bio if provided
  if (updateData.bio !== undefined) {
    if (typeof updateData.bio !== 'string') {
      errors.push('Bio must be a string');
    } else if (updateData.bio.length > 500) {
      errors.push('Bio must not exceed 500 characters');
    }
  }
  
  // Validate skills if provided
  if (updateData.skills !== undefined) {
    if (!Array.isArray(updateData.skills)) {
      errors.push('Skills must be an array');
    } else if (updateData.skills.length > 20) {
      errors.push('Maximum 20 skills allowed');
    } else {
      const invalidSkills = updateData.skills.filter(skill => 
        typeof skill !== 'string' || skill.trim().length === 0 || skill.length > 30
      );
      if (invalidSkills.length > 0) {
        errors.push('Each skill must be a non-empty string with max 30 characters');
      }
    }
  }
  
  // Validate email if provided
  if (updateData.email !== undefined && !isValidEmail(updateData.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate wallet address if provided (should not be updated normally)
  if (updateData.walletAddress !== undefined && !isValidEthereumAddress(updateData.walletAddress)) {
    errors.push('Invalid wallet address');
  }
  
  // Validate preferred tokens if provided
  if (updateData.preferences?.preferredTokens !== undefined) {
    const validTokens = ['USDT', 'ETH', 'BTC'];
    if (!Array.isArray(updateData.preferences.preferredTokens)) {
      errors.push('Preferred tokens must be an array');
    } else {
      const invalidTokens = updateData.preferences.preferredTokens.filter(
        token => !validTokens.includes(token)
      );
      if (invalidTokens.length > 0) {
        errors.push(`Invalid token types: ${invalidTokens.join(', ')}. Valid tokens: ${validTokens.join(', ')}`);
      }
    }
  }
  
  // Validate profile image URL if provided
  if (updateData.profileImage !== undefined) {
    if (typeof updateData.profileImage !== 'string') {
      errors.push('Profile image must be a string URL');
    } else if (updateData.profileImage.length > 0) {
      // Basic URL validation
      try {
        new URL(updateData.profileImage);
      } catch (e) {
        errors.push('Profile image must be a valid URL');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize user input data
export const sanitizeUserData = (userData) => {
  const sanitized = {};
  
  if (userData.displayName) {
    sanitized.displayName = sanitizeString(userData.displayName);
  }
  
  if (userData.bio) {
    sanitized.bio = sanitizeString(userData.bio);
  }
  
  if (userData.email) {
    sanitized.email = userData.email.toLowerCase().trim();
  }
  
  if (userData.walletAddress) {
    sanitized.walletAddress = userData.walletAddress.toLowerCase().trim();
  }
  
  if (userData.skills && Array.isArray(userData.skills)) {
    sanitized.skills = userData.skills.map(skill => sanitizeString(skill)).filter(s => s.length > 0);
  }
  
  if (userData.profileImage) {
    sanitized.profileImage = userData.profileImage.trim();
  }
  
  if (userData.preferences) {
    sanitized.preferences = {};
    
    if (userData.preferences.preferredTokens) {
      sanitized.preferences.preferredTokens = userData.preferences.preferredTokens;
    }
    
    if (typeof userData.preferences.notifications === 'boolean') {
      sanitized.preferences.notifications = userData.preferences.notifications;
    }
    
    if (typeof userData.preferences.emailNotifications === 'boolean') {
      sanitized.preferences.emailNotifications = userData.preferences.emailNotifications;
    }
  }
  
  return sanitized;
};

// Validate user search query
export const validateSearchQuery = (query) => {
  const errors = [];
  
  if (query.limit !== undefined) {
    const limit = parseInt(query.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }
  }
  
  if (query.skip !== undefined) {
    const skip = parseInt(query.skip);
    if (isNaN(skip) || skip < 0) {
      errors.push('Skip must be a non-negative number');
    }
  }
  
  if (query.sortBy !== undefined) {
    const validSortFields = ['rating', 'totalOrders', 'joinDate', 'displayName'];
    if (!validSortFields.includes(query.sortBy)) {
      errors.push(`Invalid sort field. Valid options: ${validSortFields.join(', ')}`);
    }
  }
  
  if (query.sortOrder !== undefined) {
    const sortOrder = parseInt(query.sortOrder);
    if (sortOrder !== 1 && sortOrder !== -1) {
      errors.push('Sort order must be 1 (ascending) or -1 (descending)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
