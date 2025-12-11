import fetch from 'node-fetch';

// Cache for price data
const priceCache = {
  data: {},
  lastUpdate: null,
  cacheDuration: 60000 // 1 minute
};

/**
 * Get cryptocurrency prices in USD
 * Uses CoinGecko API (free tier)
 */
export const getCryptoPrices = async () => {
  try {
    // Check cache first
    const now = Date.now();
    if (priceCache.lastUpdate && (now - priceCache.lastUpdate) < priceCache.cacheDuration) {
      return {
        success: true,
        prices: priceCache.data,
        cached: true
      };
    }
    
    // Fetch from CoinGecko API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether,ethereum,bitcoin&vs_currencies=usd',
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform data to our format
    const prices = {
      USDT: data.tether?.usd || 1,
      ETH: data.ethereum?.usd || 0,
      BTC: data.bitcoin?.usd || 0
    };
    
    // Update cache
    priceCache.data = prices;
    priceCache.lastUpdate = now;
    
    return {
      success: true,
      prices,
      cached: false
    };
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    
    // Return cached data if available, otherwise return default prices
    if (priceCache.data && Object.keys(priceCache.data).length > 0) {
      return {
        success: true,
        prices: priceCache.data,
        cached: true,
        error: 'Using cached prices due to API error'
      };
    }
    
    // Fallback prices
    return {
      success: false,
      prices: {
        USDT: 1,
        ETH: 2000,
        BTC: 40000
      },
      error: error.message,
      fallback: true
    };
  }
};

/**
 * Convert crypto amount to USD
 */
export const convertToUSD = async (amount, currency) => {
  try {
    const { prices } = await getCryptoPrices();
    
    if (!prices[currency]) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    
    const usdValue = amount * prices[currency];
    
    return {
      success: true,
      amount,
      currency,
      usdValue,
      rate: prices[currency]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Convert USD amount to crypto
 */
export const convertFromUSD = async (usdAmount, currency) => {
  try {
    const { prices } = await getCryptoPrices();
    
    if (!prices[currency]) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    
    const cryptoAmount = usdAmount / prices[currency];
    
    return {
      success: true,
      usdAmount,
      currency,
      cryptoAmount,
      rate: prices[currency]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get price for a specific currency
 */
export const getPrice = async (currency) => {
  try {
    const { prices } = await getCryptoPrices();
    
    if (!prices[currency]) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    
    return {
      success: true,
      currency,
      price: prices[currency]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Clear price cache (useful for testing or manual refresh)
 */
export const clearPriceCache = () => {
  priceCache.data = {};
  priceCache.lastUpdate = null;
  return { success: true, message: 'Price cache cleared' };
};
