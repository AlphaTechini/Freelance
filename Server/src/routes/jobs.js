import { Router } from 'fastify';
import JobPosting from '../models/JobPosting.js';
import jobMatchingService from '../services/jobMatchingService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Job posting validation schema
const jobPostingSchema = {
  type: 'object',
  required: ['title', 'description', 'roleType'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', minLength: 10, maxLength: 5000 },
    requiredSkills: { 
      type: 'array', 
      items: { type: 'string' },
      maxItems: 20
    },
    minExperience: { type: 'number', minimum: 0, maximum: 50 },
    educationPreference: { 
      type: 'string', 
      enum: ['Any', 'Student', 'Graduate', 'PhD'] 
    },
    roleType: { 
      type: 'string', 
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'] 
    },
    budget: {
      type: 'object',
      properties: {
        min: { type: 'number', minimum: 0 },
        max: { type: 'number', minimum: 0 },
        currency: { type: 'string', enum: ['USD', 'ETH', 'USDC', 'KIRO'] }
      }
    },
    location: { 
      type: 'string', 
      enum: ['Remote', 'On-site', 'Hybrid'] 
    },
    maxCandidates: { type: 'number', minimum: 1, maximum: 50 },
    applicationDeadline: { type: 'string', format: 'date-time' },
    tags: { 
      type: 'array', 
      items: { type: 'string' },
      maxItems: 10
    }
  }
};

// Create new job posting
router.post('/jobs', {
  preHandler: [authenticateToken],
  schema: {
    body: jobPostingSchema,
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          job: { type: 'object' },
          message: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { user } = request;
    
    // Verify user is a recruiter
    if (user.role !== 'recruiter') {
      return reply.code(403).send({
        success: false,
        message: 'Only recruiters can create job postings'
      });
    }

    // Create job posting
    const jobData = {
      ...request.body,
      recruiterId: user.id
    };

    const job = new JobPosting(jobData);
    await job.save();

    // Generate initial shortlist if requested
    if (request.body.generateShortlist !== false) {
      try {
        const shortlist = await jobMatchingService.generateShortlist(job, job.maxCandidates);
        
        // Add candidates to job shortlist
        for (const candidate of shortlist) {
          await job.addToShortlist({
            candidateId: candidate._id,
            matchScore: candidate.matchScore,
            matchDetails: candidate.matchDetails,
            matchExplanation: candidate.matchExplanation
          });
        }
      } catch (error) {
        console.error('Shortlist generation failed:', error);
        // Continue without shortlist - job is still created
      }
    }

    reply.code(201).send({
      success: true,
      job: job.toObject(),
      message: 'Job posting created successfully'
    });

  } catch (error) {
    console.error('Job creation error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to create job posting'
    });
  }
});

// Get all jobs (with filters)
router.get('/jobs', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['draft', 'active', 'paused', 'closed', 'filled'] },
        roleType: { type: 'string' },
        skills: { type: 'string' }, // Comma-separated
        location: { type: 'string' },
        page: { type: 'number', minimum: 1, default: 1 },
        limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { status, roleType, skills, location, page = 1, limit = 10 } = request.query;
    
    // Build query
    const query = {};
    
    if (status) query.status = status;
    else query.status = 'active'; // Default to active jobs
    
    if (roleType) query.roleType = roleType;
    if (location) query.location = location;
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      query.requiredSkills = { $in: skillArray };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      JobPosting.find(query)
        .populate('recruiter', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      JobPosting.countDocuments(query)
    ]);

    reply.send({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Jobs fetch error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch jobs'
    });
  }
});

// Get job by ID
router.get('/jobs/:id', async (request, reply) => {
  try {
    const job = await JobPosting.findById(request.params.id)
      .populate('recruiter', 'name email')
      .populate('shortlist.candidateId', 'name skills experienceYears educationLevel portfolioUrl githubUrl');

    if (!job) {
      return reply.code(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count
    await job.incrementViews();

    reply.send({
      success: true,
      job: job.toObject()
    });

  } catch (error) {
    console.error('Job fetch error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch job'
    });
  }
});

// Get candidates for a job (shortlist)
router.get('/jobs/:id/candidates', {
  preHandler: [authenticateToken]
}, async (request, reply) => {
  try {
    const { user } = request;
    const job = await JobPosting.findById(request.params.id)
      .populate({
        path: 'shortlist.candidateId',
        select: 'name email skills experienceYears educationLevel portfolioUrl githubUrl profileImage major fieldOfStudy availability'
      });

    if (!job) {
      return reply.code(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    // Verify ownership
    if (job.recruiterId.toString() !== user.id && user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        message: 'Access denied'
      });
    }

    // Format candidates with match data
    const candidates = job.shortlist.map(item => ({
      ...item.candidateId.toObject(),
      matchScore: item.matchScore,
      matchDetails: item.matchDetails,
      matchExplanation: item.matchExplanation,
      status: item.status,
      notes: item.notes,
      addedAt: item.addedAt,
      jobId: job._id // Add job ID for frontend use
    }));

    reply.send({
      success: true,
      candidates: candidates
    });

  } catch (error) {
    console.error('Candidates fetch error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch candidates'
    });
  }
});

// Hire a candidate (Requirements 5.1, 5.2, 5.3)
router.post('/jobs/:id/hire', {
  preHandler: [authenticateToken],
  schema: {
    body: {
      type: 'object',
      required: ['candidateId'],
      properties: {
        candidateId: { type: 'string' },
        notes: { type: 'string', maxLength: 1000 },
        sendEmail: { type: 'boolean', default: true }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { user } = request;
    const { candidateId, notes, sendEmail = true } = request.body;
    const job = await JobPosting.findById(request.params.id)
      .populate('recruiterId', 'displayName name email');

    if (!job) {
      return reply.code(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    // Verify ownership
    if (job.recruiterId._id.toString() !== user.id && user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        message: 'Access denied'
      });
    }

    // Update candidate status to hired
    await job.updateCandidateStatus(candidateId, 'hired', notes);

    // Get candidate details for email
    const CandidateProfile = (await import('../models/CandidateProfile.js')).default;
    const User = (await import('../models/User.js')).default;
    
    const candidate = await CandidateProfile.findById(candidateId);
    let candidateUser = null;
    
    if (candidate) {
      candidateUser = await User.findOne({ 
        $or: [
          { username: candidate.username },
          { walletAddress: candidate.walletAddress }
        ]
      });
    }

    // Send automated hiring notification email (Requirements 5.3)
    let emailSent = false;
    if (sendEmail && candidate && candidateUser && candidateUser.email) {
      try {
        const emailService = (await import('../services/emailService.js')).default;
        await emailService.sendHiringNotification(
          {
            name: candidate.name || candidateUser.displayName,
            email: candidateUser.email
          },
          job,
          job.recruiterId
        );
        emailSent = true;
        console.log(`Hiring notification sent to ${candidateUser.email}`);
      } catch (emailError) {
        console.error('Failed to send hiring notification:', emailError);
        // Don't fail the hiring process if email fails
      }
    }

    reply.send({
      success: true,
      message: 'Candidate hired successfully',
      emailSent
    });

  } catch (error) {
    console.error('Hire candidate error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to hire candidate'
    });
  }
});

// Generate mailto link for candidate (Requirements 5.4, 5.5)
router.get('/jobs/:id/candidates/:candidateId/mailto', {
  preHandler: [authenticateToken]
}, async (request, reply) => {
  try {
    const { user } = request;
    const job = await JobPosting.findById(request.params.id);

    if (!job) {
      return reply.code(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    // Verify ownership
    if (job.recruiterId.toString() !== user.id && user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        message: 'Access denied'
      });
    }

    // Get candidate details
    const CandidateProfile = (await import('../models/CandidateProfile.js')).default;
    const User = (await import('../models/User.js')).default;
    
    const candidate = await CandidateProfile.findById(request.params.candidateId);
    if (!candidate) {
      return reply.code(404).send({
        success: false,
        message: 'Candidate not found'
      });
    }

    const candidateUser = await User.findOne({ 
      $or: [
        { username: candidate.username },
        { walletAddress: candidate.walletAddress }
      ]
    });

    if (!candidateUser || !candidateUser.email) {
      return reply.code(404).send({
        success: false,
        message: 'Candidate email not found'
      });
    }

    // Generate mailto link
    const emailService = (await import('../services/emailService.js')).default;
    const mailtoLink = emailService.generateMailtoLink(
      {
        name: candidate.name || candidateUser.displayName,
        email: candidateUser.email
      },
      job
    );

    reply.send({
      success: true,
      mailtoLink,
      candidateEmail: candidateUser.email
    });

  } catch (error) {
    console.error('Mailto generation error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to generate mailto link'
    });
  }
});

// Generate shortlist for job
router.post('/jobs/:id/generate-shortlist', {
  preHandler: [authenticateToken]
}, async (request, reply) => {
  try {
    const { user } = request;
    const job = await JobPosting.findById(request.params.id);

    if (!job) {
      return reply.code(404).send({
        success: false,
        message: 'Job not found'
      });
    }

    // Verify ownership
    if (job.recruiterId.toString() !== user.id && user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate new shortlist
    const shortlistResult = await jobMatchingService.createShortlist(request.params.id, {
      maxCandidates: job.maxCandidates,
      regenerate: true
    });

    // Format candidates with match data
    const candidates = shortlistResult.shortlist.map(item => ({
      ...item.candidateId,
      matchScore: item.matchScore,
      matchDetails: item.matchDetails,
      matchExplanation: item.matchExplanation,
      status: item.status || 'shortlisted',
      addedAt: item.addedAt
    }));

    reply.send({
      success: true,
      candidates: candidates,
      analytics: {
        totalCandidates: shortlistResult.totalCandidates,
        averageMatchScore: shortlistResult.averageMatchScore,
        topMatchScore: shortlistResult.topMatchScore,
        generatedAt: shortlistResult.generatedAt
      }
    });

  } catch (error) {
    console.error('Shortlist generation error:', error);
    reply.code(500).send({
      success: false,
      message: `Failed to generate shortlist: ${error.message}`
    });
  }
});

export default router;