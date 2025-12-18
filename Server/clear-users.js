/**
 * One-time script to clear all user data from the database
 * Run with: node clear-users.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function clearUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Found collections:', collections.map(c => c.name).join(', '));

    // Collections to clear (user-related data)
    const userCollections = ['users', 'candidateprofiles', 'recruiterprofiles', 'payments', 'transactions'];
    
    let totalDeleted = 0;

    for (const collectionName of userCollections) {
      const exists = collections.some(c => c.name === collectionName);
      if (exists) {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`🗑️  Cleared ${result.deletedCount} documents from '${collectionName}'`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`📭 Collection '${collectionName}' is already empty`);
        }
      } else {
        console.log(`⏭️  Collection '${collectionName}' does not exist, skipping`);
      }
    }

    console.log(`\n✅ Done! Total documents deleted: ${totalDeleted}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

clearUsers();
