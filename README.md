# PO Project: EXP Weekly Regional Update Platform

**A web application for field staff to submit weekly reports and for administrators to manage and approve submissions.**

Built with Next.js, React, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

---

## Quick Links for New Developers

**First time here?** Start here:
- 📖 [**Getting Started Guide**](GETTING_STARTED.md) - 15 minutes to get running locally
- 🏗️ [**Architecture Guide**](ARCHITECTURE.md) - How the app works (data flow, roles, components)
- 📚 [**Database Guide**](SUPABASE_SETUP.md) - Understanding Supabase and the database

**Need details?**
- 🔌 [**API Reference**](API.md) - All endpoints with examples
- ✅ [**Testing Guide**](TESTING.md) - How to write tests
- 🚀 [**Deployment Guide**](DEPLOYMENT.md) - How to launch to production
- 🔑 [**Environment Variables**](ENVIRONMENT.md) - Setup and configuration

---

## What This App Does

This is an **internal reporting platform** for Educate! Uganda field staff.

### For Field Staff:
✅ Fill out a **9-step weekly form** with metrics and insights  
✅ **Save as draft** to complete later  
✅ **Submit final** submission to admin for review  
✅ View **past submissions** and status history  

### For Admins:
✅ See **all submissions** from all field staff  
✅ **Approve** submissions  
✅ View **dashboard** with summary statistics  
✅ **Export data** to CSV for analysis  
✅ **Manage users** (create, update roles)  
✅ Browse submissions with **cursor-based pagination** for stable large-list navigation

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Framework | Next.js 16 (App Router) |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL with RLS) |
| Validation | Zod (runtime schema validation) |
| Forms | React Hook Form |
| UI Components | Custom (Button, Input, Textarea, Card) |
| Auth | Supabase Authentication |
| Charts | Recharts |
| Exports | CSV/DOCX format |
| AI | Anthropic Claude (optional summarization) |

---

## Project Structure

```
├── app/                    ← Pages & routes
│   ├── (auth)/            ← Login page
│   ├── (admin)/           ← Admin pages (dashboard, submissions, users)
│   ├── (field)/           ← Field staff pages (submit form, history)
│   ├── api/               ← Backend API endpoints
│   ├── globals.css        ← Global Tailwind styles
│   └── layout.tsx         ← Root layout + ErrorBoundary
│
├── components/            ← React components
│   ├── form/             ← Form-related components
│   │   ├── steps/        ← Individual form steps (Step1-9)
│   │   ├── SubmissionProvider.tsx  ← Form state management
│   │   ├── ReviewStep.tsx
│   │   └── Stepper*.tsx  ← Navigation components
│   └── ui/               ← Reusable UI components (Button, Input, etc.)
│
├── lib/                  ← Utilities & helpers
│   ├── schemas.ts       ← Zod validation schemas
│   ├── types.ts         ← TypeScript interfaces
│   ├── utils.ts         ← Helper functions
│   ├── submissions-cursor.ts ← Cursor encoding/decoding for submissions API
│   ├── services/
│   │   └── submissions.ts    ← Shared submission workflow/list service
│   ├── export-*.ts      ← Export functions (CSV, DOCX)
│   ├── summarize.ts     ← AI summarization
│   └── supabase/
│       ├── client.ts    ← Client-side DB connection
│       └── server.ts    ← Server-side DB connection
│
├── supabase/            ← Database configuration
│   └── migrations/      ← Database setup scripts
│       ├── 001_schema.sql       ← Create tables
│       ├── 002_rls.sql          ← Security rules
│       ├── 003_seed_weeks.sql   ← Initial data
│       └── 006_submission_workflow_rpcs.sql ← Atomic submit/approve workflows
│
├── public/              ← Static files
├── .env.example         ← Environment variables template
├── package.json         ← Dependencies
├── tsconfig.json        ← TypeScript config
└── README.md            ← This file
```

---

## Getting Started Locally

### Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org))
- **Git** ([Download](https://git-scm.com))
- **Supabase account** (free at https://supabase.com)

### Setup (5 minutes)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR-ORG/po-project.git
cd po-project

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Add your Supabase keys to .env.local
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
# SUPABASE_SERVICE_ROLE_KEY=your-secret-key

# 5. Start dev server
npm run dev
```

Submission workflow changes are executed atomically in PostgreSQL via the `submit_submission` and `approve_submission` RPCs introduced in `supabase/migrations/006_submission_workflow_rpcs.sql`. The submissions listing endpoint now uses cursor pagination with `cursor` and `limit` parameters instead of offset pagination.

Open http://localhost:3000 🎉

**Detailed walkthrough?** See [GETTING_STARTED.md](GETTING_STARTED.md)

---

## Key Workflows

### Workflow 1: Submit a Form (Field Staff)

```
1. Log in with email/password
   ↓
2. Click "Submit Weekly Report"
   ↓
3. Fill Step 1 (Basic Info) → Click Next
4. Fill Step 2 (Snapshot) → Click Next
... (Steps 3-9) ...
   ↓
5. Review all data (Step 10)
   ↓
6. Click "Submit Final"
   ↓
✓ Form submitted, admin will review soon
```

### Workflow 2: Approve a Form (Admin)

```
1. Go to Admin Dashboard
   ↓
2. Click "Submissions" in sidebar
   ↓
3. Find a submission with status "submitted"
   ↓
4. Click "Review"
   ↓
5. Read the data and click "Approve"
   ↓
✓ Decision recorded in audit log
```

### Workflow 3: Export Data (Admin)

```
1. Go to Admin Dashboard
   ↓
2. Click "Export" button
   ↓
3. Choose format (CSV)
   ↓
4. Browser downloads "submissions.csv"
   ↓
5. Open in Excel/Google Sheets for analysis
```

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Create optimized production build
npm start            # Run production server

# Code Quality
npm run lint         # Check TypeScript & code style
npm run typecheck    # Run strict TypeScript compile checks
npm run test         # Run unit test suite (Vitest)
npm run coverage     # Generate test coverage report
npm run validate:env # Validate required runtime environment variables

# Database
supabase migration up    # Run database migrations
supabase migration new   # Create new migration
```

---

## Database Schema Overview

### Main Tables

**profiles** - User information
```
id | full_name | region | role | created_at
```

**week_config** - Week definitions (admin creates these)
```
id | label | term | week_number | is_current
```

**submissions** - Form responses
```
id | submitted_by | week_label | status | data (JSON) | submitted_at | created_at
```

**audit_log** - Action history (append-only)
```
id | submission_id | actor_id | action | note | created_at
```

**See** [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for complete database guide

---

## API Endpoints Overview

The backend provides these main endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create new user |
| `/api/draft` | PATCH | Save form as draft |
| `/api/submit` | POST | Submit form (final) |
| `/api/submissions` | GET | List all submissions (admin) |
| `/api/submissions/[id]` | GET | Get one submission |
| `/api/submissions/[id]/approve` | PATCH | Approve submission (admin) |
| `/api/submissions/[id]/revise` | PATCH | Revision requests disabled (returns 403) |
| `/api/export/csv` | GET | Export to CSV (admin) |
| `/api/users` | GET/POST | Manage users (admin) |
| `/api/dashboard` | GET | Dashboard stats (admin) |
| `/api/health` | GET | Runtime + database health check |

**Full API docs** → [API.md](API.md)

---

## Data Security

### Authentication
- Email/password login via Supabase
- Session maintained via secure cookies
- Automatic logout after inactivity

### Authorization (RLS)
- **Field staff**: Can only see their own submissions
- **Admin**: Can see all submissions and approve
- Rules enforced at database level (PostgreSQL RLS)

### Data Protection
- All passwords hashed by Supabase
- Sensitive keys stored in environment variables only
- HTTPS/TLS enforced in production
- Audit log tracks all actions

---

## Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional
ANTHROPIC_API_KEY=your-claude-api-key  # For AI summarization
```

See [ENVIRONMENT.md](ENVIRONMENT.md) for detailed guide

---

## Deployment

The app is ready for production on:
- **Vercel** (recommended) - Easiest deployment
- **Netlify** - Alternative serverless
- **Self-hosted** - Docker/Linux servers

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions

---

## Testing

Get latest status of tests:

```bash
npm run lint              # Check code style
npm run build            # Verify production build

# Run tests (when added)
npm test
```

See [TESTING.md](TESTING.md) for testing guide

---

## Common Tasks for Junior Devs

### Add a New Input Field
1. Find the step component (e.g., `Step1BasicInfo.tsx`)
2. Add an `<Input />` component
3. Update the Zod schema in `lib/schemas.ts`
4. Test by submitting the form

### Fix a Bug
1. Use DevTools (F12) to locate the error
2. Search the codebase with Ctrl+F
3. Read the code carefully
4. Test your fix locally
5. Commit with clear message

### Create a New Page
1. Create file in `app/(auth|admin|field)/route/page.tsx`
2. `export default function PageName() { ... }`
3. Use components from `components/`
4. See [ARCHITECTURE.md](ARCHITECTURE.md) for patterns

---

## Troubleshooting

### "Port 3000 already in use"
```bash
npm run dev -- -p 3001
```

### "Supabase connection failed"
- Check `.env.local` has correct URL and keys
- Ensure Supabase project is active
- Restart dev server

### "SUPABASE_SERVICE_ROLE_KEY is missing"
- Add to `.env.local` (server-side only)
- Never expose to client code
- See [ENVIRONMENT.md](ENVIRONMENT.md)

### "Form validation failed"
- Check error message in console
- Review `lib/schemas.ts` for rules
- Ensure all required fields filled

See [GETTING_STARTED.md](GETTING_STARTED.md) for more troubleshooting

---

## Project Readiness

✅ **Production Ready**
- [ ] Code linted properly (63 warnings for cleanup)
- [x] Production build tested
- [x] Error handling with boundaries
- [x] Database configured with RLS
- [x] API endpoints secured
- [x] Environment variables documented
- [x] CI/CD pipeline set up
- [x] Comprehensive documentation

**Pre-launch checklist** → [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Performance

- **Build**: ~6-7 seconds using Turbopack
- **Database queries**: Optimized with indexes
- **Bundle size**: Minimal with tree-shaking
- **API responses**: Average <200ms with good network

---

## Support & Resources

### Documentation (In This Repo)
- 📖 [GETTING_STARTED.md](GETTING_STARTED.md) - Setup & first steps
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - System design & data flow
- 📚 [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Database guide
- 🔌 [API.md](API.md) - Endpoint reference
- 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) - Production launch
- 🔑 [ENVIRONMENT.md](ENVIRONMENT.md) - Config variables
- ✅ [TESTING.md](TESTING.md) - Testing strategy

### External Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Zod Documentation](https://zod.dev)

### Getting Help
1. Check the docs (most answers are here!)
2. Search GitHub Issues
3. Ask the team in Slack/Teams
4. Google the error message

---

## License

Private project for Educate! Uganda

---

## Contributors

- Tech Lead: [Name]
- Developers: [Team members]

---

## Version

**v1.0.0** - Initial production release (March 2026)

---

**Last Updated**: 2026-03-20
#   F r o n t l i n e _ R e p o r t i n g _ T o o l 
 
 