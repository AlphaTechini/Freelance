import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Initialize providers for BNB Smart Chain Testnet
export const getBSCTestnetProvider = () => {
  return new ethers.JsonRpcProvider(process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545');
};

// Verify transaction on BNB Smart Chain Testnet
export const verifyTransaction = async (txHash, network = 'bsc-testnet') => {
  try {
    const provider = getBSCTestnetProvider();
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      return { valid: false, error: 'Transaction not found' };
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    
    return {
      valid: true,
      transaction: tx,
      receipt: receipt,
      confirmed: receipt.status === 1
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Get wallet balance for BNB Smart Chain Testnet
export const getWalletBalance = async (walletAddress, tokenAddress = null, network = 'bsc-testnet') => {
  try {
    const provider = getBSCTestnetProvider();
    
    if (!tokenAddress) {
      // Get native token balance (tBNB)
      const balance = await provider.getBalance(walletAddress);
      return {
        balance: ethers.formatEther(balance),
        symbol: 'tBNB'
      };
    } else {
      // Get BEP20 token balance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        provider
      );
      
      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = await tokenContract.decimals();
      
      return {
        balance: ethers.formatUnits(balance, decimals),
        decimals: decimals
      };
    }
  } catch (error) {
    return { error: error.message };
  }
};

// Validate wallet address
export const isValidAddress = (address) => {
  return ethers.isAddress(address);
};