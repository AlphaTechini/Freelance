import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Initialize providers for different networks
export const getEthereumProvider = () => {
  return new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
};

export const getPolygonProvider = () => {
  return new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
};

// Verify transaction on blockchain
export const verifyTransaction = async (txHash, network = 'ethereum') => {
  try {
    const provider = network === 'polygon' ? getPolygonProvider() : getEthereumProvider();
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

// Get wallet balance for specific token
export const getWalletBalance = async (walletAddress, tokenAddress = null, network = 'ethereum') => {
  try {
    const provider = network === 'polygon' ? getPolygonProvider() : getEthereumProvider();
    
    if (!tokenAddress) {
      // Get native token balance (ETH/MATIC)
      const balance = await provider.getBalance(walletAddress);
      return {
        balance: ethers.formatEther(balance),
        symbol: network === 'polygon' ? 'MATIC' : 'ETH'
      };
    } else {
      // Get ERC20 token balance
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