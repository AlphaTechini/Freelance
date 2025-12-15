import { ethers } from 'ethers';
import crypto from 'crypto';
import userService from '../services/userService.js';
import User from '../models/User.js';

// Nonce expiration time (5 minutes)
const NONCE_EXPIRATION = 5 * 60 * 1000;

// Generate authentication message
const generateAuthMessage = (address, nonce) => {
  return `Welcome to MeritStack!\n\nPlease sign this message to authenticate your wallet.\n\nWallet Address: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
};

// Authentication routes
export default async function authRoutes(fastify, options) {
  
  // Request nonce for wallet authentication
  fastify.post('/auth/nonce', {
    schema: {
      body: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            nonce: { type: 'string' },
            expiresAt: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { walletAddress } = request.body;
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Generate random nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + NONCE_EXPIRATION;
    
    // Try to find existing user and update their nonce
    try {
      const user = await User.findByWallet(normalizedAddress);
      if (user) {
        user.nonce = nonce;
        await user.save();
      }
    } catch (error) {
      // User doesn't exist yet, that's okay for registration
      fastify.log.info('No existing user found for wallet, nonce will be stored during registration');
    }
    
    return { nonce, expiresAt };
  });

  // Verify wallet signature and issue JWT
  fastify.post('/auth/wallet-verify', {
    schema: {
      body: {
        type: 'object',
        required: ['walletAddress', 'signature', 'nonce'],
        properties: {
          walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          signature: { type: 'string' },
          nonce: { type: 'string' },
          jwtToken: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                walletAddress: { type: 'string' },
                firebaseUid: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { walletAddress, signature, nonce, jwtToken } = request.body;
    
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Verify signature
    try {
      const message = generateAuthMessage(walletAddress, nonce);
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        return reply.code(401).send({ error: 'Signature verification failed' });
      }
      
      // Get or create user
      let user;
      try {
        user = await userService.getUserByWallet(normalizedAddress);
        
        // Verify nonce matches if user exists
        if (user && user.nonce !== nonce) {
          return reply.code(401).send({ error: 'Invalid nonce' });
        }
        
        // Clear nonce after successful verification
        if (user) {
          user.nonce = '';
          await user.save();
        }
      } catch (error) {
        // User doesn't exist, this is handled in registration
        user = null;
      }
      
      // Create JWT payload
      const payload = {
        walletAddress: normalizedAddress,
        userId: user?._id?.toString() || null,
        username: user?.username || null,
        role: user?.role || null,
        email: user?.email || null
      };
      
      // Sign JWT token
      const token = fastify.jwt.sign(payload, {
        expiresIn: '7d'
      });
      
      return {
        token,
        user: user ? {
          id: user._id,
          username: user.username,
          walletAddress: user.walletAddress,
          email: user.email,
          displayName: user.displayName,
          profileImage: user.profileImage,
          role: user.role
        } : null,
        isNewUser: !user
      };
      
    } catch (error) {
      fastify.log.error('Signature verification error:', error);
      return reply.code(401).send({ error: 'Signature verification failed' });
    }
  });

  // Refresh JWT token
  fastify.post('/auth/refresh', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { walletAddress, userId, username, role, email } = request.user;
    
    // Issue new token
    const token = fastify.jwt.sign(
      { walletAddress, userId, username, role, email },
      { expiresIn: '7d' }
    );
    
    return { token };
  });

  // Get current user profile
  fastify.get('/auth/profile', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      if (!request.user.userId) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_REGISTERED',
            message: 'User profile not found. Please complete registration.'
          }
        });
      }
      
      const user = await userService.getUserById(request.user.userId);
      
      return {
        success: true,
        user
      };
    } catch (error) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: error.message
        }
      });
    }
  });

  // Check username availability
  fastify.post('/auth/check-username', {
    schema: {
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 30 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            available: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { username } = request.body;
    
    // Validate username format
    const usernameRegex = /^[a-z0-9_-]+$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'INVALID_USERNAME',
          message: 'Username can only contain lowercase letters, numbers, hyphens, and underscores'
        }
      });
    }
    
    const available = await User.isUsernameAvailable(username);
    return { available };
  });

  // Register user with wallet (after wallet verification)
  fastify.post('/auth/register', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'displayName', 'role'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 30 },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string', minLength: 2, maxLength: 50 },
          role: { 
            type: 'string', 
            enum: ['freelancer', 'recruiter', 'student', 'graduate', 'phd'] 
          },
          firebaseUid: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { username, email, displayName, role, firebaseUid } = request.body;
      const { walletAddress } = request.user;
      
      // Validate username format
      const usernameRegex = /^[a-z0-9_-]+$/;
      if (!usernameRegex.test(username.toLowerCase())) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_USERNAME',
            message: 'Username can only contain lowercase letters, numbers, hyphens, and underscores'
          }
        });
      }
      
      // Check username availability
      const isAvailable = await User.isUsernameAvailable(username);
      if (!isAvailable) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'USERNAME_TAKEN',
            message: 'This username is already taken'
          }
        });
      }
      
      // Create user profile
      const userData = {
        username,
        walletAddress,
        email,
        displayName,
        role
      };
      
      const user = await userService.createUser(userData);
      
      // Update JWT with userId, username, and role
      const token = fastify.jwt.sign(
        { 
          walletAddress, 
          userId: user._id.toString(),
          username: user.username,
          role: user.role,
          email: user.email
        },
        { expiresIn: '7d' }
      );
      
      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      fastify.log.error('Registration error:', error);
      return reply.code(400).send({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message
        }
      });
    }
  });
  
  // Register user with email/password (MongoDB only)
  fastify.post('/auth/register-email', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'password', 'displayName', 'role'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 30 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          displayName: { type: 'string', minLength: 2, maxLength: 50 },
          role: { 
            type: 'string', 
            enum: ['freelancer', 'recruiter', 'student', 'graduate', 'phd'] 
          },
          walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { type: 'object' },
            token: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { username, email, password, displayName, role, walletAddress } = request.body;
      
      // Validate username format
      const usernameRegex = /^[a-z0-9_-]+$/;
      if (!usernameRegex.test(username.toLowerCase())) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_USERNAME',
            message: 'Username can only contain lowercase letters, numbers, hyphens, and underscores'
          }
        });
      }
      
      // Check username availability
      const isAvailable = await User.isUsernameAvailable(username);
      if (!isAvailable) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'USERNAME_TAKEN',
            message: 'This username is already taken'
          }
        });
      }
      
      // Check email availability
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'EMAIL_TAKEN',
            message: 'This email is already registered'
          }
        });
      }
      
      // Create user profile
      const userData = {
        username,
        email: email.toLowerCase(),
        password, // Will be hashed in the User model
        walletAddress: walletAddress?.toLowerCase(),
        displayName,
        role
      };
      
      const user = await userService.createUser(userData);
      
      // Create JWT token
      const token = fastify.jwt.sign(
        { 
          walletAddress: user.walletAddress, 
          userId: user._id.toString(),
          username: user.username,
          role: user.role,
          email: user.email
        },
        { expiresIn: '7d' }
      );
      
      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      fastify.log.error('Email registration error:', error);
      return reply.code(400).send({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message
        }
      });
    }
  });

  // Login with email/password (MongoDB only)
  fastify.post('/auth/login-email', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { type: 'object' },
            token: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;
      
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }
      
      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }
      
      // Create JWT token
      const token = fastify.jwt.sign(
        { 
          walletAddress: user.walletAddress, 
          userId: user._id.toString(),
          username: user.username,
          role: user.role,
          email: user.email
        },
        { expiresIn: '7d' }
      );
      
      return {
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          profileImage: user.profileImage,
          role: user.role,
          walletAddress: user.walletAddress
        },
        token
      };
    } catch (error) {
      fastify.log.error('Email login error:', error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed. Please try again.'
        }
      });
    }
  });

  // Logout (client-side token removal, but we can blacklist if needed)
  fastify.post('/auth/logout', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    // In a production app, you might want to blacklist the token
    return { message: 'Logged out successfully' };
  });
}