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
    
    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();
    const balance = await provider.getBalance(address);

    // Update store
    walletStore.set({
      isConnected: true,
      address,
      provider,
      signer,
      chainId: Number(network.chainId),
      balance: ethers.formatEther(balance),
      walletType: WALLET_TYPES.METAMASK
    });

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return { address, chainId: Number(network.chainId), walletType: WALLET_TYPES.METAMASK };
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
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
  return `Welcome to CryptoGigs!\n\nPlease sign this message to authenticate your wallet.\n\nWallet Address: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
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
    137: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
      rpcUrls: ['https://polygon-rpc.com/'],
      blockExplorerUrls: ['https://polygonscan.com/'],
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

// Get wallet balance
export const updateBalance = async () => {
  const wallet = await new Promise((resolve) => {
    walletStore.subscribe((value) => {
      resolve(value);
    })();
  });

  if (!wallet.provider || !wallet.address) {
    return;
  }

  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    walletStore.update((store) => ({
      ...store,
      balance: ethers.formatEther(balance)
    }));
  } catch (error) {
    console.error('Error updating balance:', error);
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