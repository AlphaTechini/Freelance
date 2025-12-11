# Kiro Talent Engine Requirements Document

## Introduction

Kiro Talent Engine is a universal AI-powered talent platform connecting recruiters with freelancers, students, graduates, and PhD candidates. The platform uses intelligent portfolio analysis, automated candidate matching, and crypto-native test token payments to create a transparent, fair, and efficient hiring ecosystem. Unlike traditional platforms, Kiro uses AI to evaluate portfolios, GitHub repositories, and work history to provide objective skill assessments and match candidates with opportunities based on comprehensive analysis rather than just keywords. The platform uses MongoDB for data persistence and wallet-based authentication for secure, decentralized user access. The platform may optionally include a gig marketplace to showcase freelancer work.

## Glossary

- **Kiro_System**: The complete talent platform including frontend, backend, AI engine, and MongoDB database components
- **Freelancer**: A user who creates a professional profile showcasing skills, portfolio, and work history to be discovered by recruiters
- **Recruiter**: A user who posts job opportunities and searches for qualified candidates using AI-powered matching
- **Student**: A user currently pursuing education who creates a profile to be discovered for internships or entry-level positions
- **Graduate**: A user who has completed undergraduate education and is seeking career opportunities
- **PhD_Candidate**: A user with advanced academic credentials seeking specialized research or technical positions
- **AI_Portfolio_Analyzer**: The system component that evaluates portfolio websites and GitHub repositories to generate skill scores
- **AI_Matching_Engine**: The system component that ranks candidates against job requirements using multi-factor scoring
- **Profile_Score**: A numerical assessment (0-100) of a candidate's portfolio quality, code quality, and project depth
- **Match_Score**: A percentage indicating how well a candidate aligns with a specific job posting
- **Test_Token**: Simulated cryptocurrency used for payment transactions on testnet (ETH, USDC, KIRO tokens)
- **Crypto_Wallet**: A connected blockchain wallet for receiving and sending test token payments
- **Job_Posting**: A recruiter-created opportunity specifying required skills, experience, education, and budget
- **Shortlist**: An AI-generated ranked list of candidates matching a job posting's requirements
- **Username**: A unique identifier chosen by the user during registration for authentication purposes
- **Wallet_Address**: The blockchain address used for authentication and payment transactions

## Requirements

### Requirement 1

**User Story:** As a new user, I want to select my role and create a profile with relevant information, so that the platform can provide me with tailored experiences and opportunities.

#### Acceptance Criteria

1. WHEN a user initiates registration, THE Kiro_System SHALL present role selection options (Freelancer, Recruiter, Student, Graduate, PhD_Candidate)
2. THE Kiro_System SHALL collect role-specific profile information including name, bio, skills, education level, and years of experience
3. WHEN a Freelancer, Student, Graduate, or PhD_Candidate registers, THE Kiro_System SHALL collect portfolio URL, GitHub URL, and availability information
4. WHEN a user completes registration, THE Kiro_System SHALL connect the user's Crypto_Wallet for receiving Test_Token payments
5. THE Kiro_System SHALL authenticate users using username and wallet connection stored in MongoDB

### Requirement 2

**User Story:** As a freelancer, student, graduate, or PhD candidate, I want AI-powered analysis of my portfolio and GitHub, so that I can receive objective skill assessments and improvement suggestions.

#### Acceptance Criteria

1. WHEN a candidate clicks the analyze button, THE Kiro_System SHALL visit the provided portfolio URL and GitHub URL
2. THE Kiro_System SHALL extract project information including file structure, README quality, tech stacks, deployment links, and last activity
3. THE Kiro_System SHALL calculate a Profile_Score based on code quality, project depth, and portfolio completeness
4. THE Kiro_System SHALL generate three to five specific improvement suggestions for the candidate's profile
5. THE Kiro_System SHALL display the Profile_Score and metrics using a radar chart visualization

### Requirement 3

**User Story:** As a recruiter, I want to create job postings with specific requirements, so that the AI can automatically match and rank qualified candidates.

#### Acceptance Criteria

1. WHEN a recruiter creates a Job_Posting, THE Kiro_System SHALL collect job title, description, required skills, minimum years of experience, education preference, role type, and budget
2. THE Kiro_System SHALL allow recruiters to specify the number of candidates to include in the automatic Shortlist
3. WHEN a Job_Posting is created, THE Kiro_System SHALL store the posting in the database with active status
4. THE Kiro_System SHALL display all active Job_Postings in the recruiter's dashboard
5. THE Kiro_System SHALL allow recruiters to edit or deactivate Job_Postings

### Requirement 4

**User Story:** As a recruiter, I want AI-powered candidate matching and ranking, so that I can quickly identify the most qualified candidates for my job postings.

#### Acceptance Criteria

1. WHEN a Job_Posting is created, THE Kiro_System SHALL evaluate all candidate profiles using the AI_Matching_Engine
2. THE Kiro_System SHALL calculate Match_Score for each candidate based on skill alignment (35%), experience years (20%), portfolio depth (20%), education alignment (10%), GitHub activity (10%), and availability fit (5%)
3. THE Kiro_System SHALL generate a ranked Shortlist of candidates ordered by Match_Score from highest to lowest
4. THE Kiro_System SHALL display candidate cards showing name, skills, Match_Score, experience years, education level, portfolio link, and GitHub link
5. THE Kiro_System SHALL provide match explanations highlighting each candidate's strengths relative to the job requirements

### Requirement 5

**User Story:** As a recruiter, I want to hire candidates and send them personalized emails, so that I can efficiently communicate job offers and next steps.

#### Acceptance Criteria

1. WHEN a recruiter views a candidate in a Shortlist, THE Kiro_System SHALL display Hire and Email action buttons
2. WHEN a recruiter clicks Hire, THE Kiro_System SHALL mark the candidate as hired for that Job_Posting
3. WHEN a candidate is hired, THE Kiro_System SHALL generate an automated email informing them of selection
4. WHEN a recruiter clicks Email, THE Kiro_System SHALL open the default email client with a pre-filled mailto link containing the candidate's email, job title as subject, and a generic invitation message
5. THE Kiro_System SHALL allow recruiters to send personalized follow-up emails after hiring a candidate

### Requirement 6

**User Story:** As a recruiter, I want to pay candidates using test tokens, so that I can simulate real crypto payments for assessments, bookings, or task completion.

#### Acceptance Criteria

1. WHEN a recruiter clicks Pay on a candidate card, THE Kiro_System SHALL display a payment modal with token type selection (ETH testnet, USDC testnet, KIRO test token)
2. THE Kiro_System SHALL allow recruiters to enter a payment amount in the selected Test_Token
3. WHEN a recruiter confirms payment, THE Kiro_System SHALL execute the simulated transaction and update both user dashboards
4. THE Kiro_System SHALL log payment metadata including token type, amount, Job_Posting ID, candidate ID, and timestamp
5. THE Kiro_System SHALL display transaction confirmation with a unique transaction identifier

### Requirement 7

**User Story:** As a candidate, I want to view my earnings and payment history, so that I can track test token payments received from recruiters.

#### Acceptance Criteria

1. THE Kiro_System SHALL display total earnings by Test_Token type in the candidate's wallet dashboard
2. THE Kiro_System SHALL show a chronological payment list with token type, amount, sender, Job_Posting reference, and timestamp
3. THE Kiro_System SHALL update earnings instantly when a payment is received
4. THE Kiro_System SHALL display the candidate's auto-generated Crypto_Wallet address
5. THE Kiro_System SHALL provide a breakdown of earnings by token type with visual charts

### Requirement 8

**User Story:** As a candidate, I want a comprehensive profile sidebar and analytics dashboard, so that I can view my professional information and AI-generated metrics at a glance.

#### Acceptance Criteria

1. THE Kiro_System SHALL display a fixed sidebar containing avatar, name, major/field, education badge, university, portfolio link, GitHub link, availability, years of experience, skills tags, bio, and work history
2. THE Kiro_System SHALL show AI profile metrics including Overall Score, Code Quality, Project Depth, and Portfolio Completeness in a radar chart
3. THE Kiro_System SHALL provide action buttons for re-analyzing portfolio, editing profile, withdrawing earnings, and viewing payment history
4. THE Kiro_System SHALL update the sidebar and analytics in real-time when profile changes are saved
5. THE Kiro_System SHALL maintain the sidebar visibility across all candidate dashboard pages

### Requirement 9

**User Story:** As a recruiter, I want a dashboard to manage my job postings and view candidate matches, so that I can efficiently track my hiring activities.

#### Acceptance Criteria

1. THE Kiro_System SHALL display an overview of all Job_Postings with status indicators (active, filled, closed)
2. THE Kiro_System SHALL show the number of matched candidates for each Job_Posting
3. THE Kiro_System SHALL provide quick access to view Shortlists for each Job_Posting
4. THE Kiro_System SHALL display outgoing payment history with candidate names and amounts
5. THE Kiro_System SHALL allow recruiters to navigate between job listings, candidate matches, payments, and settings sections

### Requirement 10

**User Story:** As a platform user, I want a clean, modern interface with smooth transitions and responsive design, so that I can have an excellent user experience across all devices.

#### Acceptance Criteria

1. THE Kiro_System SHALL provide a mobile-responsive layout that adapts to screen sizes from 320px to 1920px
2. THE Kiro_System SHALL implement smooth transitions for page navigation, modal displays, and component interactions
3. THE Kiro_System SHALL use a consistent purple/blue accent color scheme throughout the interface
4. THE Kiro_System SHALL display loading states with skeleton components during data fetching
5. THE Kiro_System SHALL maintain a fixed sidebar for candidates and a clean navigation structure for recruiters

### Requirement 11

**User Story:** As a system administrator, I want deterministic AI behavior and data integrity, so that the platform provides reliable and accurate results.

#### Acceptance Criteria

1. THE Kiro_System SHALL use real data from visited portfolio URLs and GitHub repositories for AI analysis
2. THE Kiro_System SHALL validate URLs before initiating AI portfolio analysis
3. THE Kiro_System SHALL ensure Match_Score calculations are deterministic and reproducible for the same inputs
4. THE Kiro_System SHALL preserve existing functionality when new features are added
5. THE Kiro_System SHALL log all AI analysis requests and results for audit and debugging purposes

