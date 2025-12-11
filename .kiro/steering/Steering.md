# System Specification – Web3 Freelance Platform with Escrow (Fiverr-style)

## Objective
Design a decentralized freelance platform where clients can post jobs, hire freelancers, and pay in crypto using on-chain escrow smart contracts.  
The frontend runs on **Svelte 5**, backend on **Fastify (latest)**, and data persistence uses **Firestore via the standard Firebase SDK**.  
Smart contracts handle funds locking, release, and dispute resolution.

---

## Required Outputs
Generate the following spec documents inside `/specs`:

1. **ARCHITECTURE.md**
   - Describe all components (frontend, backend, Firestore, smart contracts).
   - Explain user flows (client → contract → freelancer → escrow → payout).
   - Include auth flow (Firebase + JWT).

2. **OPENAPI.yaml**
   - Define all backend REST endpoints:
     - `/auth/*` (Firebase login + JWT issuance)
     - `/jobs/*` (CRUD operations)
     - `/contracts/*` (on-chain interactions)
     - `/users/*` (profile + ratings)
     - `/payments/*` (escrow triggers)
   - Include validation schemas (Fastify style).

3. **ERD.md**
   - Show Firestore collections & subcollections:
     - `users`, `jobs`, `contracts`, `transactions`, `disputes`.
   - Define field types, indexes, and access rules.

4. **SMART_CONTRACTS.md**
   - Define main Solidity contracts:
     - `Escrow.sol` (handles payments, releases, refunds)
     - `DisputeResolver.sol` (optional arbitration logic)
   - Show expected functions, events, and modifiers.
   - Include expected integration flow with backend.

5. **SECURITY.md**
   - Detail authentication and authorization flows.
   - Document safe handling of wallet addresses & signatures.
   - Firestore access rules.
   - Rate limits and JWT expiration policy.

6. **ROADMAP.md**
   - Milestone breakdown:
     - MVP → Escrow flow
     - Phase 2 → Dispute resolution + rating system
     - Phase 3 → Analytics dashboard + automation hooks
   - Include estimated completion order (frontend → backend → contracts → integration).

---

## Additional Constraints
- Use **Fastify’s schema validation** for all endpoints.  
- Use **Firebase Admin SDK only where strictly required** (JWT verification, role checks).  
- Keep **Firestore reads/writes minimal** (batch ops for multiple updates).  
- Integrate **Ethers.js** for signing and executing smart contract functions.  
- Follow the principles in the steering doc for modularity and security.

---

## Development Guidelines

### Package Management
- Always use `pnpm` for all package-related commands (install, add, remove, run, etc.)
- Use `pnpm install` instead of `npm install`
- Use `pnpm add` instead of `npm install <package>`
- Use `pnpm run` instead of `npm run`

### Svelte 5 Syntax
- Always use correct Svelte 5 syntax and features
- Use runes for reactivity ($state, $derived, $effect)
- Use proper component composition patterns
- Follow Svelte 5 best practices for props, events, and state management