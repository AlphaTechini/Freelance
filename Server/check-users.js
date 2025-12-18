/**
 * Quick script to check all users in the database
 * Run with: node check-users.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function checkUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const collection = mongoose.connection.db.collection('users');
    const count = await collection.countDocuments();
    
    console.log(`\n📊 Total users in database: ${count}`);
    
    if (count > 0) {
      const users = await collection.find({}).toArray();
      console.log('\n👥 Users found:');
      users.forEach((user, i) => {
        console.log(`\n--- User ${i + 1} ---`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Wallet: ${user.walletAddress}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Created: ${user.createdAt || user.joinDate}`);
      });
    } else {
      console.log('\n✅ Database is empty - no users found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

checkUsers();
