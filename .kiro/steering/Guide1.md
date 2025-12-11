---
inclusion: always
---
# Kiro Steering Document — Universal Talent & Opportunity Platform
*A complete and authoritative system blueprint for Kiro.*

---

# 1. Platform Identity
**Name:** Kiro Talent Engine  
**Mission:** A universal AI-powered talent platform connecting recruiters and freelancers, enabling AI-driven evaluations, matching, and hiring — now with integrated token-based payment flows.

Kiro embodies:
- Intelligence  
- Transparency  
- Fairness  
- Skill recognition  
- AI-assisted career growth  
- Multi-role support  
- Crypto-native logic  

---

# 2. User Roles

## 2.1 Freelancer
Freelancers create professional profiles including:
- Full name  
- Headshot or avatar  
- Bio  
- Country  
- Skills (tags)  
- Years of Experience  
- Education Level (Student / Graduate / PhD)  
- Portfolio URL  
- GitHub URL  
- Work history entries  
- Availability period  
- Resume upload (optional)  
- “Publish Profile” toggle  
- Sidebar overview (see UI section)  
- Crypto wallet auto-generated for payments  

Freelancer features:
- AI Portfolio Review  
- AI Suggestions (3–5 specific improvements)  
- Earnings dashboard  
- Token-based payment receiving  
- Transaction history  
- Full profile analytics and score charts  

---

## 2.2 Recruiter
Recruiters can:
- Create job listings  
- Specify required skills  
- Experience level  
- Education preference  
- Budget (test tokens)  
- Role type  
- Number of candidates to shortlist  
- View ranked candidates  
- View detailed profiles  
- Pay candidates using test tokens  
- See payment history  
- Send mail via auto-filled email drafts  
- Access job analytics  

Recruiter features:
- One-click Hire  
- One-click Pay Candidate  
- Automatic shortlist generation  
- AI-assisted ranking  

---

# 3. Crypto Payments (Killer Feature)
Kiro enables **crypto-native payments** using **testnet tokens**, eliminating friction between recruiter and freelancer.

Payment Flow:
1. Recruiter clicks **Pay**  
2. Chooses token type (ETH testnet, USDC testnet, or KIRO test token)  
3. Enters amount  
4. Transaction executes  
5. UI updates  
6. Transaction is logged into both dashboards  

Metadata logged:
- Token type  
- Amount  
- Job ID  
- Candidate ID  
- Timestamp  

---

# 4. Global Platform Flow

## 4.1 Landing Page
Sections:
- Hero banner  
- Role selection: Freelancer / Recruiter  
- Explanation cards  
- AI features overview  
- CTA buttons  

---

# 5. Profile Creation

## 5.1 Freelancer Fields
Sidebar-style structured profile similar to your layout:

Sidebar Contains:
- Name  
- Major / field of study  
- Education level badge  
- University  
- Portfolio link  
- GitHub link  
- Availability  
- Years of experience  
- Skills  
- Bio  
- Work history  

Profile analytics visible on the right:
- AI Profile Metrics:
  - Overall Score  
  - Code Quality  
  - Project Depth  
  - Portfolio Completeness  
- Radar chart view  

---

# 6. Freelancer Dashboard

Layout:
- Left Sidebar (Profile Overview)  
- Center Panel (Main actions)  
- Right panel (AI Analysis)

Buttons:
- Re-analyze portfolio  
- Edit profile  
- Withdraw earnings  
- Payment history  
- Update skills  

---

# 7. Recruiter Dashboard

## 7.1 Job Posting Form
Fields:
- Job title  
- Description  
- Required skills  
- Minimum years of experience  
- Education preference  
- Role type  
- Budget  
- Number of auto-shortlisted candidates  

## 7.2 Candidate Shortlisting
Kiro AI evaluates all freelancers and ranks them.

Match Score Formula:
match_score =
(skill_match * 0.35) +
(experience_years_match * 0.20) +
(portfolio_depth * 0.20) +
(education_alignment * 0.10) +
(github_activity * 0.10) +
(availability_fit * 0.05)


Each candidate card shows:
- Name  
- Skills  
- Match score  
- Experience years  
- Education level  
- Portfolio  
- GitHub  
- Buttons: View Profile / Hire / Pay / Email  

---

# 8. AI Engine Behaviors

## 8.1 Portfolio Analysis AI
When “Re-analyze” is clicked, AI:
- Visits the Portfolio URL  
- Visits GitHub URL  
- Extracts:
  - File structure  
  - README quality  
  - Last activity  
  - Tech stacks  
  - Deployment links  
  - Project complexity  
- Returns:
  - Profile score  
  - 3–5 improvement points  

---

## 8.2 Matching AI
Compares:
- Skills vs required skills  
- Years of experience  
- Education fit  
- Portfolio contents  
- Project depth  
- Repo complexity  
- Work history relevance  
- Availability window  

Outputs:
- Ranked candidate list  
- Match explanations  
- Highlighted strengths  

---

# 9. Crypto Payment Integration Rules

Recruiter → Freelancer:
- Use test tokens  
- Validate amounts  
- Show confirmation  
- Record transaction  
- Update “Earnings” instantly  
- Show alert after transfer  

Freelancer Dashboard:
- Shows total earnings  
- Shows token breakdown  
- Shows chronological payment list  

---

# 10. UI/UX Rules

## Sidebar (Freelancer)
Exact structure:
- Avatar  
- Name  
- Major / field  
- Education badge  
- University  
- Portfolio  
- GitHub  
- Availability  
- Years of Experience  
- Skills (tags)  
- Bio  
- Work history  

## Color & Layout Guidelines
- Clean modern layout  
- Left sidebar fixed  
- Center content scrollable  
- Right analysis panel dynamic  
- Smooth transitions  

---

# 11. System-Level Behavior

- All changes reflect immediately  
- AI analysis must use real visited data  
- No hallucinated projects  
- URLs must be validated before running analysis  
- Payments simulate full Web3 flow  
- Kiro’s agent must be deterministic in responses  
- Do not break the previous functionality when adding new features  

---

# 12. Build Order (Recommended)
1. Landing Page  
2. Role Select Page  
3. Sign-up Flow  
4. Freelancer Profile Builder  
5. Sidebar Overview  
6. AI Portfolio Review System  
7. Recruiter Job System  
8. AI Matching Engine  
9. Payment System (test tokens)  
10. Final Dashboards  
11. Deployment  

---

# End of Kiro Steering Document
