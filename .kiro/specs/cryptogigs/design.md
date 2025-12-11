# Kiro Talent Engine Design Document

## Overview

Kiro Talent Engine is a universal AI-powered talent platform that revolutionizes how recruiters discover and hire talent. The platform combines intelligent portfolio analysis, automated candidate matching, and crypto-native payment flows to create a transparent, fair, and efficient hiring ecosystem. Unlike traditional platforms that rely on keyword matching, Kiro uses AI to deeply analyze portfolios, GitHub repositories, and work history to provide objective skill assessments and match candidates with opportunities based on comprehensive evaluation. The platform uses MongoDB for data persistence and wallet-based authentication for secure, decentralized user access.

### Key Features
- **Multi-role support**: Freelancers, Recruiters, Students, Graduates, PhD candidates
- **AI-powered portfolio and GitHub analysis** with scoring and improvement suggestions
- **Intelligent candidate matching** with multi-factor ranking algorithm
- **Test token payment system** (ETH, USDC, KIRO tokens)
- **Comprehensive profile analytics** with radar charts
- **Automated hiring workflow** with email integration
- **Real-time dashboard updates**
- **Responsive design** with purple/blue accent theme

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Engine     │
│   (Svelte 5)    │◄──►│   (Fastify)     │◄──►│  (LLM + APIs)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Wallet Connect  │    │    MongoDB      │    │  GitHub API     │
│  (Web3 Auth)    │    │   Database      │    │  Web Scraping   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudinary    │    │  Test Tokens    │    │  Email Service  │
│ Image Storage   │    │  (Simulated)    │    │   (mailto:)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

#### User Registration Flow
1. User selects role (Freelancer, Recruiter, Student, Graduate, PhD)
2. User chooses a unique username
3. User connects their crypto wallet (MetaMask, WalletConnect, etc.)
4. Backend verifies wallet signature for authentication
5. User provides role-specific information (skills, education, portfolio, GitHub)
6. User profile stored in MongoDB with username, wallet address, and role-specific fields
7. JWT token generated and returned to frontend
8. User redirected to role-appropriate dashboard

#### AI Portfolio Analysis Flow
1. Candidate clicks "Re-analyze Portfolio" button
2. Frontend sends request to backend with portfolio URL and GitHub URL
3. Backend validates URLs and initiates AI analysis
4. AI Engine visits portfolio website and extracts project information
5. AI Engine fetches GitHub repository data via GitHub API
6. AI Engine calculates scores: Code Quality, Project Depth, Portfolio Completeness
7. AI Engine generates 3-5 specific improvement suggestions
8. Backend stores analysis results in MongoDB
9. Frontend displays radar chart with scores and improvement list
10. Profile score updated in candidate's profile

#### Job Posting and Matching Flow
1. Recruiter creates job posting with requirements (skills, experience, education, budget)
2. Backend stores job posting in MongoDB
3. AI Matching Engine retrieves all candidate profiles
4. For each candidate, AI calculates match score using weighted formula:
   - Skill alignment (35%)
   - Experience years match (20%)
   - Portfolio depth (20%)
   - Education alignment (10%)
   - GitHub activity (10%)
   - Availability fit (5%)
5. AI generates match explanations highlighting candidate strengths
6. Backend creates ranked shortlist ordered by match score
7. Frontend displays candidate cards with match scores and action buttons

#### Payment Flow
1. Recruiter clicks "Pay" button on candidate card
2. Frontend displays payment modal with token selection (ETH, USDC, KIRO)
3. Recruiter enters amount and confirms
4. Backend simulates test token transaction
5. Backend logs payment metadata (token type, amount, job ID, candidate ID, timestamp)
6. Backend updates candidate's earnings in MongoDB
7. Frontend shows transaction confirmation
8. Both dashboards update instantly with new transaction

#### Hiring Flow
1. Recruiter clicks "Hire" button on candidate card
2. Backend marks candidate as hired for that job posting
3. Backend generates automated email with job offer details
4. Email sent to candidate via configured email service
5. Frontend updates candidate card status to "Hired"
6. Recruiter can click "Email" button to open mailto: link with pre-filled message

## Components and Interfaces

### Frontend Architecture (Svelte 5)

#### File Structure
```
src/
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte (Landing Page with Role Selection)
│   ├── auth/
│   │   ├── login/+page.svelte
│   │   └── register/+page.svelte (with role selection)
│   ├── dashboard/
│   │   ├── candidate/
│   │   │   ├── +page.svelte (Overview with sidebar)
│   │   │   ├── portfolio-analysis/+page.svelte
│   │   │   ├── earnings/+page.svelte
│   │   │   └── profile-edit/+page.svelte
│   │   └── recruiter/
│   │       ├── +page.svelte (Job listings overview)
│   │       ├── jobs/
│   │       │   ├── create/+page.svelte
│   │       │   ├── [id]/+page.svelte (Job detail)
│   │       │   └── [id]/candidates/+page.svelte (Shortlist)
│   │       ├── payments/+page.svelte
│   │       └── settings/+page.svelte
│   ├── profile/
│   │   ├── [userId]/+page.svelte (Public profile view)
│   │   └── edit/+page.svelte
│   └── wallet/
│       └── +page.svelte
├── lib/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── Card.svelte
│   │   │   ├── Input.svelte
│   │   │   ├── RadarChart.svelte
│   │   │   └── LoadingSkeleton.svelte
│   │   ├── candidate/
│   │   │   ├── ProfileSidebar.svelte
│   │   │   ├── PortfolioAnalysis.svelte
│   │   │   ├── ImprovementSuggestions.svelte
│   │   │   └── EarningsChart.svelte
│   │   ├── recruiter/
│   │   │   ├── JobPostingForm.svelte
│   │   │   ├── CandidateCard.svelte
│   │   │   ├── ShortlistView.svelte
│   │   │   ├── PaymentModal.svelte
│   │   │   └── MatchExplanation.svelte
│   │   ├── shared/
│   │   │   ├── Navbar.svelte
│   │   │   ├── RoleSelector.svelte
│   │   │   └── ThemeToggle.svelte
│   │   └── WalletDisplay.svelte
│   ├── stores/
│   │   ├── auth.js (user role, profile data)
│   │   ├── candidate.js (portfolio analysis, scores)
│   │   ├── recruiter.js (jobs, shortlists)
│   │   ├── payments.js (transactions, earnings)
│   │   └── theme.js (dark/light mode)
│   ├── services/
│   │   ├── api.js (backend API calls)
│   │   ├── wallet.js (wallet connection and authentication)
│   │   ├── ai.js (portfolio analysis, matching)
│   │   └── payments.js (test token transactions)
│   └── utils/
│       ├── validation.js
│       ├── formatting.js
│       ├── constants.js
│       └── matching.js (match score calculations)
└── app.html
```

#### Key Components

**ProfileSidebar.svelte**
- Fixed sidebar displaying candidate information
- Shows avatar, name, major/field, education badge
- Displays portfolio, GitHub, availability, experience
- Lists skills as tags, bio, and work history
- Visible across all candidate dashboard pages

**PortfolioAnalysis.svelte**
- Displays AI-generated profile scores
- Shows radar chart with Code Quality, Project Depth, Portfolio Completeness, Overall Score
- Provides "Re-analyze Portfolio" button
- Shows last analysis timestamp

**ImprovementSuggestions.svelte**
- Lists 3-5 specific improvement suggestions from AI
- Numbered list with actionable recommendations
- Updates after each portfolio re-analysis

**CandidateCard.svelte**
- Displays candidate summary in shortlist
- Shows name, skills, match score, experience, education
- Includes portfolio and GitHub links
- Provides action buttons: View Profile, Hire, Pay, Email
- Highlights match strengths

**JobPostingForm.svelte**
- Form for creating job postings
- Fields: title, description, required skills, experience, education, role type, budget
- Number of candidates to shortlist selector
- Submit button triggers AI matching

**ShortlistView.svelte**
- Grid of candidate cards ranked by match score
- Shows match explanations for each candidate
- Filters and sorting options
- Bulk actions for hiring/contacting multiple candidates

**PaymentModal.svelte**
- Modal for test token payments
- Token type selector (ETH, USDC, KIRO)
- Amount input field
- Confirmation button
- Transaction status display

**RadarChart.svelte**
- Reusable radar/spider chart component
- Displays multi-dimensional scores
- Animated transitions
- Responsive sizing

### Backend Architecture (Fastify)

#### API Structure
```
src/
├── server.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── candidates.js
│   ├── recruiters.js
│   ├── jobs.js
│   ├── matching.js
│   ├── payments.js
│   ├── portfolio.js
│   └── analytics.js
├── middleware/
│   ├── auth.js
│   ├── roleCheck.js
│   ├── validation.js
│   ├── rateLimit.js
│   └── cors.js
├── services/
│   ├── auth.js
│   ├── wallet.js
│   ├── ai/
│   │   ├── portfolioAnalyzer.js
│   │   ├── matchingEngine.js
│   │   └── improvementGenerator.js
│   ├── github.js
│   ├── webScraper.js
│   ├── payments.js
│   └── email.js
├── models/
│   ├── User.js
│   ├── CandidateProfile.js
│   ├── RecruiterProfile.js
│   ├── JobPosting.js
│   ├── PortfolioAnalysis.js
│   ├── Payment.js
│   └── Shortlist.js
└── utils/
    ├── validation.js
    ├── scoring.js
    ├── logger.js
    └── constants.js
```

#### Core API Endpoints

**Authentication Routes**
- `POST /auth/register` - Register with username, wallet address, and role selection
- `POST /auth/login` - Login with wallet signature verification
- `POST /auth/nonce` - Get nonce for wallet signature
- `POST /auth/verify` - Verify wallet signature and issue JWT
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

**Candidate Routes**
- `GET /candidates/:id` - Get candidate profile
- `PUT /candidates/:id` - Update candidate profile
- `POST /candidates/:id/analyze` - Trigger AI portfolio analysis
- `GET /candidates/:id/analysis` - Get latest analysis results
- `GET /candidates/:id/earnings` - Get earnings summary
- `GET /candidates/search` - Search candidates (for recruiters)

**Recruiter Routes**
- `GET /recruiters/:id` - Get recruiter profile
- `PUT /recruiters/:id` - Update recruiter profile
- `GET /recruiters/:id/payments` - Get payment history

**Job Posting Routes**
- `POST /jobs` - Create job posting
- `GET /jobs` - Get all jobs (filtered by recruiter)
- `GET /jobs/:id` - Get job details
- `PUT /jobs/:id` - Update job posting
- `DELETE /jobs/:id` - Delete job posting
- `POST /jobs/:id/activate` - Activate job posting
- `POST /jobs/:id/deactivate` - Deactivate job posting

**Matching Routes**
- `POST /matching/generate` - Generate shortlist for job posting
- `GET /matching/shortlist/:jobId` - Get shortlist for job
- `GET /matching/explain/:jobId/:candidateId` - Get match explanation
- `POST /matching/hire` - Mark candidate as hired

**Payment Routes**
- `POST /payments/send` - Send test token payment
- `GET /payments/history/:userId` - Get payment history
- `GET /payments/earnings/:candidateId` - Get candidate earnings
- `POST /payments/verify` - Verify payment transaction

**Portfolio Analysis Routes**
- `POST /portfolio/analyze` - Analyze portfolio and GitHub
- `GET /portfolio/analysis/:candidateId` - Get analysis results
- `GET /portfolio/suggestions/:candidateId` - Get improvement suggestions

**Analytics Routes**
- `GET /analytics/candidate/:id` - Get candidate analytics
- `GET /analytics/recruiter/:id` - Get recruiter analytics
- `GET /analytics/platform` - Get platform-wide statistics

## Data Models

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  username: string, // Unique username chosen by user
  walletAddress: string, // Connected wallet address (primary authentication)
  role: string, // 'freelancer', 'recruiter', 'student', 'graduate', 'phd'
  displayName: string,
  profileImage: string, // Cloudinary URL
  nonce: string, // Random nonce for wallet signature verification
  createdAt: Date,
  updatedAt: Date,
  isActive: boolean,
  lastLogin: Date
}
```

#### CandidateProfiles Collection
```javascript
{
  _id: ObjectId,
  username: string, // Reference to Users by username
  walletAddress: string, // Reference to Users by wallet
  bio: string,
  major: string,
  fieldOfStudy: string,
  educationLevel: string, // 'student', 'graduate', 'phd'
  university: string,
  skills: string[],
  yearsOfExperience: number,
  portfolioUrl: string,
  githubUrl: string,
  availability: string, // 'Full-time', 'Part-time', 'Contract', 'Months'
  workHistory: [{
    company: string,
    position: string,
    duration: string,
    description: string
  }],
  isPublished: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### RecruiterProfiles Collection
```javascript
{
  _id: ObjectId,
  username: string, // Reference to Users by username
  walletAddress: string, // Reference to Users by wallet
  company: string,
  position: string,
  bio: string,
  industry: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### PortfolioAnalysis Collection
```javascript
{
  _id: ObjectId,
  candidateId: string, // Reference to CandidateProfiles
  portfolioUrl: string,
  githubUrl: string,
  scores: {
    overall: number, // 0-100
    codeQuality: number, // 0-100
    projectDepth: number, // 0-100
    portfolioCompleteness: number // 0-100
  },
  githubData: {
    repositories: number,
    stars: number,
    commits: number,
    languages: string[],
    lastActivity: Date,
    topProjects: [{
      name: string,
      description: string,
      stars: number,
      language: string,
      url: string
    }]
  },
  portfolioData: {
    projects: [{
      name: string,
      description: string,
      techStack: string[],
      deploymentUrl: string,
      complexity: string // 'simple', 'moderate', 'complex'
    }],
    readmeQuality: string, // 'poor', 'good', 'excellent'
    hasDeployedProjects: boolean
  },
  improvements: [{
    priority: number,
    suggestion: string,
    category: string // 'code', 'portfolio', 'github', 'documentation'
  }],
  analyzedAt: Date,
  createdAt: Date
}
```

#### JobPostings Collection
```javascript
{
  _id: ObjectId,
  recruiterId: string, // Reference to Users
  title: string,
  description: string,
  requiredSkills: string[],
  minimumExperience: number, // years
  educationPreference: string, // 'student', 'graduate', 'phd', 'any'
  roleType: string, // 'full-time', 'part-time', 'contract', 'internship'
  budget: number, // in test tokens
  budgetCurrency: string, // 'ETH', 'USDC', 'KIRO'
  numberOfCandidates: number, // for shortlist
  status: string, // 'active', 'filled', 'closed'
  createdAt: Date,
  updatedAt: Date
}
```

#### Shortlists Collection
```javascript
{
  _id: ObjectId,
  jobId: string, // Reference to JobPostings
  recruiterId: string,
  candidates: [{
    candidateId: string,
    matchScore: number, // 0-100
    breakdown: {
      skillMatch: number,
      experienceMatch: number,
      portfolioDepth: number,
      educationAlignment: number,
      githubActivity: number,
      availabilityFit: number
    },
    strengths: string[],
    explanation: string,
    status: string, // 'pending', 'hired', 'rejected'
    hiredAt: Date
  }],
  generatedAt: Date,
  createdAt: Date
}
```

#### Payments Collection
```javascript
{
  _id: ObjectId,
  fromUserId: string, // Recruiter
  toUserId: string, // Candidate
  jobId: string, // Reference to JobPostings
  amount: number,
  tokenType: string, // 'ETH', 'USDC', 'KIRO'
  transactionId: string, // Simulated transaction hash
  status: string, // 'pending', 'completed', 'failed'
  metadata: {
    purpose: string,
    notes: string
  },
  createdAt: Date,
  completedAt: Date
}
```

#### Earnings Collection
```javascript
{
  _id: ObjectId,
  candidateId: string,
  totalEarnings: {
    ETH: number,
    USDC: number,
    KIRO: number
  },
  transactions: [{
    paymentId: string,
    amount: number,
    tokenType: string,
    from: string, // Recruiter name
    jobTitle: string,
    receivedAt: Date
  }],
  updatedAt: Date
}
```

### Database Indexes

**Users Indexes**
- `username` (unique)
- `walletAddress` (unique)
- `username, walletAddress` (compound)

**CandidateProfiles Indexes**
- `username` (unique)
- `walletAddress` (unique)
- `skills, isPublished`
- `educationLevel, isPublished`
- `yearsOfExperience, isPublished`

**JobPostings Indexes**
- `recruiterId, status`
- `status, createdAt`
- `requiredSkills, status`

**Shortlists Indexes**
- `jobId` (unique)
- `recruiterId, createdAt`
- `candidates.candidateId`

**Payments Indexes**
- `fromUserId, createdAt`
- `toUserId, createdAt`
- `jobId`
- `status, createdAt`

**PortfolioAnalysis Indexes**
- `candidateId`
- `analyzedAt`

## Wallet Authentication System

### Authentication Flow

The platform uses wallet-based authentication instead of traditional email/password. This provides a secure, decentralized authentication mechanism using cryptographic signatures.

#### Registration Flow
1. User enters desired username
2. Backend validates username uniqueness
3. User connects wallet (MetaMask, WalletConnect, etc.)
4. Backend generates a random nonce for the wallet address
5. User signs the nonce with their private key
6. Backend verifies the signature
7. User profile created with username and wallet address
8. JWT token issued for session management

#### Login Flow
1. User enters username or connects wallet
2. Backend retrieves user's nonce from database
3. User signs the nonce with their private key
4. Backend verifies signature matches wallet address
5. Backend generates new nonce for next login
6. JWT token issued with user role and permissions
7. User redirected to role-appropriate dashboard

### Signature Verification

**Nonce Generation**
```javascript
// Generate cryptographically secure random nonce
const nonce = crypto.randomBytes(32).toString('hex');
```

**Message Format**
```
Sign this message to authenticate with Kiro Talent Engine:
Nonce: {nonce}
Timestamp: {timestamp}
```

**Verification Process**
1. Retrieve user's stored nonce from MongoDB
2. Reconstruct the message that was signed
3. Use ethers.js to recover the signer address from signature
4. Compare recovered address with stored wallet address
5. If match, authentication successful
6. Generate new nonce and store for next login

### JWT Token Structure

```javascript
{
  userId: string,        // MongoDB _id
  username: string,      // Unique username
  walletAddress: string, // Ethereum address
  role: string,          // 'freelancer', 'recruiter', etc.
  iat: number,           // Issued at timestamp
  exp: number            // Expiration timestamp (24 hours)
}
```

### Security Considerations

- **Nonce Rotation**: New nonce generated after each successful login to prevent replay attacks
- **Signature Expiration**: Signatures should be used within 5 minutes of generation
- **Wallet Verification**: Wallet ownership verified through cryptographic signature
- **No Password Storage**: No passwords stored, reducing attack surface
- **JWT Expiration**: Tokens expire after 24 hours, requiring re-authentication
- **HTTPS Only**: All authentication endpoints require HTTPS in production

## AI Engine Components

### Portfolio Analyzer

The Portfolio Analyzer is responsible for evaluating candidate portfolios and GitHub repositories to generate objective skill assessments.

#### Input
- Portfolio URL
- GitHub URL
- Candidate profile data (skills, experience, education)

#### Process
1. **URL Validation**: Verify URLs are accessible and valid
2. **Portfolio Scraping**: Extract project information, tech stacks, deployment links
3. **GitHub API Integration**: Fetch repository data, commit history, languages, stars
4. **Project Analysis**: Evaluate project complexity, code quality indicators, documentation
5. **Score Calculation**: Generate scores for Code Quality, Project Depth, Portfolio Completeness
6. **Improvement Generation**: Create 3-5 specific, actionable suggestions

#### Output
```javascript
{
  scores: {
    overall: 85,
    codeQuality: 80,
    projectDepth: 90,
    portfolioCompleteness: 85
  },
  improvements: [
    "Add unit tests to your main projects to demonstrate testing skills",
    "Include a detailed README with setup instructions for your top 3 projects",
    "Deploy at least 2 more projects to show production experience",
    "Contribute to open-source projects to increase GitHub visibility",
    "Add code comments to improve code readability"
  ],
  githubData: { ... },
  portfolioData: { ... }
}
```

### Matching Engine

The Matching Engine ranks candidates against job requirements using a weighted scoring algorithm.

#### Match Score Formula
```
matchScore = 
  (skillMatch * 0.35) +
  (experienceMatch * 0.20) +
  (portfolioDepth * 0.20) +
  (educationAlignment * 0.10) +
  (githubActivity * 0.10) +
  (availabilityFit * 0.05)
```

#### Component Calculations

**Skill Match (35%)**
- Calculate Jaccard similarity between required skills and candidate skills
- Bonus for exact matches on critical skills
- Penalty for missing required skills

**Experience Match (20%)**
- Compare candidate years of experience to minimum requirement
- Score = min(candidateYears / requiredYears, 1.0) * 100
- Bonus for exceeding requirements

**Portfolio Depth (20%)**
- Use Portfolio Analyzer's projectDepth score
- Consider number of projects, complexity, and deployment status

**Education Alignment (10%)**
- Exact match: 100%
- Higher education than required: 90%
- Lower education than required: 50%
- Any education accepted: 100%

**GitHub Activity (10%)**
- Recent commits (last 6 months): 40%
- Repository count: 30%
- Stars received: 20%
- Contribution frequency: 10%

**Availability Fit (5%)**
- Exact match on availability type: 100%
- Compatible availability: 75%
- Incompatible availability: 25%

#### Output
```javascript
{
  candidateId: "abc123",
  matchScore: 87,
  breakdown: {
    skillMatch: 92,
    experienceMatch: 85,
    portfolioDepth: 90,
    educationAlignment: 100,
    githubActivity: 75,
    availabilityFit: 100
  },
  strengths: [
    "Strong skill alignment with 8/10 required skills",
    "Excellent portfolio with 5 deployed projects",
    "Active GitHub contributor with recent commits"
  ],
  explanation: "This candidate is an excellent match with 87% overall score..."
}
```

### Improvement Generator

The Improvement Generator analyzes portfolio analysis results and generates specific, actionable suggestions.

#### Categories
- **Code Quality**: Testing, documentation, code style
- **Portfolio**: Project diversity, deployment, presentation
- **GitHub**: Activity, contributions, repository organization
- **Documentation**: README files, project descriptions, setup instructions

#### Suggestion Prioritization
1. Critical gaps (missing required elements)
2. High-impact improvements (deployment, testing)
3. Enhancement opportunities (documentation, contributions)
4. Polish items (styling, organization)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role-based profile completeness
*For any* user registration with a specific role, the system should collect and store all required fields for that role type, and the profile should be retrievable with all fields intact.
**Validates: Requirements 1.2, 1.3**

### Property 2: Portfolio analysis determinism
*For any* candidate profile with valid portfolio and GitHub URLs, running the analysis multiple times with the same URLs should produce consistent scores (within a 5% margin for dynamic data like recent commits).
**Validates: Requirements 2.1, 2.2, 11.3**

### Property 3: Match score calculation consistency
*For any* job posting and candidate profile, the match score calculation should be deterministic and reproducible when given the same inputs.
**Validates: Requirements 4.2, 11.3**

### Property 4: Match score component weights
*For any* match score calculation, the sum of all component weights (skill match, experience match, portfolio depth, education alignment, GitHub activity, availability fit) should equal 100%.
**Validates: Requirements 4.2**

### Property 5: Shortlist ordering
*For any* generated shortlist, candidates should be ordered by match score in descending order, with the highest match score appearing first.
**Validates: Requirements 4.3**

### Property 6: Payment transaction integrity
*For any* completed payment transaction, the amount deducted from the recruiter's balance should equal the amount added to the candidate's earnings for the same token type.
**Validates: Requirements 6.3, 6.4**

### Property 7: Earnings accumulation
*For any* candidate receiving multiple payments, the total earnings for each token type should equal the sum of all individual payment amounts for that token type.
**Validates: Requirements 7.1, 7.2**

### Property 8: Username uniqueness
*For any* two different users, their usernames should be unique and the system should reject duplicate username registrations.
**Validates: Requirements 1.5**

### Property 16: Wallet address uniqueness
*For any* two different users, their connected wallet addresses should be unique and the system should reject duplicate wallet address registrations.
**Validates: Requirements 1.4, 1.5**

### Property 17: Authentication signature verification
*For any* login attempt with a valid wallet address and correct signature, the system should successfully authenticate the user and issue a valid JWT token.
**Validates: Requirements 1.5**

### Property 9: Hire status persistence
*For any* candidate marked as hired for a job posting, subsequent queries for that shortlist should show the candidate's status as hired until explicitly changed.
**Validates: Requirements 5.2**

### Property 10: Profile sidebar data consistency
*For any* candidate profile update, the sidebar should reflect the updated information immediately after the save operation completes.
**Validates: Requirements 8.4**

### Property 11: AI analysis URL validation
*For any* portfolio analysis request, the system should validate URLs before initiating analysis and reject invalid or inaccessible URLs.
**Validates: Requirements 2.1, 11.2**

### Property 12: Improvement suggestion count
*For any* completed portfolio analysis, the system should generate between 3 and 5 improvement suggestions.
**Validates: Requirements 2.4**

### Property 13: Match score range
*For any* calculated match score, the value should be between 0 and 100 inclusive.
**Validates: Requirements 4.2**

### Property 14: Required skills impact
*For any* two candidates where one has all required skills and the other has none, the candidate with all required skills should have a higher match score (assuming all other factors are equal).
**Validates: Requirements 4.2**

### Property 15: Payment metadata completeness
*For any* logged payment transaction, the metadata should include token type, amount, job ID, candidate ID, and timestamp.
**Validates: Requirements 6.4**

## Error Handling

### Frontend Error Handling
- Global error boundary for unhandled exceptions
- AI analysis timeout handling (30 second timeout)
- Network timeout handling with retry logic
- Form validation with user-friendly messages
- Loading states for async operations (portfolio analysis, matching)
- Graceful degradation when AI services are unavailable

### Backend Error Handling
- Structured error responses with error codes
- AI service failure handling with fallback responses
- Rate limiting with appropriate HTTP status codes
- Input validation with detailed error messages
- Database operation error recovery
- GitHub API rate limit handling
- Web scraping failure recovery

### Error Response Format
```javascript
{
  success: false,
  error: {
    code: "PORTFOLIO_ANALYSIS_FAILED",
    message: "Unable to analyze portfolio",
    details: "The portfolio URL is not accessible or returned an error",
    retryable: true
  },
  timestamp: "2024-12-08T00:00:00Z"
}
```

### Common Error Codes
- `INVALID_URL`: Portfolio or GitHub URL is malformed or inaccessible
- `ANALYSIS_TIMEOUT`: Portfolio analysis exceeded time limit
- `INSUFFICIENT_DATA`: Not enough data to generate meaningful scores
- `MATCHING_FAILED`: Unable to generate candidate matches
- `PAYMENT_FAILED`: Test token payment simulation failed
- `UNAUTHORIZED`: User lacks permission for requested action
- `INVALID_ROLE`: Operation not allowed for user's role

## Testing Strategy

### Unit Testing
Unit tests verify specific functions and components work correctly in isolation.

**Frontend Unit Tests**
- Utility functions (validation, formatting, scoring calculations)
- Store logic (state management, data transformations)
- Individual component logic (without rendering)

**Backend Unit Tests**
- Match score calculation functions
- Portfolio analysis scoring algorithms
- Payment transaction logic
- URL validation functions
- Data transformation utilities

### Property-Based Testing
Property-based tests verify universal properties hold across all inputs using **fast-check** library for JavaScript.

**Testing Framework**: fast-check (https://github.com/dubzzz/fast-check)
**Configuration**: Minimum 100 iterations per property test

**Property Tests to Implement**:

Each property test MUST be tagged with: `**Feature: cryptogigs, Property {number}: {property_text}**`

1. **Feature: cryptogigs, Property 1: Role-based profile completeness**
   - Generate random user registrations with different roles
   - Verify all required fields are stored and retrievable

2. **Feature: cryptogigs, Property 2: Portfolio analysis determinism**
   - Generate random portfolio data
   - Run analysis multiple times
   - Verify scores are consistent within 5% margin

3. **Feature: cryptogigs, Property 3: Match score calculation consistency**
   - Generate random job postings and candidate profiles
   - Calculate match scores multiple times
   - Verify identical results

4. **Feature: cryptogigs, Property 4: Match score component weights**
   - Generate random match score components
   - Verify sum of weights equals 100%

5. **Feature: cryptogigs, Property 5: Shortlist ordering**
   - Generate random candidate lists with match scores
   - Verify shortlist is sorted in descending order

6. **Feature: cryptogigs, Property 6: Payment transaction integrity**
   - Generate random payment transactions
   - Verify debit equals credit for same token type

7. **Feature: cryptogigs, Property 7: Earnings accumulation**
   - Generate random payment sequences
   - Verify total earnings equals sum of payments

8. **Feature: cryptogigs, Property 8: Username uniqueness**
   - Generate multiple user registrations with different usernames
   - Verify all usernames are unique and duplicates are rejected

16. **Feature: cryptogigs, Property 16: Wallet address uniqueness**
   - Generate multiple user registrations with different wallet addresses
   - Verify all wallet addresses are unique and duplicates are rejected

17. **Feature: cryptogigs, Property 17: Authentication signature verification**
   - Generate random wallet addresses and signatures
   - Verify valid signatures authenticate successfully
   - Verify invalid signatures are rejected

9. **Feature: cryptogigs, Property 9: Hire status persistence**
   - Generate random hire actions
   - Verify status persists across queries

10. **Feature: cryptogigs, Property 10: Profile sidebar data consistency**
    - Generate random profile updates
    - Verify sidebar reflects changes immediately

11. **Feature: cryptogigs, Property 11: AI analysis URL validation**
    - Generate random URLs (valid and invalid)
    - Verify invalid URLs are rejected before analysis

12. **Feature: cryptogigs, Property 12: Improvement suggestion count**
    - Generate random portfolio analyses
    - Verify 3-5 suggestions are always generated

13. **Feature: cryptogigs, Property 13: Match score range**
    - Generate random match calculations
    - Verify scores are between 0-100

14. **Feature: cryptogigs, Property 14: Required skills impact**
    - Generate candidate pairs with different skill matches
    - Verify candidate with more skills has higher score

15. **Feature: cryptogigs, Property 15: Payment metadata completeness**
    - Generate random payments
    - Verify all required metadata fields are present

### Integration Testing
Integration tests verify multiple components work together correctly.

**API Integration Tests**
- Authentication flow (wallet connect → signature verification → JWT issuance → profile access)
- Job posting creation → matching → shortlist generation
- Payment flow (initiate → process → update earnings)
- Portfolio analysis request → AI processing → results storage

**Database Integration Tests**
- CRUD operations for all collections
- Index performance verification
- Transaction integrity across collections

### End-to-End Testing
E2E tests verify complete user workflows from UI to database.

**Critical User Flows**
- Candidate registration → profile creation → portfolio analysis → view results
- Recruiter registration → job posting → view shortlist → hire candidate → send payment
- Profile editing → sidebar update → analytics refresh
- Payment sending → earnings update → transaction history display

## Security Considerations

### Authentication Security
- Wallet-based authentication using cryptographic signatures
- Nonce-based signature verification to prevent replay attacks
- JWT token expiration (24 hours) and refresh mechanism
- Role-based access control (RBAC) for candidate vs recruiter features
- Session management with secure HTTP-only cookies
- Username uniqueness validation
- Wallet address verification and validation

### Data Security
- MongoDB access control with user-specific permissions
- Input validation and sanitization on all endpoints
- File upload restrictions (max 10MB, allowed types: jpg, png, pdf)
- Cloudinary secure image storage with signed URLs
- Sensitive data encryption at rest

### Payment Security
- Test token transactions only (no real cryptocurrency)
- Transaction ID generation with cryptographic randomness
- Payment amount validation (positive numbers, reasonable limits)
- Double-spend prevention through transaction logging
- Audit trail for all payment operations

### AI Security
- URL validation before web scraping
- Rate limiting on AI analysis requests (max 5 per hour per user)
- Timeout limits on portfolio analysis (30 seconds)
- Sanitization of scraped content before processing
- No execution of scraped code or scripts

### API Security
- Rate limiting per user and IP (100 requests per 15 minutes)
- CORS configuration for allowed origins
- Request size limits (max 10MB)
- API key management for external services (GitHub, Cloudinary)
- SQL injection prevention through parameterized queries
- XSS prevention through output encoding

### Role-Based Access Control
- Candidates can only edit their own profiles
- Recruiters can only access candidate data through matching
- Payment operations require sender authentication
- Job postings can only be edited by creating recruiter
- Analytics data filtered by user role and ownership

## Design System and Styling

### Color Palette

#### Light Mode
- **Primary Background**: `#ffffff` (White)
- **Secondary Background**: `#f8f9fa` (Light Gray)
- **Card Background**: `#ffffff` (White)
- **Text Primary**: `#212529` (Dark Gray)
- **Text Secondary**: `#6c757d` (Medium Gray)
- **Accent Color**: `#ff6b35` (Orange)
- **Accent Hover**: `#e55a2b` (Darker Orange)
- **Border Color**: `#dee2e6` (Light Border)
- **Success**: `#28a745` (Green)
- **Warning**: `#ffc107` (Yellow)
- **Error**: `#dc3545` (Red)

#### Dark Mode
- **Primary Background**: `#000000` (Black)
- **Secondary Background**: `#1a1a1a` (Dark Gray)
- **Card Background**: `#2d2d2d` (Medium Dark)
- **Text Primary**: `#ffffff` (White)
- **Text Secondary**: `#b0b0b0` (Light Gray)
- **Accent Color**: `#ff6b35` (Orange - same as light)
- **Accent Hover**: `#ff7f4d` (Lighter Orange for dark bg)
- **Border Color**: `#404040` (Dark Border)
- **Success**: `#4caf50` (Lighter Green)
- **Warning**: `#ffeb3b` (Lighter Yellow)
- **Error**: `#f44336` (Lighter Red)

### Typography

#### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

#### Font Sizes
- **Heading 1**: `2.5rem` (40px) - Page titles
- **Heading 2**: `2rem` (32px) - Section headers
- **Heading 3**: `1.5rem` (24px) - Subsection headers
- **Heading 4**: `1.25rem` (20px) - Card titles
- **Body Large**: `1.125rem` (18px) - Important text
- **Body**: `1rem` (16px) - Default text
- **Body Small**: `0.875rem` (14px) - Secondary text
- **Caption**: `0.75rem` (12px) - Labels, metadata

#### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Component Styling Guidelines

#### Buttons
```css
/* Primary Button */
.btn-primary {
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--accent-color);
  border: 2px solid var(--accent-color);
  border-radius: 8px;
  padding: 10px 22px;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
```

#### Cards
```css
.card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.gig-card {
  cursor: pointer;
  overflow: hidden;
}

.gig-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}
```

#### Forms
```css
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-background);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
}
```

### Page-Specific Styling

#### Homepage
- Hero section with gradient overlay on background image
- Large call-to-action buttons with orange accent
- Featured gigs grid with hover animations
- Statistics section with animated counters

#### Authentication Pages
- Centered card layout with max-width 400px
- Wallet connection button prominently displayed
- Form validation with inline error messages
- Social proof elements (user count, security badges)

#### Gig Browsing Page
- Sidebar filters with collapsible sections
- Grid layout responsive (1-4 columns based on screen size)
- Search bar with autocomplete suggestions
- Sort dropdown with custom styling

#### Gig Detail Page
- Image carousel with thumbnail navigation
- Pricing cards with clear package differentiation
- Freelancer profile sidebar with ratings
- Reviews section with star ratings

#### Profile Pages
- Cover photo with profile picture overlay
- Tabbed navigation for different sections
- Skills tags with orange accent
- Portfolio grid with lightbox functionality

#### Messaging Interface
- Chat bubble styling with sender differentiation
- File attachment previews
- Typing indicators
- Message timestamps

#### Wallet Dashboard
- Balance cards with cryptocurrency icons
- Transaction history table with status indicators
- Charts for earnings/spending visualization
- Connect wallet button when disconnected

### Responsive Design Breakpoints

```css
/* Mobile First Approach */
/* Extra Small: 0-575px */
@media (max-width: 575px) {
  .container { padding: 0 16px; }
  .gig-grid { grid-template-columns: 1fr; }
}

/* Small: 576-767px */
@media (min-width: 576px) {
  .gig-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Medium: 768-991px */
@media (min-width: 768px) {
  .gig-grid { grid-template-columns: repeat(3, 1fr); }
  .sidebar { display: block; }
}

/* Large: 992-1199px */
@media (min-width: 992px) {
  .gig-grid { grid-template-columns: repeat(4, 1fr); }
  .container { max-width: 1140px; }
}

/* Extra Large: 1200px+ */
@media (min-width: 1200px) {
  .container { max-width: 1320px; }
}
```

### Dark Mode Implementation

```css
/* CSS Custom Properties for Theme Switching */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-card: #ffffff;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
  --accent-color: #ff6b35;
  --accent-hover: #e55a2b;
}

[data-theme="dark"] {
  --bg-primary: #000000;
  --bg-secondary: #1a1a1a;
  --bg-card: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent-color: #ff6b35;
  --accent-hover: #ff7f4d;
}

/* Theme Toggle Button */
.theme-toggle {
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 50px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
```

### Animation Guidelines

#### Micro-interactions
- Button hover: `transform: translateY(-1px)` with 0.2s ease
- Card hover: `transform: translateY(-2px)` with 0.2s ease
- Loading states: Subtle pulse animation
- Form focus: Border color change with box-shadow

#### Page Transitions
- Fade in: 0.3s ease for page loads
- Slide in: 0.4s ease for modals
- Scale in: 0.2s ease for dropdowns

#### Loading States
```css
.loading-skeleton {
  background: linear-gradient(90deg, 
    var(--border-color) 25%, 
    transparent 50%, 
    var(--border-color) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Accessibility Considerations

- Minimum contrast ratio of 4.5:1 for normal text
- Focus indicators visible on all interactive elements
- Color not used as the only means of conveying information
- Touch targets minimum 44px for mobile
- Screen reader friendly labels and ARIA attributes

## Performance Optimization

### Frontend Performance
- Code splitting and lazy loading for da
- Image optimization through Cloudinaormations
- Caching strategies for API responses
- Debouncing for search and filter operati
- Virtual scrolling for las
load)
- Preloading critical rs)

### Backend Performance
- MongoDB query optimization with proper indexing
- Caching layer for portfolio analysis results
- Connection pooling for GitHub API
based)
- Batch operations for shortn
- CDN integration for static assets 
- Response compression (gzip)

### AI Performance
- Parallel processing for esilural fa for criticertsal-time altions)
- Reabase connec, datmemoryrds (CPU,  dashboaealth- System horing
 monitionctnsatrament trics
- Pay meimings and ttes success ra analysisage)
- AI feature uiews,s (page vior analyticehavr bse- Ular)
misi or rying (Sentlertand atracking )
- Error or ratesmes, erronse ti(respg inmonitornce ormaperfon icati Appl
-Analyticsitoring and # Mon

##ns)tioconnec(max 10 g poolinection tion
- Connmizaline optiiperegation pAgg page)
- ms per iteets (20esult s ror largen fatio
- Pagined fieldsreturno limit ojection tns
- Pry patter quer commonxes forompound inde- Cnce
se Performa# Databaes

##ent analysrgng for non-ussind job procerouckga)
- Baged datyze chanonly re-anallysis (nantal aIncremees
- alysunning anng-rvent loto prets t limiimeou TTL)
- Tses (1 hourb API respong of GitHu- Cachinuations
alevdidate tiple canmul