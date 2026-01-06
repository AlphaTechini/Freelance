# Requirements for Full Functionality

This document outlines the external services, tokens, and configurations needed for the TalentFind platform to work at full capacity.

## 🔑 Required API Keys & Tokens

### 1. GitHub OAuth / Personal Access Token
**Purpose:** Portfolio analysis, repository scanning, anti-gaming detection, LLM-ready scoring

**How it works:**
- Users can connect their GitHub account via OAuth for private repo access
- Server-side token enables analysis of public repos without user auth
- Enhanced metrics include: activity scores, collaboration signals, quality indicators, gaming detection

#### Option A: GitHub OAuth App (Recommended for Production)
1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name:** TalentFind (or your app name)
   - **Homepage URL:** Your frontend URL
   - **Authorization callback URL:** `https://your-backend.com/auth/github/callback`
4. After creation, note the **Client ID**
5. Generate a new **Client Secret**

**Environment Variables:** (in `Server/.env`)
```
GITHUB_CLIENT_ID=your_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_oauth_app_client_secret
```

#### Option B: Personal Access Token (For Server-side Analysis)
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set expiration (recommend 1 year)
4. **Required scopes:**
   - `public_repo` - Access public repositories
   - `read:user` - Read user profile information
   - `repo` - Full access to private repos (if analyzing user's own repos)

**Environment Variable:** `GITHUB_TOKEN`
**Location:** `Server/.env`

> ⚠️ **Rate Limits:** Without a token, you get 60 requests/hour. With a token, you get 5,000 requests/hour.

### 2. Gemini API Key (Google AI)
**Purpose:** AI-powered portfolio analysis, improvement suggestions, and job matching

**How to get:**
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Navigate to API keys section
4. Generate a new API key

**Environment Variable:** `GEMINI_API_KEY`
**Location:** `Server/.env`

### 3. MongoDB Database
**Purpose:** User profiles, job postings, portfolio analysis results

**Options:**
- **MongoDB Atlas (Recommended):** Free tier available
  1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
  2. Create account and cluster
  3. Get connection string
- **Local MongoDB:** Install locally for development

**Environment Variable:** `MONGODB_URI`
**Current:** `mongodb://localhost:27017/meritstack`
**Location:** `Server/.env`

### 4. JWT Secret Key
**Purpose:** Secure JWT token signing for user authentication

**How to set:**
1. Generate a strong random string (32+ characters)
2. Use a secure password generator or command: `openssl rand -base64 32`

**Environment Variable:** `JWT_SECRET`
**Location:** `Server/.env`
**Example:** `JWT_SECRET=your-super-secure-random-string-here`

### 5. Cloudinary (Image Uploads)
**Purpose:** Profile pictures and portfolio image uploads

**How to get:**
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get credentials from Dashboard

**Environment Variables:** (in `Server/.env`)
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🌐 Deployment URLs

### Production URLs
Update these in your `.env` files when deploying:

**Frontend:** `frontend/.env`
```
VITE_API_BASE_URL=https://your-backend-domain.com
```

**Backend:** `Server/.env`
```
FRONTEND_URL=https://your-frontend-domain.com
```

### Current Deployment URLs
- **Frontend:** https://freelance-orpin-omega.vercel.app/
- **Backend:** https://freelance-45tf.onrender.com

## 🔧 Optional Enhancements

### 1. BNB Smart Chain Testnet Configuration
**Purpose:** Crypto payment functionality using BNB Smart Chain Testnet

**Network Details:**
- **Network Name:** BNB Smart Chain Testnet
- **RPC URL:** https://data-seed-prebsc-1-s1.binance.org:8545 (or https://data-seed-prebsc-2-s1.binance.org:8545)
- **Chain ID:** 97 (0x61 in hexadecimal)
- **Currency Symbol:** tBNB (Testnet BNB)
- **Block Explorer:** https://testnet.bscscan.com

**Environment Variables:** (in `frontend/.env`)
```
VITE_BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
VITE_BSC_TESTNET_CHAIN_ID=97
VITE_BSC_TESTNET_CURRENCY_SYMBOL=tBNB
VITE_BSC_TESTNET_EXPLORER_URL=https://testnet.bscscan.com
```

**Getting Testnet BNB:**
1. Visit [BNB Smart Chain Testnet Faucet](https://testnet.binance.org/faucet-smart)
2. Connect your wallet
3. Request testnet BNB tokens for testing

### 2. Email Service (SendGrid/Mailgun)
**Purpose:** Automated hiring emails and notifications

**How to get:**
1. Sign up for [SendGrid](https://sendgrid.com) or [Mailgun](https://mailgun.com)
2. Get API key and configure sender domain

### 3. Analytics (Google Analytics, Mixpanel)
**Purpose:** User behavior tracking and platform analytics

## 🚀 Quick Setup Checklist

### Minimum Required (for basic functionality):
- [ ] MongoDB connection (local or Atlas)
- [ ] JWT Secret Key (strong random string)
- [ ] Update deployment URLs in .env files

### For Full AI Features:
- [ ] GitHub Personal Access Token
- [ ] InvokeLLM API Key (Visualyze.ai)
- [ ] Cloudinary for image uploads

### For Production:
- [ ] All of the above
- [ ] Proper domain configuration
- [ ] SSL certificates (handled by Vercel/Render)
- [ ] Environment-specific configurations

## 📝 Notes

1. **Security:** Never commit real API keys to version control
2. **Environment:** Use different keys for development/staging/production
3. **Monitoring:** Set up alerts for API usage limits
4. **Backup:** Keep backup copies of important configurations
5. **Rotation:** Regularly rotate API keys for security

## 🆘 Troubleshooting

### Common Issues:
1. **GitHub API Rate Limits:** Use authenticated requests with token
2. **MongoDB Connection:** Check network access and credentials
3. **JWT Authentication:** Ensure JWT_SECRET is set and tokens are valid
4. **CORS Errors:** Ensure frontend URL is added to backend CORS settings

### Testing Connectivity:
```bash
# Test MongoDB connection
pnpm run test:db

# Test GitHub API
curl -H "Authorization: token YOUR_GITHUB_TOKEN" https://api.github.com/user

# Test backend health
curl https://your-backend-url.com/health
```

---

**Last Updated:** December 15, 2025
**Platform:** TalentFind (Kiro Universal Talent Platform)