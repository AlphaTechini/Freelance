# Kiro Talent Engine Implementation Plan

- [-] 1. Set up project structure and authentication





- [x] 1.1 Initialize project and configure wallet-based authentication


  - Set up Svelte 5 frontend with JavaScript
  - Configure Fastify backend with JavaScript
  - Integrate Web3 wallet connection (MetaMask, WalletConnect)
  - Implement nonce-based signature verification for authentication
  - Create role-based registration flow (Freelancer, Recruiter, Student, Graduate, PhD)
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 1.2 Implement user profile system




  - Create MongoDB user and profile collections with username and wallet address
  - Build profile creation forms with role-specific fields
  - Implement username uniqueness validation
  - Implement profile image upload to Cloudinary
  - Store wallet address as primary authentication method
  - _Requirements: 1.2, 1.3, 1.4_

- [ ]* 1.3 Write authentication tests
  - Unit tests for wallet signature verification
  - Username uniqueness validation tests
  - Profile creation validation tests
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement AI Portfolio Analysis System



- [x] 2.1 Build portfolio analyzer backend service




  - Create portfolio scraping service for extracting project data
  - Integrate GitHub API for repository analysis
  - Implement scoring algorithms (Code Quality, Project Depth, Portfolio Completeness)
  - Build improvement suggestion generator (3-5 suggestions)
  - Store analysis results in MongoDB
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.1, 11.2_


- [x] 2.2 Create portfolio analysis UI components


  - Build ProfileSidebar.svelte with candidate information
  - Create PortfolioAnalysis.svelte with radar chart visualization
  - Implement ImprovementSuggestions.svelte component
  - Add "Re-analyze Portfolio" button functionality
  - _Requirements: 2.5, 8.1, 8.2, 8.3_

- [ ]* 2.3 Write portfolio analysis tests
  - Unit tests for scoring algorithms
  - URL validation tests
  - GitHub API integration tests
  - _Requirements: 2.1, 2.2, 11.2_

- [ ] 3. Implement Job Posting and Matching System
- [x] 3.1 Create job posting functionality

  - Build JobPostingForm.svelte component
  - Implement job posting API endpoints (create, read, update, delete)
  - Create job posting data models in MongoDB
  - Build recruiter dashboard for managing job postings
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.2 Build AI matching engine







  - Implement match score calculation algorithm with weighted components:
    - Skill alignment (35%)
    - Experience match (20%)
    - Portfolio depth (20%)
    - Education alignment (10%)
    - GitHub activity (10%)
    - Availability fit (5%)
  - Create shortlist generation service
  - Build match explanation generator
  - _Requirements: 4.1, 4.2, 4.5, 11.3_

- [x] 3.3 Create candidate matching UI




  - Build CandidateCard.svelte component
  - Create ShortlistView.svelte with ranked candidates
  - Implement MatchExplanation.svelte component
  - Add filtering and sorting options
  - _Requirements: 4.3, 4.4_

- [ ]* 3.4 Write matching system tests
  - Unit tests for match score calculations
  - Shortlist ordering validation tests
  - Match score component weight tests
  - _Requirements: 4.2, 11.3_



- [ ] 4. Implement Hiring and Payment System
- [ ] 4.1 Build hiring workflow
  - Implement "Hire" button functionality
  - Create automated email generation for job offers
  - Build mailto: link integration for personalized emails
  - Update candidate status tracking
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.2 Create test token payment system
  - Build PaymentModal.svelte component
  - Implement simulated test token transactions (ETH, USDC, KIRO)
  - Create payment logging and metadata tracking
  - Build transaction confirmation UI
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.3 Implement earnings dashboard
  - Create wallet dashboard showing earnings by token type
  - Build transaction history view
  - Implement earnings charts and visualizations
  - Add real-time earnings updates
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 4.4 Write payment system tests
  - Payment transaction integrity tests
  - Earnings accumulation tests
  - Wallet address uniqueness tests
  - _Requirements: 6.3, 6.4, 7.1, 7.2_

- [ ] 5. Build Dashboard and Analytics
- [ ] 5.1 Create candidate dashboard
  - Implement fixed sidebar with profile overview
  - Build portfolio analysis page with radar chart
  - Create earnings and payment history views
  - Add profile editing functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5.2 Create recruiter dashboard
  - Build job postings overview with status indicators
  - Implement candidate matches view
  - Create payment history for recruiters
  - Add navigation between sections
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 5.3 Write dashboard tests
  - Profile sidebar data consistency tests
  - Real-time update tests
  - Dashboard navigation tests
  - _Requirements: 8.4, 9.1_

- [ ] 6. Implement UI/UX and Styling
- [ ] 6.1 Set up design system
  - Create CSS custom properties for purple/blue theme
  - Implement Inter font family and typography scale
  - Build base component styles (buttons, cards, forms, inputs)
  - Create RadarChart.svelte component
  - _Requirements: 10.3_

- [ ] 6.2 Implement responsive design
  - Set up responsive breakpoints (320px to 1920px)
  - Optimize layouts for mobile, tablet, and desktop
  - Implement smooth transitions and animations
  - Create loading skeleton components
  - _Requirements: 10.1, 10.2, 10.4_

- [ ] 6.3 Build landing page and navigation
  - Create landing page with role selection
  - Build Navbar.svelte component
  - Implement RoleSelector.svelte component
  - Add protected route guards
  - _Requirements: 1.1, 10.5_

- [ ]* 6.4 Write UI/UX tests
  - Responsive design tests
  - Component rendering tests
  - Animation and transition tests
  - _Requirements: 10.1, 10.2_

- [ ] 7. System Integration and Deployment
- [ ] 7.1 Integrate all components
  - Connect frontend with all backend services
  - Implement end-to-end user workflows
  - Test complete candidate and recruiter journeys
  - Ensure AI analysis and matching work together
  - _Requirements: All requirements_

- [ ] 7.2 Set up monitoring and logging
  - Implement error tracking and logging
  - Add AI analysis request logging
  - Create system health checks
  - _Requirements: 11.5_

- [ ] 7.3 Configure deployment
  - Set up Vercel deployment for frontend
  - Configure backend deployment (Render/Cloud Run)
  - Set production environment variables
  - Test production deployment
  - _Requirements: All requirements_

- [ ]* 7.4 Write integration tests
  - End-to-end user journey tests
  - Cross-browser compatibility tests
  - Production deployment validation
  - _Requirements: All requirements_

---

## Optional: Gig Marketplace Features

- [ ]* 8. Implement gig marketplace (Optional)
- [ ]* 8.1 Create gig management system
  - Build gig creation forms with pricing tiers
  - Implement gig browsing and search
  - Create gig detail pages
  - Add real-time price conversion
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 8.2 Implement order and escrow system
  - Create order management workflow
  - Build escrow payment system
  - Implement order status tracking
  - Add order completion and review flow
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ]* 8.3 Build messaging system
  - Create real-time messaging interface
  - Implement message threads for orders
  - Add file attachment support
  - Build notification system
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 8.4 Integrate gig marketplace with profiles
  - Add gig showcase to freelancer profiles
  - Create unified dashboard with gigs and jobs tabs
  - Implement separate transaction histories
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]* 8.5 Write gig marketplace tests
  - Gig creation and management tests
  - Order workflow tests
  - Escrow system tests
  - Messaging system tests
  - _Requirements: 12-17_
