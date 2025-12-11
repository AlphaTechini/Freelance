// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Supported Cryptocurrencies
export const SUPPORTED_TOKENS = {
  USDT: {
    name: 'Tether',
    symbol: 'USDT',
    decimals: 6,
    icon: '₮'
  },
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    icon: 'Ξ'
  },
  BTC: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    icon: '₿'
  }
};

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

// Gig Categories
export const GIG_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Blockchain Development',
  'UI/UX Design',
  'Graphic Design',
  'Content Writing',
  'Digital Marketing',
  'Video Editing',
  'Animation',
  'Other'
];

// Platform Fee (percentage)
export const PLATFORM_FEE_PERCENTAGE = 5;

// File Upload Limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/zip',
  'text/plain'
];
