// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Ethereum address validation
export const isValidEthereumAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Price validation
export const isValidPrice = (price) => {
  return !isNaN(price) && parseFloat(price) > 0;
};

// File size validation
export const isValidFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

// File type validation
export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

// String length validation
export const isValidLength = (str, min, max) => {
  const length = str.trim().length;
  return length >= min && length <= max;
};

// Required field validation
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};
