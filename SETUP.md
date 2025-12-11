# CryptoGigs Project Setup

This document describes the initial project structure and configuration.

## Project Structure

### Frontend (Svelte 5 + SvelteKit)
```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/       # UI components (created)
│   │   ├── services/         # API, Firebase, Wallet services
│   │   ├── stores/           # Svelte stores for state management
│   │   ├── utils/            # Utility functions (created)
│   │   │   ├── constants.js  # App constants
│   │   │   ├── validation.js # Validation functions
│   │   │   └── formatting.js # Formatting utilities
│   │   └── assets/           # Static assets
│   ├── routes/               # SvelteKit pages
│   ├── app.html
│   └── app.css
├── static/
├── .env.example              # Environment template
├── package.json
├── svelte.config.js
└── vite.config.js
```

### Backend (Fastify + MongoDB)
```
Server/
├── src/
│   ├── middleware/           # Auth, validation, rate limiting
│   ├── models/               # Mongoose models (created)
│   ├── routes/               # API route handlers
│   ├── services/             # Business logic
│   │   ├── database.js       # MongoDB connection (created)
│   │   ├── blockchain.js     # Blockchain interactions
│   │   └── firebase.js       # Firebase integration
│   ├── utils/                # Utility functions
│   │   ├── constants.js      # App constants (created)
│   │   ├── validation.js     # Validation functions (created)
│   │   └── logger.js         # Logging utility
│   └── server.js             # Main server file (updated)
├── .env.example              # Environment template (updated)
├── package.json
└── README.md                 # Updated documentation
```

## Key Technologies

### Frontend
- **Svelte 5**: Latest version with runes
- **SvelteKit**: Full-stack framework
- **Tailwind CSS**: Utility-first styling
- **Ethers.js**: Blockchain interactions
- **Firebase**: Authentication
- **Wagmi/Viem**: Web3 wallet connections

### Backend
- **Fastify**: High-performance web framework
- **MongoDB**: Database (via Mongoose ODM)
- **Ethers.js**: Blockchain interactions
- **JWT**: Token-based authentication
- **Rate Limiting**: API protection
- **CORS**: Cross-origin support

## Configuration Files Created/Updated

1. **Server/src/services/database.js** - MongoDB connection service
2. **Server/src/utils/constants.js** - Backend constants
3. **Server/src/utils/validation.js** - Backend validation utilities
4. **frontend/src/lib/utils/constants.js** - Frontend constants
5. **frontend/src/lib/utils/validation.js** - Frontend validation utilities
6. **frontend/src/lib/utils/formatting.js** - Frontend formatting utilities
7. **Server/.env.example** - Updated with MongoDB configuration
8. **Server/src/server.js** - Updated with MongoDB integration

## Environment Variables

### Frontend (.env)
- Firebase configuration (API key, project ID, etc.)
- API base URL
- Blockchain RPC URLs
- Environment mode

### Backend (.env)
- Server configuration (port, host)
- MongoDB connection string
- JWT secret
- Firebase project ID
- Blockchain RPC URLs
- External API keys (CoinGecko, Etherscan, etc.)
- Rate limiting settings

## Next Steps

1. Configure environment variables in both `.env` files
2. Set up MongoDB instance (local or cloud)
3. Configure Firebase project
4. Implement authentication system (Task 2)
5. Build user management features (Task 3)

## Running the Projects

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```
Runs on http://localhost:5173

### Backend
```bash
cd Server
pnpm install
pnpm dev
```
Runs on http://localhost:3000

## Dependencies Installed

### Backend
- fastify
- @fastify/cors
- @fastify/rate-limit
- @fastify/jwt
- @fastify/multipart
- mongoose (MongoDB ODM)
- ethers
- axios
- dotenv

### Frontend
- svelte 5
- @sveltejs/kit
- tailwindcss
- ethers
- firebase
- wagmi
- viem
- @tanstack/svelte-query
