import { isValidTokenType, isValidObjectId, sanitizeString } from './validation.js';

// Validate gig title
export const isValidGigTitle = (title) => {
  if (typeof title !== 'string') return false;
  const trimmed = title.trim();
  return trimmed.length >= 10 && trimmed.length <= 100;
};

// Validate gig description
export const isValidGigDescription = (description) => {
  if (typeof description !== 'string') return false;
  const trimmed = description.trim();
  return trimmed.length >= 50 && trimmed.length <= 5000;
};

// Validate category
export const isValidCategory = (category) => {
  const validCategories = [
    'graphics-design',
    'digital-marketing',
    'writing-translation',
    'video-animation',
    'music-audio',
    'programming-tech',
    'business',
    'lifestyle',
    'data',
    'photography'
  ];
  return validCategories.includes(category);
};

// Validate price
export const isValidGigPrice = (price) => {
  return !isNaN(price) && parseFloat(price) > 0 && parseFloat(price) < 1000000;
};

// Validate delivery time
export const isValidDeliveryTime = (days) => {
  return Number.isInteger(days) && days >= 1 && days <= 365;
};

// Validate revisions
export const isValidRevisions = (revisions) => {
  return Number.isInteger(revisions) && revisions >= 0 && revisions <= 100;
};

// Validate package
export const isValidPackage = (pkg) => {
  if (!pkg || typeof pkg !== 'object') return false;
  
  if (!isValidGigPrice(pkg.price)) return false;
  if (!pkg.description || pkg.description.trim().length < 10 || pkg.description.trim().length > 500) return false;
  if (!isValidDeliveryTime(pkg.deliveryDays)) return false;
  if (pkg.revisions !== undefined && !isValidRevisions(pkg.revisions)) return false;
  
  return true;
};

// Validate pricing structure
export const isValidPricing = (pricing) => {
  if (!pricing || typeof pricing !== 'object') return false;
  
  // Validate base price
  if (!isValidGigPrice(pricing.basePrice)) return false;
  
  // Validate currency
  if (!isValidTokenType(pricing.currency)) return false;
  
  // Validate packages - at least one must be present
  const packages = pricing.packages || {};
  const hasBasic = packages.basic && isValidPackage(packages.basic);
  const hasStandard = packages.standard && isValidPackage(packages.standard);
  const hasPremium = packages.premium && isValidPackage(packages.premium);
  
  if (!hasBasic && !hasStandard && !hasPremium) {
    return false;
  }
  
  // Validate package prices are in ascending order if multiple packages exist
  const packagePrices = [];
  if (hasBasic) packagePrices.push(packages.basic.price);
  if (hasStandard) packagePrices.push(packages.standard.price);
  if (hasPremium) packagePrices.push(packages.premium.price);
  
  for (let i = 1; i < packagePrices.length; i++) {
    if (packagePrices[i] <= packagePrices[i - 1]) {
      return false;
    }
  }
  
  return true;
};

// Validate tags array
export const isValidTags = (tags) => {
  if (!Array.isArray(tags)) return false;
  if (tags.length > 10) return false;
  
  return tags.every(tag => {
    return typeof tag === 'string' && 
           tag.trim().length >= 2 && 
           tag.trim().length <= 30;
  });
};

// Validate images array
export const isValidImages = (images) => {
  if (!Array.isArray(images)) return false;
  if (images.length === 0 || images.length > 10) return false;
  
  return images.every(img => {
    return typeof img === 'string' && img.trim().length > 0;
  });
};

// Validate complete gig data for creation
export const validateGigCreation = (gigData) => {
  const errors = [];
  
  // Validate owner ID
  if (!gigData.ownerId || !isValidObjectId(gigData.ownerId)) {
    errors.push('Invalid owner ID');
  }
  
  // Validate title
  if (!isValidGigTitle(gigData.title)) {
    errors.push('Title must be between 10 and 100 characters');
  }
  
  // Validate description
  if (!isValidGigDescription(gigData.description)) {
    errors.push('Description must be between 50 and 5000 characters');
  }
  
  // Validate category
  if (!isValidCategory(gigData.category)) {
    errors.push('Invalid category');
  }
  
  // Validate pricing
  if (!isValidPricing(gigData.pricing)) {
    errors.push('Invalid pricing structure');
  }
  
  // Validate delivery time
  if (!isValidDeliveryTime(gigData.deliveryTime)) {
    errors.push('Delivery time must be between 1 and 365 days');
  }
  
  // Validate revisions (optional)
  if (gigData.revisions !== undefined && !isValidRevisions(gigData.revisions)) {
    errors.push('Revisions must be between 0 and 100');
  }
  
  // Validate tags (optional)
  if (gigData.tags && !isValidTags(gigData.tags)) {
    errors.push('Invalid tags format or too many tags');
  }
  
  // Validate images (optional but recommended)
  if (gigData.images && !isValidImages(gigData.images)) {
    errors.push('Invalid images format or count');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate gig update data
export const validateGigUpdate = (updateData) => {
  const errors = [];
  
  // Only validate fields that are present in the update
  if (updateData.title !== undefined && !isValidGigTitle(updateData.title)) {
    errors.push('Title must be between 10 and 100 characters');
  }
  
  if (updateData.description !== undefined && !isValidGigDescription(updateData.description)) {
    errors.push('Description must be between 50 and 5000 characters');
  }
  
  if (updateData.category !== undefined && !isValidCategory(updateData.category)) {
    errors.push('Invalid category');
  }
  
  if (updateData.pricing !== undefined && !isValidPricing(updateData.pricing)) {
    errors.push('Invalid pricing structure');
  }
  
  if (updateData.deliveryTime !== undefined && !isValidDeliveryTime(updateData.deliveryTime)) {
    errors.push('Delivery time must be between 1 and 365 days');
  }
  
  if (updateData.revisions !== undefined && !isValidRevisions(updateData.revisions)) {
    errors.push('Revisions must be between 0 and 100');
  }
  
  if (updateData.tags !== undefined && !isValidTags(updateData.tags)) {
    errors.push('Invalid tags format or too many tags');
  }
  
  if (updateData.images !== undefined && !isValidImages(updateData.images)) {
    errors.push('Invalid images format or count');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize gig data
export const sanitizeGigData = (gigData) => {
  const sanitized = {};
  
  if (gigData.title) sanitized.title = sanitizeString(gigData.title);
  if (gigData.description) sanitized.description = sanitizeString(gigData.description);
  if (gigData.category) sanitized.category = sanitizeString(gigData.category).toLowerCase();
  if (gigData.subcategory) sanitized.subcategory = sanitizeString(gigData.subcategory).toLowerCase();
  if (gigData.requirements) sanitized.requirements = sanitizeString(gigData.requirements);
  
  if (gigData.tags && Array.isArray(gigData.tags)) {
    sanitized.tags = gigData.tags.map(tag => sanitizeString(tag).toLowerCase());
  }
  
  if (gigData.pricing) {
    sanitized.pricing = { ...gigData.pricing };
  }
  
  if (gigData.deliveryTime) sanitized.deliveryTime = parseInt(gigData.deliveryTime);
  if (gigData.revisions !== undefined) sanitized.revisions = parseInt(gigData.revisions);
  if (gigData.images) sanitized.images = gigData.images;
  if (gigData.isActive !== undefined) sanitized.isActive = Boolean(gigData.isActive);
  
  return sanitized;
};
