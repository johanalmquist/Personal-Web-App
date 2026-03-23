# Product Requirements Document — Personal Web App

**Version:** 1.0
**Date:** 2026-03-23
**Author:** Johan Almquist
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Tech Stack](#3-tech-stack)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Architecture Overview](#5-architecture-overview)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Module System](#7-module-system)
8. [Module: Finance & Budget](#8-module-finance--budget)
9. [Data Models](#9-data-models)
10. [API Design](#10-api-design)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Future Modules](#13-future-modules)

---

## 1. Overview

A personal web application built as a monorepo, accessible as both a standard web app and a Progressive Web App (PWA). The app is private — there is no public landing page. All routes require authentication. Access to individual modules is gated by user roles assigned per user.

The first release ships a **Finance & Budget module**, designed to replace the existing Excel-based budget workflow (`Budget verktyg .xlsx`) with a more powerful, always-available, multi-device solution.

---

## 2. Goals & Non-Goals

### Goals

- Replace and extend the existing Excel budget workflow with a full-featured web app.
- Provide a secure, role-based multi-user environment.
- Support multiple independent modules in a single unified app.
- Be self-hosted via Docker for both frontend and backend.
- Deliver a clean, consistent UI across web and PWA.

### Non-Goals

- No public-facing pages or marketing content.
- No social or collaborative features in v1 (single-user focus).
- No mobile-native apps (PWA is sufficient).
- No multi-currency or multi-language support in v1.

---

## 3. Tech Stack

### Backend

| Technology           | Purpose                                |
| -------------------- | -------------------------------------- |
| **Bun**              | Runtime & package manager              |
| **Hono**             | HTTP framework with OpenAPI support    |
| **Zod**              | Schema validation & type inference     |
| **OpenAPI / Scalar** | API spec generation & interactive docs |
| **Supabase**         | PostgreSQL database, Auth, Storage     |
| **TypeScript**       | Type safety across all backend code    |

### Frontend

| Technology          | Purpose                                      |
| ------------------- | -------------------------------------------- |
| **React**           | UI framework                                 |
| **Bun + Vite**      | Build tooling & dev server                   |
| **TypeScript**      | Type safety across all frontend code         |
| **Mantine UI**      | Component library & styling system           |
| **PWA**             | Service worker, offline support, installable |
| **Tanstack Query**  | Data fetching and caching                    |
| **Tanstack Table**  | Data table components                        |
| **Tanstack Router** | Routing library                              |

### Tooling

| Technology            | Purpose                               |
| --------------------- | ------------------------------------- |
| **Turborepo**         | Monorepo task orchestration & caching |
| **Ultracite + Biome** | Linting, formatting, import sorting   |

---

## 4. Monorepo Structure

```
/
├── apps/
│   ├── api/              # Hono backend
│   └── web/              # React + Vite frontend (PWA)
├── packages/
│   ├── types/            # Shared TypeScript types & Zod schemas
│   ├── ui/               # Shared UI components (if needed)
│   └── config/           # Shared configs (biome, tsconfig, etc.)
├── turbo.json
├── package.json
└── docker-compose.yml
```

Each app has its own `Dockerfile`. The shared `docker-compose.yml` ties them together for local development and self-hosted deployment.

---

## 5. Architecture Overview

```
[Browser / PWA]
      │
      ▼
[apps/web]  ─── React + Vite + Mantine
      │
      │  REST (OpenAPI)
      ▼
[apps/api]  ─── Hono + Zod + OpenAPI
      │
      ├── Supabase (PostgreSQL)
      ├── Supabase Auth
      └── Supabase Storage (file uploads)
```

The API is the single source of truth. The frontend never talks directly to Supabase from the client — all data access goes through the Hono API, which validates and enforces role-based access control server-side.

> **Exception:** Supabase Auth client SDK may be used on the frontend for the authentication flow (sign in / sign out / session refresh), but all business data access goes through the API.

---

## 6. Authentication & Authorization

### Authentication

- Handled by **Supabase Auth**.
- No public registration. Users are created by the Admin.
- Supported methods in v1: email + password.
- The frontend uses the Supabase Auth client for session management.
- The API validates the Supabase JWT on every request.

### Roles

There are two roles in v1:

| Role       | Description                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| **Admin**  | Full access. Can read, write, delete, and manage all data.                           |
| **Viewer** | Read-only access. Can view data and export to Excel. Cannot create, edit, or delete. |

Roles are stored in the `user_profiles` table and enforced at the API layer via middleware. Each role can be scoped per module in future versions.

### Route Behavior

- All routes (frontend and API) require a valid session.
- Unauthenticated users are redirected to `/login`.
- After login, users are sent to the dashboard of the first module they have access to.
- Module navigation items are rendered conditionally based on role.

---

## 7. Module System

The app is built around a module concept. Each module is a self-contained feature area with its own routes, API endpoints, and database tables.

Modules are enabled/disabled per user based on their role. In v1, all users with any role have access to the Finance & Budget module.

**V1 Modules:**

| Module           | Status            |
| ---------------- | ----------------- |
| Finance & Budget | ✅ Included in v1 |

Future modules are listed in [Section 13](#13-future-modules).

---

## 8. Module: Finance & Budget

This module is the digital replacement for the existing `Budget verktyg .xlsx` workflow. The Excel file uses two sheets:

- **Init** — a "master budget" with fixed monthly costs grouped into categories: Loans (_Lån_), Fixed Costs (_Fasta kostnader_), Subscriptions (_Prenumerationer_), and Other/Buffer (_Övrigt & Buffert_). Also stores the monthly net income.
- **Mars 2026** — a monthly cash book (_Kassabok_) derived from the master budget, with a transaction log (date, description, category, type, amount, running balance).

The web app extends and formalises this structure significantly.

---

### 8.1 Master Budget

The master budget is the source of truth for recurring monthly budget lines. It is **not** tied to any specific month — it defines the default state that each new monthly budget is initialized from.

**Features:**

- Create and manage budget categories (e.g., _Lån_, _Fasta kostnader_, _Prenumerationer_, _Övrigt & Buffert_).
- Create budget line items (_poster_) within each category, each with a name and a default monthly amount.
- Set a default monthly net income value.
- Reorder categories and line items.
- Full CRUD for categories and line items.

**Important:** Changing the master budget has **no effect** on existing monthly budgets (open or closed). Changes only apply when a new monthly budget is created.

---

### 8.2 Monthly Budgets

Each month has its own budget, initialized as a snapshot of the master budget at the time of creation.

**Features:**

- A monthly budget is created manually or can be auto-created at the start of each month.
- Each monthly budget is independent once created — it is not affected by later changes to the master budget.
- The monthly budget inherits all categories and line items from the master budget at creation time.
- Individual line item amounts can be overridden for that specific month (e.g., "this month my electric bill is 820 kr instead of 615 kr").
- Monthly budgets have a status: **open** or **closed**.
- A closed month is read-only (Viewer and Admin both see it; only Admin can reopen it).

**Monthly Overview (dashboard for the month):**

- Net income (monthly).
- Total fixed budget costs.
- Variable room (income minus fixed costs).
- Total logged transactions for the month.
- Actual remaining (variable room minus logged transactions).

---

### 8.3 Transaction Log (Cash Book)

Full CRUD for financial transactions within a month.

**Transaction fields:**

| Field             | Description                                                                            |
| ----------------- | -------------------------------------------------------------------------------------- |
| `date`            | Date of the transaction                                                                |
| `description`     | Free-text description                                                                  |
| `category`        | Tag/category (see 8.5)                                                                 |
| `type`            | `income` or `expense`                                                                  |
| `amount`          | Amount in SEK (positive for income, positive for expenses — type determines direction) |
| `tags`            | One or more tags (see 8.5)                                                             |
| `attachment`      | Optional image/receipt upload (stored in Supabase Storage)                             |
| `running_balance` | Computed: variable room minus cumulative expenses plus incomes                         |

**Features:**

- Create, read, update, delete transactions.
- Upload an image (e.g., receipt) to a transaction. Images are stored in Supabase Storage.
- Running balance is recalculated and displayed after each transaction.
- Filter transactions by date range, category, type, and tag.

---

### 8.4 Pre-registered Income & Expenses

Users can pre-register a future income or expense for a specific month before that month's budget is active.

**Example use case:** "In September 2026, there will be an expense of 5,000 kr for a trip."

**Features:**

- Create a pre-registered entry with: month, year, description, type (income/expense), amount, and optional category/tag.
- Pre-registered entries are displayed in the monthly overview/dashboard as planned entries.
- When the monthly budget for that month is created, pre-registered entries are automatically imported as transactions.
- Full CRUD for pre-registered entries.

---

### 8.5 Tags & Categories

- **Categories** are linked to budget line items and can also be assigned to transactions. They represent high-level groupings (e.g., _Mat_, _Nöjen_, _Transport_).
- **Tags** are free-form labels that can be assigned to transactions. Multiple tags per transaction are supported.
- Tags can be created on-the-fly when adding a transaction.
- Tags can be managed in a dedicated settings view.

---

### 8.6 Dashboard / Overview

A high-level overview for the current (or selected) month.

**Sections:**

- **Budget overview:** Net income, fixed costs, variable room, total logged expenses, actual remaining.
- **Category breakdown:** Bar or donut chart showing spending per category.
- **Pre-registered upcoming:** List of pre-registered future entries for the next 2–3 months.
- **Recent transactions:** Last 5–10 transactions with quick links to the full log.
- **Month selector:** Navigate between months.

---

### 8.7 Excel Export

Export a monthly budget and its transactions to an `.xlsx` file.

**Features:**

- Select a date range (from month / to month) for the export.
- The export includes: budget overview, category summaries, and full transaction log.
- Format matches the existing `Budget verktyg .xlsx` conventions where applicable.
- Available to both **Admin** and **Viewer** roles.

---

### 8.8 Roles — Finance Module

| Feature                                       | Viewer | Admin |
| --------------------------------------------- | ------ | ----- |
| View master budget                            | ✅     | ✅    |
| Edit master budget                            | ❌     | ✅    |
| View monthly budgets                          | ✅     | ✅    |
| Create / close monthly budgets                | ❌     | ✅    |
| Override line item amounts per month          | ❌     | ✅    |
| View transactions                             | ✅     | ✅    |
| Create / edit / delete transactions           | ❌     | ✅    |
| Upload receipt images                         | ❌     | ✅    |
| View pre-registered entries                   | ✅     | ✅    |
| Create / edit / delete pre-registered entries | ❌     | ✅    |
| Export to Excel                               | ✅     | ✅    |
| Manage tags                                   | ❌     | ✅    |

---

## 9. Data Models

### `user_profiles`

```
id           uuid (FK → auth.users)
role         enum: 'admin' | 'viewer'
created_at   timestamptz
```

### `budget_categories`

```
id           uuid
name         text
sort_order   int
created_at   timestamptz
```

### `master_budget_items`

```
id              uuid
category_id     uuid (FK → budget_categories)
name            text
default_amount  numeric
sort_order      int
created_at      timestamptz
updated_at      timestamptz
```

### `master_budget_settings`

```
id              uuid
monthly_income  numeric
updated_at      timestamptz
```

### `monthly_budgets`

```
id           uuid
year         int
month        int  (1–12)
status       enum: 'open' | 'closed'
income       numeric  (snapshot from master at creation time)
created_at   timestamptz
```

### `monthly_budget_items`

```
id                   uuid
monthly_budget_id    uuid (FK → monthly_budgets)
master_item_id       uuid (FK → master_budget_items, nullable — for items deleted from master)
category_name        text  (snapshot)
item_name            text  (snapshot)
budgeted_amount      numeric  (overridable per month)
created_at           timestamptz
```

### `tags`

```
id           uuid
name         text (unique)
created_at   timestamptz
```

### `transactions`

```
id                   uuid
monthly_budget_id    uuid (FK → monthly_budgets)
date                 date
description          text
type                 enum: 'income' | 'expense'
amount               numeric
monthly_item_id      uuid (FK → monthly_budget_items, nullable)
attachment_path      text (nullable — Supabase Storage path)
created_at           timestamptz
updated_at           timestamptz
```

### `transaction_tags`

```
transaction_id   uuid (FK → transactions)
tag_id           uuid (FK → tags)
PRIMARY KEY (transaction_id, tag_id)
```

### `pre_registered_entries`

```
id              uuid
year            int
month           int
description     text
type            enum: 'income' | 'expense'
amount          numeric
category_id     uuid (FK → budget_categories, nullable)
tag_id          uuid (FK → tags, nullable)
imported        boolean (default false)
created_at      timestamptz
```

---

## 10. API Design

The API follows REST conventions and is fully documented via OpenAPI. Interactive docs are served via **Scalar** at `/docs` (accessible only in development/staging, or behind auth).

### Base URL

```
/api/v1
```

### Finance Module Endpoints (summary)

| Method   | Path                                                | Description                                               |
| -------- | --------------------------------------------------- | --------------------------------------------------------- |
| `GET`    | `/budget/master`                                    | Get master budget with all categories and items           |
| `POST`   | `/budget/master/categories`                         | Create a budget category                                  |
| `PUT`    | `/budget/master/categories/:id`                     | Update a category                                         |
| `DELETE` | `/budget/master/categories/:id`                     | Delete a category                                         |
| `POST`   | `/budget/master/items`                              | Create a master budget item                               |
| `PUT`    | `/budget/master/items/:id`                          | Update a master budget item                               |
| `DELETE` | `/budget/master/items/:id`                          | Delete a master budget item                               |
| `GET`    | `/budget/monthly`                                   | List all monthly budgets                                  |
| `POST`   | `/budget/monthly`                                   | Create a new monthly budget (from master snapshot)        |
| `GET`    | `/budget/monthly/:id`                               | Get a monthly budget with items and overview              |
| `PUT`    | `/budget/monthly/:id`                               | Update monthly budget (status, income override)           |
| `PUT`    | `/budget/monthly/:id/items/:itemId`                 | Override a line item amount for the month                 |
| `GET`    | `/budget/monthly/:id/transactions`                  | List transactions for a monthly budget                    |
| `POST`   | `/budget/monthly/:id/transactions`                  | Create a transaction                                      |
| `PUT`    | `/budget/monthly/:id/transactions/:txId`            | Update a transaction                                      |
| `DELETE` | `/budget/monthly/:id/transactions/:txId`            | Delete a transaction                                      |
| `POST`   | `/budget/monthly/:id/transactions/:txId/attachment` | Upload receipt image                                      |
| `DELETE` | `/budget/monthly/:id/transactions/:txId/attachment` | Remove receipt image                                      |
| `GET`    | `/budget/pre-registered`                            | List pre-registered entries                               |
| `POST`   | `/budget/pre-registered`                            | Create a pre-registered entry                             |
| `PUT`    | `/budget/pre-registered/:id`                        | Update a pre-registered entry                             |
| `DELETE` | `/budget/pre-registered/:id`                        | Delete a pre-registered entry                             |
| `GET`    | `/budget/tags`                                      | List all tags                                             |
| `POST`   | `/budget/tags`                                      | Create a tag                                              |
| `DELETE` | `/budget/tags/:id`                                  | Delete a tag                                              |
| `GET`    | `/budget/export`                                    | Export to Excel (query params: `from`, `to` as `YYYY-MM`) |

### Auth Endpoints

Authentication is handled by Supabase Auth directly. The API provides:

| Method | Path       | Description                       |
| ------ | ---------- | --------------------------------- |
| `GET`  | `/auth/me` | Get current user profile and role |

---

## 11. Infrastructure & Deployment

### Docker

Both apps are containerized independently.

**`apps/api/Dockerfile`** — Bun-based image, runs the Hono server.
**`apps/web/Dockerfile`** — Multi-stage build: Vite build → serve static files via a lightweight HTTP server (e.g., `nginx` or `serve`).

**`docker-compose.yml`** at the root orchestrates both services with appropriate environment variable injection.

### Environment Variables

**API (`apps/api`):**

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3000
```

**Web (`apps/web`):**

```
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Hosting

Hosting provider is **not yet decided**. The Docker setup ensures portability across any container-compatible host (VPS, Railway, Fly.io, etc.).

### Supabase

- Supabase is used for: PostgreSQL, Auth, and Storage.
- Row Level Security (RLS) policies are defined on all tables as a defence-in-depth measure, even though the primary access control is in the API.
- Supabase Storage bucket: `receipts` — one folder per transaction, one image per transaction (can be extended).

---

## 12. Non-Functional Requirements

### Performance

- API response time for standard list/read endpoints: < 200ms under normal load.
- Excel export for a 12-month range: < 5 seconds.
- Frontend initial load (PWA shell): < 2 seconds on a modern connection.

### PWA

- Service worker for offline support of previously cached views.
- Installable on iOS and Android.
- App manifest with icons and theme color.

### Security

- All API routes protected by JWT validation middleware.
- Role checks enforced server-side on every mutating operation.
- File uploads validated for type (images only) and size (max 10 MB).
- Supabase RLS enabled on all tables.
- HTTPS required in all non-local environments.

### Code Quality

- Biome + Ultracite enforced via CI for formatting and linting.
- TypeScript strict mode enabled in all packages.
- Zod schemas shared between API and client via the `packages/types` package.
- OpenAPI spec auto-generated from Hono route definitions.

### Observability

- Structured logging in the API (JSON format).
- Error boundaries in the frontend for graceful failure handling.

---

## 13. Future Modules

The following modules are candidates for future development. They are **not** part of v1 scope.

| Module                    | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| **Health & Fitness**      | Track workouts, weight, sleep, habits                          |
| **Notes / Journal**       | Personal notes with tagging and search                         |
| **Tasks / To-do**         | Personal task and project tracking                             |
| **Subscriptions Tracker** | Manage and track recurring subscriptions (extends budget data) |
| **Net Worth Tracker**     | Assets, liabilities, and net worth over time                   |

---

_End of PRD v1.0_
