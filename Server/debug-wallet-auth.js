/**
 * Debug script to check wallet authentication flow
 * Run with: node debug-wallet-auth.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const TEST_WALLET = '0x0abc66eb813db6151908e5ebe80121f96fba735a';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function debugWalletAuth() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`🔍 Looking for wallet: ${TEST_WALLET}`);
    console.log(`🔍 Normalized: ${TEST_WALLET.toLowerCase()}\n`);

    // Try direct MongoDB query
    const collection = mongoose.connection.db.collection('users');
    const directResult = await collection.findOne({ 
      walletAddress: TEST_WALLET.toLowerCase() 
    });
    
    console.log('📊 Direct MongoDB query result:');
    if (directResult) {
      console.log('  ✅ User found!');
      console.log(`  Username: ${directResult.username}`);
      console.log(`  Email: ${directResult.email}`);
      console.log(`  Wallet: ${directResult.walletAddress}`);
      console.log(`  Role: ${directResult.role}`);
      console.log(`  Nonce: "${directResult.nonce || '(empty)'}"`);
      console.log(`  Created: ${directResult.createdAt || directResult.joinDate}`);
    } else {
      console.log('  ❌ User not found');
    }

    console.log('\n📊 Using User.findByWallet():');
    try {
      const user = await User.findByWallet(TEST_WALLET.toLowerCase());
      if (user) {
        console.log('  ✅ User found!');
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Wallet: ${user.walletAddress}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Nonce: "${user.nonce || '(empty)'}"`);
        console.log(`  Is Mongoose Document: ${user instanceof mongoose.Document}`);
      } else {
        console.log('  ❌ User not found');
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }

    console.log('\n📊 All users in database:');
    const allUsers = await collection.find({}).toArray();
    console.log(`  Total: ${allUsers.length}`);
    allUsers.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.username} - ${u.walletAddress}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

debugWalletAuth();
