# CryptoGigs Backend

A Fastify-based backend API for the CryptoGigs decentralized freelance marketplace.

## Features

- **Fastify Framework**: High-performance web framework
- **MongoDB Database**: Using Mongoose ODM for data persistence
- **Firebase Authentication**: User authentication
- **Blockchain Support**: Ethereum and Polygon network integration
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API protection against abuse
- **CORS Support**: Cross-origin resource sharing
- **File Upload**: Multipart form data handling

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- MongoDB (local or cloud instance)
- Firebase project setup (for aut)hentication

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`

4. Start the development server:
```bash
pnpm dev
```

The server will start on `http://localhost:3000`

### Available Scripts

- `pnpm dev` - Start development server with auto-reload
- `pnpm start` - Start production server
- `pnpm test` - Run tests

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Test Endpoints
- `GET /api/test` - API connectivity test
- `GET /auth/test` - Authentication routes test

## Environment Variables

See `.env.example` for all required environment variables.

## Project Structure

```
src/
├── server.js          # Main server file
├── routes/            # API route handlers
├── services/          # Business logic services
├── middleware/        # Custom middleware
└── utils/            # Utility functions
```