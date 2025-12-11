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

// Get jobs by recruiter
router.get('/jobs/recruiter/:recruiterId', {
  preHandler: [authenticateToken]
}, async (request, reply) => {
  try {
    const { recruiterId } = request.params;
    const { user } = request;

    // Verify access (recruiter can only see their own jobs, or admin)
    if (user.id !== recruiterId && user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        message: 'Access denied'
      });
    }

    const jobs = await JobPosting.findByRecruiter(recruiterId)
      .populate('shortlist.candidateId', 'name skills experienceYears educationLevel');

    reply.send({
      success: true,
      jobs
    });

  } catch (error) {
    console.error('Recruiter jobs fetch error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch recruiter jobs'
    });
  }
});

// Update job posting
router.put('/jobs/:id', {
  preHandler: [authenticateToken],
  schema: {
    body: jobPostingSchema
  }
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

    // Update job
    Object.assign(job, request.body);
    await job.save();

    // Regenerate shortlist if requirements changed
    if (request.body.requiredSkills || request.body.minExperience || request.body.educationPreference) {
      try {
        const newShortlist = await jobMatchingService.generateShortlist(job, job.maxCandidates);
        
        // Clear existing shortlist and add new candidates
        job.shortlist = [];
        for (const candidate of newShortlist) {
          await job.addToShortlist({
            candidateId: candidate._id,
            matchScore: candidate.matchScore,
            matchDetails: candidate.matchDetails,
            matchExplanation: candidate.matchExplanation
          });
        }
      } catch (error) {
        console.error('Shortlist regeneration failed:', error);
      }
    }

    reply.send({
      success: true,
      job: job.toObject(),
      message: 'Job updated successfully'
    });

  } catch (error) {
    console.error('Job update error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to update job'
    });
  }
});

// Delete job posting
router.delete('/jobs/:id', {
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

    await JobPosting.findByIdAndDelete(request.params.id);

    reply.send({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Job deletion error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to delete job'
    });
  }
});

// Generate/regenerate shortlist for job using new AI matching engine
router.post('/jobs/:id/shortlist', {
  preHandler: [authenticateToken],
  schema: {
    body: {
      type: 'object',
      properties: {
        maxCandidates: { type: 'number', minimum: 1, maximum: 50 },
        regenerate: { type: 'boolean', default: false }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { user } = request;
    const { maxCandidates, regenerate = false } = request.body || {};
    
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

    // Use the new shortlist generation service (Requirements 4.1, 4.3)
    const shortlistResult = await jobMatchingService.createShortlist(request.params.id, {
      maxCandidates: maxCandidates || job.maxCandidates,
      regenerate
    });

    reply.send({
      success: true,
      shortlist: shortlistResult.shortlist,
      analytics: {
        totalCandidates: shortlistResult.totalCandidates,
        averageMatchScore: shortlistResult.averageMatchScore,
        topMatchScore: shortlistResult.topMatchScore,
        generatedAt: shortlistResult.generatedAt
      },
      message: 'Shortlist generated successfully using AI matching engine'
    });

  } catch (error) {
    console.error('Shortlist generation error:', error);
    reply.code(500).send({
      success: false,
      message: `Failed to generate shortlist: ${error.message}`
    });
  }
});

// Update candidate status in shortlist
router.put('/jobs/:id/shortlist/:candidateId', {
  preHandler: [authenticateToken],
  schema: {
    body: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { 
          type: 'string', 
          enum: ['shortlisted', 'contacted', 'interviewed', 'hired', 'rejected'] 
        },
        notes: { type: 'string', maxLength: 1000 }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { user } = request;
    const { status, notes } = request.body;
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

    await job.updateCandidateStatus(request.params.candidateId, status, notes);

    reply.send({
      success: true,
      message: 'Candidate status updated successfully'
    });

  } catch (error) {
    console.error('Candidate status update error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to update candidate status'
    });
  }
});

// Get match explanation for specific candidate (Requirements 4.5)
router.get('/jobs/:id/candidates/:candidateId/match-explanation', {
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

    // Find candidate in shortlist
    const candidateInShortlist = job.shortlist.find(
      item => item.candidateId.toString() === request.params.candidateId
    );

    if (!candidateInShortlist) {
      return reply.code(404).send({
        success: false,
        message: 'Candidate not found in shortlist'
      });
    }

    // Get full candidate profile
    const CandidateProfile = (await import('../models/CandidateProfile.js')).default;
    const candidate = await CandidateProfile.findById(request.params.candidateId);

    if (!candidate) {
      return reply.code(404).send({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    // Generate detailed match explanation
    const explanation = await jobMatchingService.buildMatchExplanation(
      candidate,
      job,
      candidateInShortlist.matchDetails || { overallScore: candidateInShortlist.matchScore }
    );

    reply.send({
      success: true,
      explanation,
      matchScore: candidateInShortlist.matchScore,
      matchDetails: candidateInShortlist.matchDetails
    });

  } catch (error) {
    console.error('Match explanation error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to generate match explanation'
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
      addedAt: item.addedAt
    }));

    reply.send({
      success: true,
      data: candidates
    });

  } catch (error) {
    console.error('Candidates fetch error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to fetch candidates'
    });
  }
});

// Generate shortlist (alternative endpoint for frontend)
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
      data: candidates,
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

// Hire a candidate
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

    // Send automated hiring notification email
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
        console.log(`Hiring notification sent to ${candidateUser.email}`);
      } catch (emailError) {
        console.error('Failed to send hiring notification:', emailError);
        // Don't fail the hiring process if email fails
      }
    }

    reply.send({
      success: true,
      message: 'Candidate hired successfully',
      emailSent: sendEmail && candidateUser && candidateUser.email ? true : false
    });

  } catch (error) {
    console.error('Hire candidate error:', error);
    reply.code(500).send({
      success: false,
      message: 'Failed to hire candidate'
    });
  }
});

// Generate mailto link for candidate
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
    const CandidateProfault;
    const User = (await;
    
    const candidate
    if (!candidate) {
      return reply.code(404).send({
        success: false,
        message: 'Candidate not found'
      });
    }

    co

        { userna,
        { walletAddr}
      ]
    });

    if (!candidateU
      return reply.code(404).send({
        success: false,
        message: 'Cand'
      });
    }

   lto link

    const mailtoLink =});
;
  } })   ics'
yt job analto fetchFailed age: '
      messe, fals    success:{
  send(500).ode( reply.cerror);
   r:', rroytics e analror('Jobsole.er
    con (error) {} catch

  ); }tics
   analyue,
      ess: tr
      succnd({    reply.se

};    }

        }th
      ngected').leatus('rejyStlistB.getShortected: job     rej    
 gth,ed').lentatus('hirstByS.getShortlijob hired:         h,
 gtlend').rvieweStatus('inteByrtlist job.getShorviewed:nte     i     ,
d').lengthontacteyStatus('cistBShortljob.getntacted:   coh,
        ).lengthortlisted'tByStatus('stShortlisgelisted: job.      short   {
  tatus:
        byStCount,ob.shortlistotal: j     s: {
   tlistStat  shor   
 cs,job.analyti      ...s = {
analyticst 
    con    }
);
   }ied'
   ss dencce message: 'A       ,
: false   successnd({
     secode(403).eply. return r    in') {
 !== 'adm& user.role d &er.i!== ustoString() erId.(job.recruitif    p
 fy ownershi    // Veri
    }

;
      })nd'Job not fou message: ',
       lse faccess:
        su4).send({eply.code(40turn rre{
      (!job)  if ;

   arams.id).pequestndById(rfiobPosting. = await Jobonst j
    cuest;user } = reqonst {     c{
  try {
reply) => (request, async 
}, ticateToken]er: [autheneHandl prs', {
 alyticobs/:id/an'/jouter.get(ics
rlytGet job ana

// ););
  }
}
    }lto link'rate maieneiled to g'Fa:     message  alse,
: fsuccess{
      nd((500).se reply.codeor);
   ', errerror:tion lto genera.error('Maioleconsr) {
    ch (erro
  } cat });
   
r.emaildateUsendicadateEmail: andi   c  iltoLink,
  ma   ,
  ess: trueucc
      s.send({  reply
  
    );
,
      jobl
      }eUser.emaindidat  email: ca
      ayName,.displdidateUser|| cane.name atdid can       name:    {
 
  ink(ateMailtoLervice.generlSai emult;s')).defaService.jmailvices/e/sert('..imporait vice = (awnst emailSer   co ate mainer // Ge

export default router;