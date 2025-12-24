import { ethers } from 'ethers';
import { writable, get } from 'svelte/store';

// Wallet connection types
export const WALLET_TYPES = {
  METAMASK: 'metamask',
  WALLETCONNECT: 'walletconnect'
};

// Wallet store
export const walletStore = writable({
  isConnected: false,
  address: null,
  provider: null,
  signer: null,
  chainId: null,
  balance: '0',
  walletType: null
});

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Connect to MetaMask
export const connectMetaMask = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create provider with better error handling
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Add retry logic for network operations
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    let network;
    let chainId = 1; // Default to mainnet
    try {
      network = await provider.getNetwork();
      chainId = Number(network.chainId);
    } catch (networkError) {
      console.warn('Could not fetch network info, using default:', networkError.message);
    }
    
    // Try to get balance with better error handling and timeout
    let balance = '0';
    try {
      const balancePromise = provider.getBalance(address);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Balance fetch timeout')), 5000)
      );
      
      const balanceWei = await Promise.race([balancePromise, timeoutPromise]);
      balance = ethers.formatEther(balanceWei);
    } catch (balanceError) {
      console.warn('Could not fetch balance, using default:', balanceError.message);
      // Continue without balance - it's not critical for authentication
    }

    // Update store
    walletStore.set({
      isConnected: true,
      address,
      provider,
      signer,
      chainId,
      balance,
      walletType: WALLET_TYPES.METAMASK
    });

    // Listen for account changes with error handling
    if (window.ethereum.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return { address, chainId, walletType: WALLET_TYPES.METAMASK };
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    
    // Provide more specific error messages
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    } else if (error.code === -32002) {
      throw new Error('MetaMask is busy. Please try again.');
    } else if (error.message?.includes('RPC')) {
      throw new Error('Network connection issue. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

// Connect wallet (generic function that supports multiple wallet types)
export const connectWallet = async (walletType = WALLET_TYPES.METAMASK) => {
  switch (walletType) {
    case WALLET_TYPES.METAMASK:
      return await connectMetaMask();
    case WALLET_TYPES.WALLETCONNECT:
      return await connectWalletConnect();
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`);
  }
};

// Connect via WalletConnect (using existing Web3Modal/Wagmi setup)
export const connectWalletConnect = async () => {
  try {
    // This will be handled by the Web3Modal component
    // For now, we'll throw an error to indicate it should be handled by the UI
    throw new Error('WalletConnect should be initiated through the Web3Modal UI component');
  } catch (error) {
    console.error('Error connecting via WalletConnect:', error);
    throw error;
  }
};

// Disconnect wallet
export const disconnectWallet = () => {
  const currentWallet = get(walletStore);
  
  if (currentWallet.walletType === WALLET_TYPES.METAMASK && window.ethereum) {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  }
  
  walletStore.set({
    isConnected: false,
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    balance: '0',
    walletType: null
  });
};

// Handle account changes
const handleAccountsChanged = async (accounts) => {
  if (accounts.length === 0) {
    disconnectWallet();
  } else {
    // Reconnect with new account
    await connectMetaMask();
  }
};

// Handle chain changes
const handleChainChanged = (chainId) => {
  // Reload the page to reset the app state
  window.location.reload();
};

// Generate authentication message with nonce
export const generateAuthMessage = (address, nonce) => {
  return `Welcome to MeritStack!\n\nPlease sign this message to authenticate your wallet.\n\nWallet Address: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
};

// Sign message for authentication
export const signMessage = async (message) => {
  const wallet = get(walletStore);

  if (!wallet.signer) {
    throw new Error('Wallet not connected');
  }

  try {
    const signature = await wallet.signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

// Sign authentication message with nonce
export const signAuthMessage = async (nonce) => {
  const wallet = get(walletStore);
  
  if (!wallet.address) {
    throw new Error('Wallet not connected');
  }

  const message = generateAuthMessage(wallet.address, nonce);
  return await signMessage(message);
};

// Verify signature (client-side verification)
export const verifySignature = (message, signature, address) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

// Switch to specific network
export const switchNetwork = async (chainId) => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      await addNetwork(chainId);
    } else {
      throw error;
    }
  }
};

// Add network to MetaMask
const addNetwork = async (chainId) => {
  const networks = {
    97: {
      chainId: '0x61',
      chainName: 'BNB Smart Chain Testnet',
      nativeCurrency: {
        name: 'tBNB',
        symbol: 'tBNB',
        decimals: 18,
      },
      rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545', 'https://data-seed-prebsc-2-s1.binance.org:8545'],
      blockExplorerUrls: ['https://testnet.bscscan.com/'],
    },
    // Add more networks as needed
  };

  const network = networks[chainId];
  if (!network) {
    throw new Error(`Network ${chainId} not supported`);
  }

  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [network],
  });
};

// Get wallet balance with retry logic
export const updateBalance = async (retries = 3) => {
  const wallet = get(walletStore);

  if (!wallet.provider || !wallet.address) {
    return;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const balance = await wallet.provider.getBalance(wallet.address);
      walletStore.update((store) => ({
        ...store,
        balance: ethers.formatEther(balance)
      }));
      return; // Success, exit retry loop
    } catch (error) {
      console.warn(`Balance fetch attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        // Last attempt failed, log error but don't throw
        console.error('Failed to update balance after all retries:', error);
        return;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

// Check if wallet is already connected on page load
export const checkWalletConnection = async () => {
  if (!isMetaMaskInstalled()) {
    return false;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      await connectMetaMask();
      return true;
    }
  } catch (error) {
    console.error('Error checking wallet connection:', error);
  }
  
  return false;
};