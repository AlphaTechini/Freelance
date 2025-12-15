# BNB Smart Chain Testnet Integration Guide

## Overview

MeritStack now uses **BNB Smart Chain Testnet** for all blockchain operations, providing fast and cost-effective transactions for our crypto payment features. This guide covers the complete integration setup and usage.

## Network Configuration

### BNB Smart Chain Testnet Details
- **Network Name**: BNB Smart Chain Testnet
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545
- **Alternative RPC**: https://data-seed-prebsc-2-s1.binance.org:8545
- **Chain ID**: 97 (0x61 in hexadecimal)
- **Currency Symbol**: tBNB (Testnet BNB)
- **Block Explorer**: https://testnet.bscscan.com

### Why BNB Smart Chain Testnet?

1. **Fast Transactions**: ~3 second block times
2. **Low Fees**: Minimal gas costs for testing
3. **EVM Compatible**: Works with existing Ethereum tools
4. **Reliable Testnet**: Stable and well-maintained
5. **Easy Faucet Access**: Free testnet tokens available

## Setup Instructions

### 1. Add BSC Testnet to MetaMask

**Manual Setup:**
1. Open MetaMask
2. Click network dropdown
3. Select "Add Network"
4. Enter the following details:
   - **Network Name**: BNB Smart Chain Testnet
   - **New RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545
   - **Chain ID**: 97
   - **Currency Symbol**: tBNB
   - **Block Explorer URL**: https://testnet.bscscan.com

**Automatic Setup:**
The platform will automatically prompt users to add the network when connecting their wallet.

### 2. Get Testnet BNB (tBNB)

1. Visit the [BNB Smart Chain Testnet Faucet](https://testnet.binance.org/faucet-smart)
2. Connect your MetaMask wallet
3. Ensure you're on BSC Testnet
4. Request testnet BNB tokens
5. Wait for confirmation (usually instant)

### 3. Environment Configuration

**Frontend (.env):**
```env
# BNB Smart Chain Testnet Configuration
VITE_BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
VITE_BSC_TESTNET_CHAIN_ID=97
VITE_BSC_TESTNET_CURRENCY_SYMBOL=tBNB
VITE_BSC_TESTNET_EXPLORER_URL=https://testnet.bscscan.com
```

**Backend (.env):**
```env
# BNB Smart Chain Testnet Configuration
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BSC_TESTNET_CHAIN_ID=97
BSC_TESTNET_CURRENCY_SYMBOL=tBNB
BSC_TESTNET_EXPLORER_URL=https://testnet.bscscan.com
```

## Features & Functionality

### Supported Operations

1. **Wallet Connection**: Connect MetaMask to BSC Testnet
2. **Balance Checking**: View tBNB balance in real-time
3. **Transaction Verification**: Verify payments on BSC Testnet
4. **Network Switching**: Automatic network switching prompts
5. **Payment Processing**: Send and receive testnet payments

### Payment Flow

1. **Recruiter Initiates Payment**
   - Selects candidate to pay
   - Enters amount in tBNB
   - Confirms transaction in MetaMask

2. **Blockchain Processing**
   - Transaction submitted to BSC Testnet
   - Fast confirmation (~3 seconds)
   - Transaction hash recorded

3. **Platform Updates**
   - Payment status updated
   - Candidate earnings increased
   - Transaction logged in database

### Security Features

- **Testnet Only**: No real money at risk
- **Address Validation**: All wallet addresses validated
- **Transaction Verification**: All payments verified on-chain
- **Error Handling**: Comprehensive error handling for failed transactions

## API Integration

### Blockchain Service Functions

```javascript
// Get BSC Testnet provider
const provider = getBSCTestnetProvider();

// Verify transaction
const result = await verifyTransaction(txHash, 'bsc-testnet');

// Get wallet balance
const balance = await getWalletBalance(walletAddress);
```

### Frontend Wallet Integration

```javascript
// Connect to BSC Testnet
await connectWallet();

// Switch to BSC Testnet
await switchNetwork(97);

// Sign transaction
const signature = await signMessage(message);
```

## Testing Guide

### 1. Wallet Setup Testing
- [ ] Connect MetaMask wallet
- [ ] Add BSC Testnet network
- [ ] Get testnet BNB from faucet
- [ ] Verify balance display

### 2. Payment Testing
- [ ] Create test payment
- [ ] Confirm transaction in MetaMask
- [ ] Verify transaction on BSC Testnet explorer
- [ ] Check balance updates

### 3. Error Handling Testing
- [ ] Test with insufficient balance
- [ ] Test network switching
- [ ] Test transaction rejection
- [ ] Test connection failures

## Troubleshooting

### Common Issues

**1. Network Not Added**
- Solution: Platform automatically prompts to add BSC Testnet
- Manual: Add network details in MetaMask settings

**2. Insufficient Balance**
- Solution: Get more tBNB from the testnet faucet
- Check: Ensure you're on the correct network

**3. Transaction Failures**
- Check: Network connection
- Verify: Sufficient gas (tBNB) for transaction
- Retry: Transaction with higher gas limit

**4. Wrong Network**
- Solution: Switch to BSC Testnet (Chain ID: 97)
- Platform will prompt automatic switching

### Debug Information

**Check Network Connection:**
```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://data-seed-prebsc-1-s1.binance.org:8545
```

**Expected Response:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x61"}
```

## Migration Notes

### Changes from Previous Networks

**Removed:**
- Ethereum mainnet/testnet support
- Polygon network support
- ETH and MATIC token references

**Added:**
- BNB Smart Chain Testnet support
- tBNB token integration
- BSC-specific error handling
- Binance testnet faucet integration

### Code Updates

1. **Environment Variables**: Updated to BSC Testnet URLs
2. **Network Configuration**: Changed chain ID to 97
3. **Token Symbols**: Updated from ETH/MATIC to tBNB
4. **Provider URLs**: Updated to Binance RPC endpoints
5. **Explorer Links**: Updated to BSC Testnet explorer

## Future Enhancements

### Planned Features

1. **Multi-Token Support**: Add USDT and other BEP20 tokens
2. **Smart Contracts**: Deploy escrow contracts on BSC Testnet
3. **Advanced Analytics**: Transaction history and analytics
4. **Mobile Support**: Mobile wallet integration
5. **Batch Payments**: Multiple payments in single transaction

### Mainnet Migration

When ready for production:
1. Update RPC URLs to BSC Mainnet
2. Change Chain ID to 56
3. Update currency symbol to BNB
4. Deploy smart contracts to mainnet
5. Update explorer URLs

## Resources

### Official Links
- [BNB Smart Chain Documentation](https://docs.bnbchain.org/)
- [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
- [BSC Testnet Explorer](https://testnet.bscscan.com/)
- [MetaMask Setup Guide](https://academy.binance.com/en/articles/connecting-metamask-to-binance-smart-chain)

### Developer Resources
- [BSC Testnet RPC Endpoints](https://docs.bnbchain.org/docs/rpc)
- [BEP20 Token Standard](https://github.com/bnb-chain/BEPs/blob/master/BEP20.md)
- [BSC Development Tools](https://docs.bnbchain.org/docs/dev-tools)

---

**Last Updated**: December 15, 2025  
**Network**: BNB Smart Chain Testnet  
**Platform**: MeritStack (TalentFind)