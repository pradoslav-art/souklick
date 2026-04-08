# Souklick

## Overview

Souklick is a review management platform for UAE-based multi-location restaurant groups. It aggregates Google, Zomato, and TripAdvisor reviews into one unified dashboard and uses AI (Claude) to draft personalized, on-brand responses. Built as a pnpm monorepo with TypeScript.

## Architecture

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (wouter routing, @tanstack/react-query, framer-motion, recharts)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: express-session + connect-pg-simple + bcryptjs
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **AI**: Anthropic Claude (via Replit AI Integrations proxy)

## Artifacts

### `artifacts/souklick` (`@workspace/souklick`)
React + Vite frontend at `/` (root preview path).
- Login/Register with session auth
- Unified review dashboard with filters (platform, location, rating, status)
- Priority queue for negative reviews (1-3 stars, oldest first)
- AI response generation via Claude
- Multi-location management
- Analytics dashboard (summary, 90-day trend, platform breakdown)
- Brand voice settings
- Notification preferences

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts session, CORS, JSON parsing, routes at `/api`
- Auth: session-based with `express-session` + PostgreSQL session store
- Routes: auth, organizations, locations, reviews, responses, AI, analytics, notifications

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── souklick/           # React + Vite frontend
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **organizations** — Restaurant group with brand voice settings
- **users** — Staff/managers with roles and notification prefs
- **locations** — Individual restaurant locations
- **reviews** — Reviews from all platforms (google, zomato, tripadvisor)
- **responses** — AI-drafted and approved responses
- **user_sessions** — PostgreSQL session store

## Demo Account

- Email: `fatima@saffronkitchen.ae`
- Password: `demo1234`
- Org: Saffron Kitchen Group (3 locations, 10 seeded reviews)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Packages

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- Push migrations: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI spec (`openapi.yaml`) and Orval config. Run codegen:
`pnpm --filter @workspace/api-spec run codegen`

## Deployment Notes

- **Vite outDir**: Must be `dist/public` (relative to souklick artifact). The deployment static handler serves from `artifacts/souklick/dist/public`.
- **Express 5 routes**: Catch-all routes use `/*splat` (not bare `*`).
- **Trust proxy**: `app.set("trust proxy", 1)` is required for secure session cookies behind Replit's proxy.
- **API client credentials**: `credentials: "include"` in custom-fetch ensures cookies are sent with every API request.
- **runtimeErrorOverlay**: Must be development-only in vite.config.ts — it injects dev WebSocket code that fails in production.
- **NODE_ENV**: Explicitly set to `"production"` in artifact.toml `[services.production.build.env]`.
- **PORT**: Do NOT hardcode in artifact.toml production env — Replit Autoscale injects PORT dynamically.
- **Custom domain**: souklick.com

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Express session secret
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Replit AI proxy base URL
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Replit AI proxy API key
- `ADMIN_EMAIL` — Email address for superadmin access (currently `souklickuae@gmail.com`)
