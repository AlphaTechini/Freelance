import { Router } from 'fastify';
import CandidateProfile from '../models/CandidateProfile.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Search candidates
router.get('/candidates/search', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        skills: { type: 'string' },
        educationLevel: { type: 'string', enum: ['student', 'graduate', 'phd'] },
        minExperience: { type: 'number', minimum: 0 },
        availability: { type: 'string' },
        search: { type: 'string' },
        page: { type: 'number', minimum: 1, default: 1 },
        limit: { type: 'number', minimum: 1, maximum: 50, default: 20 }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { skills, educationLevel, minExperience, availability, search, page = 1, limit = 20 } = request.query;
    
    // Build query
    const query = { isPublished: true };
    
    if (educationLevel) {
      query.educationLevel = educationLevel;
    }
    
    if (minExperience !== undefined) {
      query.yearsOfExperience = { $gte: minExperience };
    }
    
    if (availability) {
      query.availability = availability;
    }
    
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillArray };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { major: { $regex: search, $options: 'i' } },
        { fieldOfStudy: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [candidates, total] = await Promise.all([
      CandidateProfile.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CandidateProfile.countDocuments(query)
    ]);

    // Get user data for each candidate
    const candidatesWithUserData = await Promise.all(
      candidates.map(async (candidate) => {
        const user = await User.findOne({
          $or: [
            { username: candidate.username },
            { walletAddress: candidate.walletAddress }
          ]
        }).select('displayName profileImage email').lean();
        
        return {
          ...candidate,
          name: candidate.name || user?.displayName,
          profileImage: user?.profileImage,
          email: user?.email
        };
      })
    );

    reply.send({
      success: true,
      candidates: candidatesWithUserData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Candidates search error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to search candidates'
    });
  }
});

// Get candidate by ID
router.get('/candidates/:id', async (request, reply) => {
  try {
    const candidate = await CandidateProfile.findById(request.params.id).lean();

    if (!candidate) {
      return reply.code(404).send({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Get user data
    const user = await User.findOne({
      $or: [
        { username: candidate.username },
        { walletAddress: candidate.walletAddress }
      ]
    }).select('displayName profileImage email').lean();

    const candidateWithUserData = {
      ...candidate,
      name: candidate.name || user?.displayName,
      profileImage: user?.profileImage,
      email: user?.email
    };

    reply.send({
      success: true,
      candidate: candidateWithUserData
    });

  } catch (error) {
    console.error('Candidate fetch error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch candidate'
    });
  }
});

// Get all candidates (for recruiters)
router.get('/candidates', {
  preHandler: [authenticateToken],
  schema: {
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'number', minimum: 1, default: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
        sortBy: { type: 'string', enum: ['createdAt', 'yearsOfExperience', 'name'], default: 'createdAt' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { user } = request;
    
    // Only allow recruiters to browse all candidates
    if (user.role !== 'recruiter' && user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        message: 'Access denied'
      });
    }

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = request.query;
    
    const query = { isPublished: true };
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [candidates, total] = await Promise.all([
      CandidateProfile.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      CandidateProfile.countDocuments(query)
    ]);

    // Get user data for each candidate
    const candidatesWithUserData = await Promise.all(
      candidates.map(async (candidate) => {
        const user = await User.findOne({
          $or: [
            { username: candidate.username },
            { walletAddress: candidate.walletAddress }
          ]
        }).select('displayName profileImage email').lean();
        
        return {
          ...candidate,
          name: candidate.name || user?.displayName,
          profileImage: user?.profileImage,
          email: user?.email
        };
      })
    );

    reply.send({
      success: true,
      candidates: candidatesWithUserData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Candidates fetch error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch candidates'
    });
  }
});

export default router;