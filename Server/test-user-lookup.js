/**
 * Test user lookup to verify database queries work
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const TEST_WALLET = '0x0abc66eb813db6151908e5ebe80121f96fba735a';

async function testUserLookup() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`📍 URI: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Direct collection query
    console.log('Test 1: Direct collection query');
    const collection = mongoose.connection.db.collection('users');
    const directResult = await collection.findOne({ 
      walletAddress: TEST_WALLET.toLowerCase() 
    });
    console.log(directResult ? `✅ Found: ${directResult.username}` : '❌ Not found');

    // Test 2: Using User model
    console.log('\nTest 2: Using User.findByWallet()');
    const modelResult = await User.findByWallet(TEST_WALLET.toLowerCase());
    console.log(modelResult ? `✅ Found: ${modelResult.username}` : '❌ Not found');

    // Test 3: List all users
    console.log('\nTest 3: All users in database');
    const allUsers = await collection.find({}).toArray();
    console.log(`Total: ${allUsers.length}`);
    allUsers.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.username} - ${u.walletAddress}`);
    });

    console.log('\n✅ All tests completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('IP')) {
      console.log('\n💡 Solution: Add your IP to MongoDB Atlas whitelist');
      console.log('   1. Go to MongoDB Atlas dashboard');
      console.log('   2. Click "Network Access"');
      console.log('   3. Click "Add IP Address"');
      console.log('   4. Add your current IP or use 0.0.0.0/0 for development');
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testUserLookup();
