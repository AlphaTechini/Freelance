---
inclusion: always
---
# Kiro Universal Talent Platform — High-Level Build Specification

## Overview
Build a universal talent-matching and portfolio-evaluation platform called **TalentFind**.  
The platform serves **three user types**:
1. Recruiters  
2. Freelancers  
3. Students / Graduates / PhD candidates  

Each user sees a tailored dashboard and workflow, but the core AI and portfolio-analysis capabilities are shared across the platform.

The system must:
- Create detailed user profiles  
- Allow recruiters to post job opportunities  
- Automatically match candidates to job descriptions  
- Rank candidates  
- Allow recruiters to contact or hire candidates  
- Use crypto/token-based test payments (simulated testnet tokens)  
- Provide AI-driven portfolio analysis similar to the reference screenshot  
- Provide actionable improvement suggestions for user portfolios or skillsets  

---

## Core Features

### 1. **User Onboarding**
When a new profile is created, the user selects:  
- **User Type:** Recruiter / Freelancer / Student / Graduate / PhD  
- **Education level** (if applicable)  
- **Years of Experience**  
- **Skills** (tag-based)  
- **Bio**  
- **Portfolio links**, GitHub, personal website, LinkedIn, etc.  
- **Availability** (Months / Full-time / Contract)  

After completion, load a **profile overview sidebar** similar to the reference (image attached by user).

---

### 2. **AI Portfolio & Profile Analysis**
For freelancers and students/graduates/PhDs:

- Fetch and analyze portfolio websites  
- Analyze GitHub repos  
- Evaluate:
  - Code Quality  
  - Project Depth  
  - Portfolio Completeness  
  - Overall Score  
- Provide up to **five specific improvements**, numbered clearly  
- Visualize results using a radar/spider chart (like the screenshot)  

Recruiters do not receive portfolio scoring — they see dashboard metrics instead.

---

### 3. **Jobs & Matching (Recruiter Flow)**
Recruiters can:

- Create new job postings  
- Specify skills, experience, education, compensation, and role type  
- View automatically matched and ranked candidates  

Matching must consider:
- Skills alignment  
- Years of experience  
- Portfolio quality score  
- Education level (if relevant)  
- Availability  

Ranking output:
- Rank 1 → highest match  
- Rank 2, Rank 3, etc.

Matching should be reliable, deterministic, and not break when adding new features.

---

### 4. **Hiring Workflow**
For each candidate in a job match list:

- Show candidate profile card  
- Include two actions:
  1. **Hire**  
  2. **Email (mailto:)**  

#### Hire Button:
- When clicked → mark candidate as “Hired”  
- Automatically generate an email informing them they’ve been selected  
- Use platform’s sender identity (handled by underlying system)  
- Email should be short, clear, professional  
- After this, unlock the "Send Personalized Email" option beneath the status  

#### Email (mailto:)
- Clicking opens Gmail with:
  - `mailto:candidateEmail`
  - Subject prefilled with job title  
  - Body prefilled with a generic invitation  

This allows recruiters to follow up manually if they want.

---

### 5. **Crypto Token Payments (Test Tokens)**
Add a simulated crypto payment feature:

- Test-token transactions only  
- Users can pay freelancers or candidates for tasks, assessments, or bookings  
- Must feel real (wallet connection, balance, transaction confirmation)  
- But operates entirely in safe sandbox/testmode  

This is a **standout killer feature** of the platform.

---

### 6. **Freelancer Mode**
Freelancers have:

- Portfolio scoring page  
- Gig/Task marketplace visibility  
- Ability to receive test-token payments from recruiters  
- Skill tags, availability, work history, years of experience  
- Optional AI review button for portfolio improvement  

---

### 7. **Universal Dashboard Structure**

### **Users: Students/Graduates/PhDs/Freelancers**
Sidebar sections:
- Overview (profile summary)  
- Skills  
- Experience  
- Portfolio Analysis (with radar chart)  
- AI Suggestions  
- Tokens / Payments (earnings, test tokens)  

### **Recruiters**
Sidebar sections:
- Dashboard (overview of postings)  
- Job Listings  
- Candidate Matches  
- Payments (outgoing)  
- Settings  

---

## Visual & UX Notes
- Maintain consistency similar to the provided screenshot  
- Clean, professional layout  
- Purple/blue accent color is fine  
- Use cards, charts, and tabs for clarity  
- Sidebar is always visible  
- Candidate cards should look structured and easy to skim  
- Portfolio analysis page must look polished and dynamic  

---

## Behavior Requirements (Non-Coding Rules)
- Do not remove existing working functionality when adding new features  
- Always preserve the matching logic  
- Maintain user-specific dashboard flows  
- Ask clarifying questions before generating changes when uncertain  
- Ensure new features extend the system, not replace parts of it  

---

## Summary
This specification defines the **features, flows, logic, and UI expectations** for building TalentFind inside the Kiro IDE environment.  
Use this document as contextual guidance when generating components, screens, backend logic, AI functions, or workflow integrations.  
