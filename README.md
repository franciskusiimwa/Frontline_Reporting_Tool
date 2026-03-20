# PO Project: EXP Weekly Regional Update Platform

Internal reporting platform for Educate! Uganda field operations.

Field staff submit weekly reports. Admins review, approve, analyze, and export submissions.

## Overview

This project is built with Next.js App Router, TypeScript, and Supabase PostgreSQL.

Key capabilities:
- 9-step guided weekly report form
- Draft save and final submission flow
- Admin review and approval workflow
- Submission history for field staff
- Dashboard analytics and CSV export
- Cursor-based submissions pagination
- Audit logging for state transitions

## Roles

Field staff can:
- Create and update drafts
- Submit final weekly reports
- View their own submission history

Admins can:
- View all submissions
- Approve submitted reports
- Manage users
- Export and summarize submissions
- View dashboard metrics

## Quick Start

Prerequisites:
- Node.js 18+
- npm
- Supabase project

Setup:

```bash
git clone https://github.com/YOUR-ORG/po-project.git
cd po-project
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

Environment setup details: [ENVIRONMENT.md](ENVIRONMENT.md)
First-time local setup guide: [GETTING_STARTED.md](GETTING_STARTED.md)

## Core Architecture

- Frontend: React 19 + Next.js 16 App Router
- API: Next.js route handlers under app/api
- Database: Supabase PostgreSQL with RLS
- Validation: Zod
- Forms: React Hook Form
- Charts: Recharts

Workflow integrity:
- Final submit and approve transitions are executed atomically in Postgres RPCs.
- Migration: supabase/migrations/006_submission_workflow_rpcs.sql
- RPC functions: submit_submission and approve_submission

Pagination model:
- Submissions listing uses cursor pagination with limit and cursor.
- Response shape includes submissions, total, and nextCursor.

## Common Commands

```bash
npm run dev           # Start dev server
npm run lint          # ESLint checks
npm run typecheck     # TypeScript checks
npm run test          # Run unit tests
npm run build         # Production build
npm run coverage      # Test coverage
npm run validate:env  # Validate required runtime env vars
```

## API Summary

| Endpoint | Method | Purpose |
|---|---|---|
| /api/auth/register | POST | Create user |
| /api/draft | PATCH | Save draft |
| /api/submit | POST | Submit final report |
| /api/submissions | GET | List submissions |
| /api/submissions/[id] | GET | Submission detail |
| /api/submissions/[id]/approve | PATCH | Approve submission |
| /api/submissions/[id]/revise | PATCH | Disabled, returns 403 |
| /api/submissions/[id]/summarize | POST | Summarize one submission |
| /api/export/csv | GET | Export CSV |
| /api/dashboard | GET | Admin dashboard data |
| /api/users | GET/POST | List/create users |
| /api/users/[id] | PATCH/POST/DELETE | Update/reset/delete user |
| /api/weeks | GET | Current week config |
| /api/health | GET | Runtime and DB health |

Full endpoint docs: [API.md](API.md)

## Repository Layout

```text
app/                    # Routes, pages, API handlers
components/             # Form and UI components
lib/                    # Validation, services, helpers
lib/services/           # Shared server-side domain services
supabase/migrations/    # SQL migrations and DB workflow changes
public/                 # Static assets
```

## Data and Security Notes

- Access control enforced with PostgreSQL RLS.
- Field staff can only access their own submissions.
- Admin-only routes are role-protected.
- Audit log records major workflow actions.
- Secrets are provided via environment variables.

## Documentation Index

- [GETTING_STARTED.md](GETTING_STARTED.md): local setup walkthrough
- [ARCHITECTURE.md](ARCHITECTURE.md): request/data flow details
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md): database setup and schema
- [API.md](API.md): endpoint contracts and examples
- [ENVIRONMENT.md](ENVIRONMENT.md): required variables
- [TESTING.md](TESTING.md): test strategy and commands
- [DEPLOYMENT.md](DEPLOYMENT.md): deployment and launch steps

## Deployment

Primary target is Vercel with Supabase backend.

Deployment steps and environment mapping are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

## Version

v1.0.0 (March 2026)

Last updated: 2026-03-20
