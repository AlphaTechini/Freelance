// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
};

// Escrow Status
export const ESCROW_STATUS = {
  HELD: 'held',
  RELEASED: 'released',
  DISPUTED: 'disputed'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed'
};

// Payment Types
export const PAYMENT_TYPE = {
  PAYMENT: 'payment',
  RELEASE: 'release',
  REFUND: 'refund'
};

// Supported Tokens
export const SUPPORTED_TOKENS = ['USDT', 'ETH', 'BTC'];

// Platform Fee (percentage)
export const PLATFORM_FEE_PERCENTAGE = 5;

// Rate Limiting
export const RATE_LIMIT = {
  MAX_REQUESTS: 100,
  WINDOW_MS: 60000 // 1 minute
};

// File Upload Limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// JWT Expiration
export const JWT_EXPIRATION = '7d';

// Error Codes
export const ERROR_CODES = {
  WALLET_SIGNATURE_INVALID: 'WALLET_SIGNATURE_INVALID',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_VERIFICATION_FAILED: 'TRANSACTION_VERIFICATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR'
};
