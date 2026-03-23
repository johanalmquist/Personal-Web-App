# Recommended Issue Order — Personal Web App

Issues are grouped into phases based on dependencies. Complete each phase before moving to the next. Within a phase, items marked **parallel** can be worked on at the same time.

---

## Phase 1 — Foundation (start here)

Everything else depends on these being in place first.

| Order | Issue | Title | Notes |
|---|---|---|---|
| 1 | JOH-6 | Configure Biome + Ultracite for linting and formatting | Do this first so all future code follows consistent style from day one |
| 2 | JOH-11 | Set up Supabase project and environment variables | Required before any database or auth work can begin |

---

## Phase 2 — Database (parallel)

All three can be done simultaneously once the Supabase project exists.

| Order | Issue | Title | Notes |
|---|---|---|---|
| 3a | JOH-12 | Create user_profiles table and role system | Needed before auth middleware can read roles |
| 3b | JOH-15 | Create database migrations for Finance module tables | Needed before any Finance API work |
| 3c | JOH-17 | Set up Supabase Storage bucket for receipt images | Needed before transaction image upload API |

---

## Phase 3 — RLS & Auth Backend

Depends on Phase 2 tables being in place.

| Order | Issue | Title | Notes |
|---|---|---|---|
| 4a | JOH-16 | Configure RLS policies for Finance module tables | Depends on JOH-15 |
| 4b | JOH-13 | Implement JWT auth middleware and GET /auth/me in Hono API | Depends on JOH-12; all backend routes depend on this |
| 4c | JOH-24 | Set up OpenAPI spec generation and Scalar interactive docs | Set up early so every API route is documented as you build it |

---

## Phase 4 — Backend: Finance API

Build API endpoints in dependency order. JOH-19 depends on JOH-18; JOH-20 depends on JOH-19.

| Order | Issue | Title | Notes |
|---|---|---|---|
| 5 | JOH-18 | Implement Master Budget API — categories and items CRUD | Build first — monthly budgets depend on master budget data |
| 6 | JOH-19 | Implement Monthly Budget API — snapshot, status, and line item overrides | Depends on JOH-18 (reads master budget to create snapshot) |
| 7a | JOH-20 | Implement Transactions API — full CRUD with receipt image upload | Depends on JOH-19 and JOH-17 |
| 7b | JOH-22 | Implement Pre-registered Entries API and Tags API | Can be done in parallel with JOH-20; auto-import hooks into JOH-19 |
| 8 | JOH-23 | Implement Excel export endpoint | Depends on all Finance APIs above being complete |

---

## Phase 5 — Frontend: Core Shell & Auth

Depends on Phase 3 (auth middleware must be working).

| Order | Issue | Title | Notes |
|---|---|---|---|
| 9 | JOH-14 | Build login page and auth session management in React | Foundation for all frontend screens |
| 10 | JOH-25 | Build React app shell with Mantine UI, routing, and app layout | All Finance pages render inside this shell |

---

## Phase 6 — Frontend: Finance Module

Build screens in the order a user would navigate through them. Dashboard is last because it composes data from all other screens.

| Order | Issue | Title | Notes |
|---|---|---|---|
| 11 | JOH-26 | Build Master Budget management UI | Depends on JOH-18 API and JOH-25 shell |
| 12 | JOH-27 | Build Monthly Budget view with line item override support | Depends on JOH-19 API |
| 13 | JOH-28 | Build Transaction log (cash book) UI | Depends on JOH-20 API — core data entry screen |
| 14 | JOH-29 | Build Pre-registered Entries UI | Depends on JOH-22 API |
| 15 | JOH-31 | Build Excel export UI | Depends on JOH-23 API |
| 16 | JOH-30 | Build Finance Dashboard / Overview | Build last — composes data from all screens above |

---

## Phase 7 — Infrastructure & PWA (finish here)

Can be done any time after Phase 5, but easiest to get right once the app is stable.

| Order | Issue | Title | Notes |
|---|---|---|---|
| 17a | JOH-7 | Create Dockerfile for API (apps/api) | Parallel with JOH-10 |
| 17b | JOH-10 | Create Dockerfile for Web (apps/web) | Parallel with JOH-7 |
| 18 | JOH-9 | Create docker-compose.yml for local and self-hosted deployment | Depends on both Dockerfiles (JOH-7 + JOH-10) |
| 19 | JOH-32 | Configure PWA — service worker, manifest, and installability | Do last — the full app should be working before optimising the install experience |

---

## Quick-reference: flat ordered list

```
1.  JOH-6  — Biome + Ultracite setup
2.  JOH-11 — Supabase project setup
3a. JOH-12 — user_profiles table
3b. JOH-15 — Finance DB migrations
3c. JOH-17 — Storage bucket
4a. JOH-16 — RLS policies
4b. JOH-13 — JWT auth middleware
4c. JOH-24 — OpenAPI + Scalar
5.  JOH-18 — Master Budget API
6.  JOH-19 — Monthly Budget API
7a. JOH-20 — Transactions API
7b. JOH-22 — Pre-registered + Tags API
8.  JOH-23 — Excel export API
9.  JOH-14 — Login page + auth (frontend)
10. JOH-25 — App shell + routing
11. JOH-26 — Master Budget UI
12. JOH-27 — Monthly Budget UI
13. JOH-28 — Transaction log UI
14. JOH-29 — Pre-registered Entries UI
15. JOH-31 — Excel export UI
16. JOH-30 — Finance Dashboard
17. JOH-7  — Dockerfile (API)
17. JOH-10 — Dockerfile (Web)
18. JOH-9  — docker-compose.yml
19. JOH-32 — PWA configuration
```
