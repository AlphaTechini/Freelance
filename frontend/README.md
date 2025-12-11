# CryptoGigs Frontend

Frontend application for CryptoGigs platform built with Svelte 5 and SvelteKit.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
   - Firebase configuration
   - API base URL
   - Blockchain RPC URLs

4. Start the development server:
```bash
pnpm dev
```

The app will run on `http://localhost:5173` by default.

## Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/    # Reusable UI components
│   │   ├── services/      # API and external service integrations
│   │   ├── stores/        # Svelte stores for state management
│   │   ├── utils/         # Utility functions and constants
│   │   └── assets/        # Static assets
│   ├── routes/            # SvelteKit routes (pages)
│   ├── app.html           # HTML template
│   └── app.css            # Global styles
├── static/                # Static files
├── .env.example           # Environment variables template
└── package.json           # Dependencies and scripts
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Features

- **Svelte 5**: Latest Svelte with runes for reactivity
- **SvelteKit**: Full-stack framework for Svelte
- **Tailwind CSS**: Utility-first CSS framework
- **Web3 Integration**: Wallet connection and blockchain interactions
- **Firebase Auth**: User authentication
- **Responsive Design**: Mobile-first approach

## Building for Production

To create a production version:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```
