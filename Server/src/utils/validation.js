import { ethers } from 'ethers';

// Validate Ethereum address
export const isValidEthereumAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

// Validate transaction hash
export const isValidTransactionHash = (hash) => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate price
export const isValidPrice = (price) => {
  return !isNaN(price) && parseFloat(price) > 0;
};

// Validate token type
export const isValidTokenType = (token) => {
  const validTokens = ['USDT', 'ETH', 'BTC'];
  return validTokens.includes(token);
};

// Validate order status
export const isValidOrderStatus = (status) => {
  const validStatuses = ['pending', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed'];
  return validStatuses.includes(status);
};

// Sanitize string input
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

// Validate MongoDB ObjectId
export const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};
