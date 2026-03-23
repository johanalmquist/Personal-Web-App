# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a **greenfield project** — only the PRD and issue plan exist so far. No code has been written yet. Refer to `PRD.md` for full requirements and `issue-order.md` for the recommended implementation sequence.

## Tech Stack

**Backend (`apps/api`):** Bun + Hono + Zod + OpenAPI/Scalar + Supabase
**Frontend (`apps/web`):** React + Vite + TypeScript + Mantine UI + Tanstack (Query, Table, Router) + PWA
**Shared (`packages/types`):** Zod schemas shared between API and client
**Tooling:** Turborepo, Biome + Ultracite

## Planned Monorepo Structure

```
apps/api/          # Hono backend (Bun runtime)
apps/web/          # React + Vite frontend (PWA)
packages/types/    # Shared Zod schemas and TypeScript types
packages/ui/       # Shared UI components (if needed)
packages/config/   # Shared Biome/tsconfig configs
turbo.json
docker-compose.yml
```

## Commands (to be configured)

Once set up, standard Turborepo commands will apply:

```bash
bun install              # Install all dependencies
bun run dev              # Start all apps in dev mode (via Turborepo)
bun run build            # Build all apps
bun run lint             # Biome lint
bun run format           # Biome format
bun run typecheck        # TypeScript check across all packages
```

Within a specific app:
```bash
cd apps/api && bun run dev
cd apps/web && bun run dev
```

## Architecture Principles

**Single source of truth:** The API is authoritative. The frontend never calls Supabase directly for business data — all access goes through the Hono API.

**Exception:** Supabase Auth client SDK is used on the frontend for session management (sign in, sign out, token refresh) only.

**Auth flow:** JWT from Supabase Auth → validated by middleware on every API request → role read from `user_profiles` table → enforced server-side on mutations.

**Data isolation:** Monthly budgets are snapshots — creating a monthly budget copies master budget data at that point in time. Later changes to the master budget do NOT affect existing monthly budgets.

**Roles:** Two roles only — `admin` (full CRUD) and `viewer` (read + Excel export). Stored in `user_profiles`, enforced at the API layer. Supabase RLS is defence-in-depth only.

## Key Design Decisions

- **Shared Zod schemas** in `packages/types` are used for both API validation and frontend type inference — keep them in sync.
- **OpenAPI spec** is auto-generated from Hono route definitions. Interactive docs via Scalar at `/docs`.
- **TypeScript strict mode** everywhere.
- **Biome + Ultracite** for all linting/formatting — no ESLint, no Prettier.
- All API routes are under `/api/v1`.

## Environment Variables

**`apps/api`:**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3000
```

**`apps/web`:**
```
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Database

Supabase (PostgreSQL). Key tables: `user_profiles`, `budget_categories`, `master_budget_items`, `master_budget_settings`, `monthly_budgets`, `monthly_budget_items`, `transactions`, `transaction_tags`, `tags`, `pre_registered_entries`.

RLS is enabled on all tables. Supabase Storage bucket `receipts` holds transaction receipt images (max 10 MB, images only).

## Implementation Order

See `issue-order.md` for the full phased plan. High-level:
1. Biome/Ultracite config → Supabase setup
2. DB migrations + RLS + Storage bucket
3. JWT auth middleware + OpenAPI setup
4. Finance API (master budget → monthly budget → transactions → pre-registered/tags → Excel export)
5. Frontend shell + auth → Finance UI screens
6. Dockerfiles + docker-compose + PWA
