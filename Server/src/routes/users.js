import userService from '../services/userService.js';
import { validateSearchQuery } from '../utils/userValidation.js';

export default async function userRoutes(fastify, options) {
  // Get user by ID
  fastify.get('/users/:userId', {
    schema: {
      description: 'Get user profile by ID',
      tags: ['users'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
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
    },
    handler: async (request, reply) => {
      try {
        const { userId } = request.params;
        
        const user = await userService.getUserById(userId);
        
        return reply.code(200).send({
          success: true,
          user
        });
      } catch (error) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: error.message
          }
        });
      }
    }
  });

  // Get current user profile (requires authentication)
  fastify.get('/users/profile', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Get current user profile',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { type: 'object' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        
        const user = await userService.getUserById(userId);
        
        return reply.code(200).send({
          success: true,
          user
        });
      } catch (error) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: error.message
          }
        });
      }
    }
  });

  // Update user profile (requires authentication)
  fastify.put('/users/profile', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Update current user profile',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          displayName: { type: 'string', minLength: 2, maxLength: 50 },
          bio: { type: 'string', maxLength: 500 },
          skills: { 
            type: 'array', 
            items: { type: 'string' },
            maxItems: 20
          },
          profileImage: { type: 'string' },
          preferences: {
            type: 'object',
            properties: {
              preferredTokens: {
                type: 'array',
                items: { type: 'string', enum: ['USDT', 'ETH', 'BTC'] }
              },
              notifications: { type: 'boolean' },
              emailNotifications: { type: 'boolean' }
            }
          }
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
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        const updateData = request.body;
        
        const user = await userService.updateUser(userId, updateData);
        
        return reply.code(200).send({
          success: true,
          user
        });
      } catch (error) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Upload profile image (requires authentication)
  fastify.post('/users/upload-image', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Upload profile image',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            imageUrl: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const data = await request.file();
        
        if (!data) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'NO_FILE',
              message: 'No file uploaded'
            }
          });
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(data.mimetype)) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_FILE_TYPE',
              message: 'Only image files are allowed (JPEG, PNG, GIF, WebP)'
            }
          });
        }
        
        // Validate file size (5MB max)
        const buffer = await data.toBuffer();
        if (buffer.length > 5 * 1024 * 1024) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'File size must be less than 5MB'
            }
          });
        }
        
        // Upload to Cloudinary
        const cloudinaryService = (await import('../services/cloudinary.js')).default;
        const imageUrl = await cloudinaryService.uploadProfileImage(request.user.userId, buffer);
        
        // Update user profile with new image URL
        await userService.updateUser(request.user.userId, { profileImage: imageUrl });
        
        return reply.code(200).send({
          success: true,
          imageUrl
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Search users
  fastify.get('/users/search', {
    schema: {
      description: 'Search users',
      tags: ['users'],
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          skip: { type: 'integer', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['rating', 'totalOrders', 'joinDate', 'displayName'], default: 'rating' },
          sortOrder: { type: 'integer', enum: [1, -1], default: -1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            users: { type: 'array' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { q, limit, skip, sortBy, sortOrder } = request.query;
        
        // Validate query parameters
        const validation = validateSearchQuery(request.query);
        if (!validation.isValid) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_QUERY',
              message: validation.errors.join(', ')
            }
          });
        }
        
        const options = {
          limit: parseInt(limit) || 20,
          skip: parseInt(skip) || 0,
          sortBy: sortBy || 'rating',
          sortOrder: parseInt(sortOrder) || -1
        };
        
        const users = await userService.searchUsers(q, options);
        
        return reply.code(200).send({
          success: true,
          users
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SEARCH_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Get all users with pagination
  fastify.get('/users', {
    schema: {
      description: 'Get all users with pagination',
      tags: ['users'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          skip: { type: 'integer', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['rating', 'totalOrders', 'joinDate', 'displayName'], default: 'joinDate' },
          sortOrder: { type: 'integer', enum: [1, -1], default: -1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            users: { type: 'array' },
            pagination: { type: 'object' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { limit, skip, sortBy, sortOrder } = request.query;
        
        const options = {
          limit: parseInt(limit) || 20,
          skip: parseInt(skip) || 0,
          sortBy: sortBy || 'joinDate',
          sortOrder: parseInt(sortOrder) || -1
        };
        
        const result = await userService.getAllUsers(options);
        
        return reply.code(200).send({
          success: true,
          users: result.users,
          pagination: result.pagination
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Delete user account (soft delete - requires authentication)
  fastify.delete('/users/profile', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Delete current user account (soft delete)',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        
        const result = await userService.deleteUser(userId);
        
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Create candidate profile (requires authentication)
  fastify.post('/users/candidate-profile', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Create candidate profile',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          bio: { type: 'string', maxLength: 1000 },
          major: { type: 'string' },
          fieldOfStudy: { type: 'string' },
          educationLevel: { 
            type: 'string', 
            enum: ['student', 'graduate', 'phd', ''] 
          },
          university: { type: 'string' },
          skills: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          yearsOfExperience: { type: 'number', minimum: 0 },
          portfolioUrl: { type: 'string' },
          githubUrl: { type: 'string' },
          availability: { 
            type: 'string', 
            enum: ['Full-time', 'Part-time', 'Contract', '6 Months', '3 Months', 'Months', ''] 
          },
          workHistory: {
            type: 'array',
            items: {
              type: 'object',
              required: ['company', 'position', 'duration'],
              properties: {
                company: { type: 'string' },
                position: { type: 'string' },
                duration: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          isPublished: { type: 'boolean' }
        }
      }
      // Remove response schema to allow full profile object to be returned
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        const username = request.user.username;
        const walletAddress = request.user.walletAddress;
        
        // Import CandidateProfile model
        const CandidateProfile = (await import('../models/CandidateProfile.js')).default;
        
        // Check if profile already exists
        const existingProfile = await CandidateProfile.findByUserId(userId);
        if (existingProfile) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'PROFILE_EXISTS',
              message: 'Candidate profile already exists'
            }
          });
        }
        
        // Create profile
        const profile = new CandidateProfile({
          userId,
          username,
          walletAddress,
          ...request.body
        });
        
        await profile.save();
        
        // Convert to plain object to ensure all fields are serialized
        const profileData = profile.toObject();
        
        console.log('Candidate profile created:', {
          profileId: profileData._id,
          portfolioUrl: profileData.portfolioUrl,
          githubUrl: profileData.githubUrl
        });
        
        return reply.code(200).send({
          success: true,
          profile: profileData
        });
      } catch (error) {
        console.error('Candidate profile creation error:', error);
        return reply.code(400).send({
          success: false,
          error: {
            code: 'PROFILE_CREATION_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Create recruiter profile (requires authentication)
  fastify.post('/users/recruiter-profile', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Create recruiter profile',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          position: { type: 'string' },
          bio: { type: 'string', maxLength: 1000 },
          industry: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            profile: { type: 'object' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        const username = request.user.username;
        const walletAddress = request.user.walletAddress;
        
        // Import RecruiterProfile model
        const RecruiterProfile = (await import('../models/RecruiterProfile.js')).default;
        
        // Check if profile already exists
        const existingProfile = await RecruiterProfile.findByUserId(userId);
        if (existingProfile) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'PROFILE_EXISTS',
              message: 'Recruiter profile already exists'
            }
          });
        }
        
        // Create profile
        const profile = new RecruiterProfile({
          userId,
          username,
          walletAddress,
          ...request.body
        });
        
        await profile.save();
        
        return reply.code(200).send({
          success: true,
          profile
        });
      } catch (error) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'PROFILE_CREATION_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Get candidate profile (requires authentication)
  fastify.get('/users/candidate-profile', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Get current user candidate profile',
      tags: ['users'],
      security: [{ bearerAuth: [] }]
      // Remove response schema to allow full profile object to be returned
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        
        // Import CandidateProfile model
        const CandidateProfile = (await import('../models/CandidateProfile.js')).default;
        
        const profile = await CandidateProfile.findByUserId(userId).populate('userId', 'displayName email profileImage rating');
        
        if (!profile) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: 'Candidate profile not found'
            }
          });
        }
        
        // Convert to plain object to ensure all fields are serialized
        const profileData = profile.toObject();
        
        console.log('Candidate profile fetched:', {
          profileId: profileData._id,
          portfolioUrl: profileData.portfolioUrl,
          githubUrl: profileData.githubUrl,
          bio: profileData.bio?.substring(0, 50),
          skills: profileData.skills?.length,
          major: profileData.major,
          university: profileData.university
        });
        
        return reply.code(200).send({
          success: true,
          profile: profileData
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Update candidate profile (requires authentication)
  fastify.put('/users/candidate-profile', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Update current user candidate profile',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          bio: { type: 'string', maxLength: 1000 },
          major: { type: 'string' },
          fieldOfStudy: { type: 'string' },
          educationLevel: { 
            type: 'string', 
            enum: ['student', 'graduate', 'phd', ''] 
          },
          university: { type: 'string' },
          skills: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          yearsOfExperience: { type: 'number', minimum: 0 },
          portfolioUrl: { type: 'string' },
          githubUrl: { type: 'string' },
          availability: { 
            type: 'string', 
            enum: ['Full-time', 'Part-time', 'Contract', '6 Months', '3 Months', 'Months', ''] 
          },
          workHistory: {
            type: 'array',
            items: {
              type: 'object',
              required: ['company', 'position', 'duration'],
              properties: {
                company: { type: 'string' },
                position: { type: 'string' },
                duration: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          isPublished: { type: 'boolean' }
        }
      }
      // Remove response schema to allow full profile object to be returned
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        
        // Import CandidateProfile model
        const CandidateProfile = (await import('../models/CandidateProfile.js')).default;
        
        // Prepare update data - remove empty strings for optional fields
        const updateData = { ...request.body };
        
        console.log('Candidate profile update request:', {
          userId,
          portfolioUrl: updateData.portfolioUrl,
          githubUrl: updateData.githubUrl,
          skills: updateData.skills?.length,
          bio: updateData.bio?.substring(0, 50)
        });
        
        // Don't update educationLevel if it's empty (keep existing value)
        if (updateData.educationLevel === '') {
          delete updateData.educationLevel;
        }
        
        const profile = await CandidateProfile.findOneAndUpdate(
          { userId },
          { $set: updateData },
          { new: true, runValidators: true }
        ).populate('userId', 'displayName email profileImage rating');
        
        if (!profile) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: 'Candidate profile not found'
            }
          });
        }
        
        // Convert to plain object to ensure all fields are serialized
        const profileData = profile.toObject();
        
        console.log('Candidate profile updated:', {
          profileId: profileData._id,
          portfolioUrl: profileData.portfolioUrl,
          githubUrl: profileData.githubUrl,
          major: profileData.major,
          university: profileData.university
        });
        
        return reply.code(200).send({
          success: true,
          profile: profileData
        });
      } catch (error) {
        console.error('Candidate profile update error:', error);
        return reply.code(400).send({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Get recruiter profile (requires authentication)
  fastify.get('/users/recruiter-profile', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Get current user recruiter profile',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            profile: { type: 'object' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        
        // Import RecruiterProfile model
        const RecruiterProfile = (await import('../models/RecruiterProfile.js')).default;
        
        const profile = await RecruiterProfile.findByUserId(userId).populate('userId', 'displayName email profileImage rating');
        
        if (!profile) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: 'Recruiter profile not found'
            }
          });
        }
        
        return reply.code(200).send({
          success: true,
          profile
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message
          }
        });
      }
    }
  });

  // Update recruiter profile (requires authentication)
  fastify.put('/users/recruiter-profile', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Update current user recruiter profile',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          position: { type: 'string' },
          bio: { type: 'string', maxLength: 1000 },
          industry: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            profile: { type: 'object' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        
        // Import RecruiterProfile model
        const RecruiterProfile = (await import('../models/RecruiterProfile.js')).default;
        
        const profile = await RecruiterProfile.findOneAndUpdate(
          { userId },
          { $set: request.body },
          { new: true, runValidators: true }
        ).populate('userId', 'displayName email profileImage rating');
        
        if (!profile) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: 'Recruiter profile not found'
            }
          });
        }
        
        return reply.code(200).send({
          success: true,
          profile
        });
      } catch (error) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: error.message
          }
        });
      }
    }
  });
}