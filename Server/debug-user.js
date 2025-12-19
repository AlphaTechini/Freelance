import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';

dotenv.config();

async function debugUser(walletOrEmail) {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Try to find user by wallet or email
    let user;
    if (walletOrEmail.startsWith('0x')) {
      console.log(`🔎 Searching for user by wallet: ${walletOrEmail}`);
      user = await User.findOne({ walletAddress: walletOrEmail.toLowerCase() });
    } else {
      console.log(`🔎 Searching for user by email: ${walletOrEmail}`);
      user = await User.findOne({ email: walletOrEmail.toLowerCase() });
    }

    if (user) {
      console.log('✅ User found:\n');
      console.log('ID:', user._id.toString());
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Wallet:', user.walletAddress);
      console.log('Role:', user.role);
      console.log('Display Name:', user.displayName);
      console.log('Nonce:', user.nonce || '(empty)');
      console.log('Created:', user.joinDate);
      console.log('\nFull user object:');
      console.log(JSON.stringify(user.toObject(), null, 2));
    } else {
      console.log('❌ User not found');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get wallet/email from command line
const identifier = process.argv[2];
if (!identifier) {
  console.log('Usage: node debug-user.js <wallet_address_or_email>');
  process.exit(1);
}

debugUser(identifier);
