# Architecture & Data Flow Guide

**This guide explains how the app works from top to bottom.** Perfect for junior developers.

## Table of Contents

1. [Big Picture](#big-picture)
2. [Data Flow: Form Submission](#data-flow-form-submission)
3. [Data Flow: Form Approval](#data-flow-form-approval)
4. [Data Flow: Export](#data-flow-export)
5. [Authentication Flow](#authentication-flow)
6. [File Structure Guide](#file-structure-guide)
7. [Component Breakdown](#component-breakdown)

---

## Big Picture

The app has **3 main roles**:

```
┌─────────────────────┐
│   FIELD STAFF       │
├─────────────────────┤
│ - Login             │
│ - Fill form (9 step)│
│ - Submit form       │
│ - See own forms     │
└─────────────────────┘
          ↓ (API)
┌─────────────────────┐
│   NEXT.JS SERVER    │
├─────────────────────┤
│ - Validates data    │
│ - Checks auth       │
│ - Saves to DB       │
│ - Exports reports   │
└─────────────────────┘
          ↓ (database)
┌─────────────────────┐
│ SUPABASE DATABASE   │
├─────────────────────┤
│ - Stores forms      │
│ - Stores users      │
│ - Stores history    │
└─────────────────────┘
          ↓
┌─────────────────────┐
│   ADMIN             │
├─────────────────────┤
│ - See all forms     │
│ - Approve/reject    │
│ - Export all data   │
│ - Manage users      │
└─────────────────────┘
```

---

## Data Flow: Form Submission

Here's exactly what happens when a field staff member fills out and submits the form:

### Step 1: User Logs In

```
1. Field staff goes to /login
2. Enters email and password
3. Clicks "Login"
4. Next.js checks Supabase auth
5. If correct, stores session cookie
6. Redirects to /submit page
```

**Code location**: `app/(auth)/login/page.tsx`

### Step 2: User Loads Form

```
1. Field staff goes to /submit
2. Page loads (client component marked with 'use client')
3. SubmissionProvider creates empty form state
4. Form displays Step 1 (Basic Info)
```

**Code location**: 
- `app/(field)/submit/page.tsx` - Page wrapper
- `components/form/SubmissionProvider.tsx` - Manages form state
- `components/form/steps/Step1BasicInfo.tsx` - The actual form

### Step 3: User Fills Form (9 Steps)

Each time user clicks "Next", the step changes but data stays in memory:

```
Step 1: Basic Info (field name, region)
  ↓ (click Next)
Step 2: Snapshot (current situation)
  ↓ (click Next)
Step 3: Metrics (numbers about scholars)
  ↓ (click Next)
... (Steps 4-8) ...
  ↓ (click Next)
Step 9: Reflection
  ↓ (click Next)
Step 10: Review (shows all data)
```

**Data is stored in React state** (in memory, not yet saved to database):

```typescript
{
  step1: { field_name: "John", region: "Central" },
  step2: { snapshot: "Growing" },
  ...
}
```

### Step 4: User Clicks "Save as Draft"

At any time, user can save progress:

```
1. User clicks "Save as Draft"
   ↓
2. StepperFooter calls SubmissionProvider's saveAsDraft()
   ↓
3. API call to POST /api/draft
   ↓
4. Server validates data with Zod schema
   ↓
5. Creates row in submissions table (status: 'draft')
   ↓
6. Returns submission_id
   ↓
7. User sees "Saved!" message
```

**Code location**: 
- `components/form/StepperFooter.tsx` - UI for Save button
- `app/api/draft/route.ts` - Handles saving
- `lib/schemas.ts` - Validates the form data

### Step 5: User Clicks "Submit Final"

When user completes form and clicks "Submit Final":

```
1. User clicks "Submit Final"
   ↓
2. StepperFooter calls submitForm()
   ↓
3. API call to POST /api/submit
   ↓
4. Server:
   - Checks user is logged in
   - Checks submission exists
   - Validates all data with Zod
   - Updates status: 'draft' → 'submitted'
   - Records in audit_log
   ↓
5. Returns success (submission_id)
   ↓
6. Form closes, redirects to /history
```

**Code location**: `app/api/submit/route.ts`

### Summary: What Gets Saved to Database

```json
{
  "id": "uuid-500",
  "submitted_by": "uuid-of-user",
  "region": "Central",
  "week_label": "Term 2, Week 5",
  "status": "submitted",
  "submitted_at": "2026-03-21T10:30:00Z",
  "data": {
    "step1": { "field_name": "John Musoke", "region": "Central" },
    "step2": { "snapshot": "Growing" },
    "step3": { 
      "scholar_retention": { 
        "last_week": 150, 
        "this_week": 155,
        "retention_rate": 103.3
      }
    },
    ...all 9 steps...
  }
}
```

---

## Data Flow: Form Approval

Here's what happens when an admin approves a submission:

### Step 1: Admin Views Submissions List

```
1. Admin goes to /submissions (admin route)
   ↓
2. Page loads and calls GET /api/submissions
   ↓
3. Server (with admin auth):
   - Checks user is admin (from profiles.role)
   - Fetches ALL submissions from database
   - Joins with profiles table to get user names
   ↓
4. Displays table of all submissions
```

### Step 2: Admin Clicks "Approve"

```
1. Admin clicks "Approve" button on a submission
   ↓
2. Page calls API PUT /api/submissions/[id]/approve
   ↓
3. Server:
   - Checks user is admin
   - Updates submission status: 'submitted' → 'approved'
   - Adds entry to audit_log (action: 'approved')
   ↓
4. Success response
   ↓
5. Admin sees "Approved ✓" badge on the submission
```

### Step 3: Admin Clicks "Request Revision"

```
1. Admin clicks "Request Revision" and types a note
   ↓
2. API call to PUT /api/submissions/[id]/revise
   ↓
3. Server:
   - Updates status: 'submitted' → 'revision_requested'
   - Saves the note in audit_log
   ↓
4. Field staff sees notification that revisions are needed
   ↓
5. Field staff can edit and resubmit
```

---

## Data Flow: Export

When admin clicks "Export CSV":

```
1. Admin clicks "Export" button
   ↓
2. Page calls POST /api/export/csv
   ↓
3. Server:
   - Fetches all approved submissions
   - Converts JSON to CSV format
   - Downloads as file
   ↓
4. User's browser downloads "submissions.csv" file
   ↓
5. Opens in Excel
```

**Code location**: `lib/export-csv.ts`

The form JSON is flattened to columns:

```
field_name | region  | step1_field | step2_snapshot | step3_scholars
-----------|---------|-------------|----------------|----------------
John       | Central | John        | Growing        | 155
Sarah      | North   | Sarah       | Stable         | 142
```

---

## Authentication Flow

### Session Flow

```
Browser                 Supabase              Your Server
   ↓                        ↓                      ↓
   User logs in →  authenticate user  →  create session cookie
   ↓                        ↓                      ↓
   Browser stores cookie
   ↓                        ↓                      ↓
   User navigates to protected page
   ↓ (sends cookie)         ↓                      ↓
   →  validate session  →  [REST API calls]
```

**Code locations**:
- Login: `app/(auth)/login/page.tsx`
- Session check: `lib/supabase/server.ts` → `createClient()`
- Middleware: `middleware.ts` - Checks auth on every request

### Permission Check

Every API route does this:

```typescript
// Get logged-in user
const user = await supabase.auth.getUser()
if (!user) return 401 Unauthorized

// Get user's profile to check role
const profile = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)

if (profile.role !== 'admin') return 403 Forbidden
// Now they can proceed
```

---

## File Structure Guide

```
app/
├── (auth)/          ← Public pages (not logged in)
│   └── login/
│       └── page.tsx ← Login form
│
├── (admin)/         ← Admin-only pages
│   ├── layout.tsx   ← Shows admin nav
│   ├── page.tsx     ← Admin dashboard
│   ├── submissions/ ← List all submissions
│   └── users/       ← Manage users
│
├── (field)/         ← Field staff pages
│   ├── submit/
│   │   └── page.tsx ← Main form (9 steps)
│   └── history/
│       └── page.tsx ← See your past submissions
│
├── api/             ← Backend API routes
│   ├── auth/
│   │   └── register/ → (creates new user)
│   ├── submit/       → (saves form)
│   ├── submissions/  → (get/list/approve/revise)
│   ├── export/       → (download CSV)
│   └── users/        → (admin: manage users)
│
├── globals.css      ← Tailwind styles
└── layout.tsx       ← Root layout + error boundary

components/
├── form/
│   ├── SubmissionProvider.tsx ← Form state management
│   ├── StepperNav.tsx         ← "Step X of 10" indicator
│   ├── StepperFooter.tsx      ← Save/Submit buttons
│   ├── ReviewStep.tsx         ← Step 10 review
│   └── steps/
│       ├── Step1BasicInfo.tsx
│       ├── Step2Snapshot.tsx
│       ...
│       └── Step9Reflection.tsx
│
└── ui/              ← Reusable UI
    ├── Button.tsx
    ├── Input.tsx
    ├── Textarea.tsx
    └── StatusPill.tsx

lib/
├── schemas.ts       ← Zod validation rules
├── types.ts         ← TypeScript interfaces
├── utils.ts         ← Helper functions
├── export-csv.ts    ← CSV generation
├── summarize.ts     ← Claude AI summarization
└── supabase/
    ├── client.ts    ← Client-side DB connection
    └── server.ts    ← Server-side DB connection

supabase/
└── migrations/      ← Database setup scripts
    ├── 001_schema.sql    ← Create tables
    ├── 002_rls.sql       ← Security rules
    └── 003_seed_weeks.sql ← Initial data
```

---

## Component Breakdown

### SubmissionProvider (State Management)

This component manages the current form being filled:

```typescript
<SubmissionProvider>
  <SubmitWizard />  ← Child components use useSubmission() hook
</SubmissionProvider>
```

**Provides**:
```typescript
{
  currentStep,      // Which step (0-9) is showing
  formData,         // All form data entered so far
  updateField,      // Function to update a field
  nextStep,         // Go to next step
  prevStep,         // Go to previous step
  saveAsDraft,      // Save to database
  submitForm        // Final submit
}
```

**How to use in a step component**:

```typescript
function Step3Metrics() {
  const { formData, updateField } = useSubmission()
  
  return (
    <input
      value={formData.step3?.scholars || ''}
      onChange={(e) => updateField('step3', { scholars: e.target.value })}
    />
  )
}
```

### StepperNav

Shows "Step 3 of 10" and progress dots.

### StepperFooter

Shows "Back", "Save as Draft", and "Next/Submit" buttons.

### Validation (Zod Schemas)

When user saves or submits, data is validated:

```typescript
// This schema is in lib/schemas.ts
const step1Schema = z.object({
  field_name: z.string().min(1, 'Name required'),
  region: z.string().min(1, 'Region required'),
})

// Before saving, check:
const result = step1Schema.safeParse({
  field_name: 'John',
  region: 'Central'
})

if (!result.success) {
  console.error('Validation failed:', result.error)
  // Show error to user
}
```

---

## Error Handling

The app has a global error boundary (`ErrorBoundary.tsx`):

```
If any component crashes:
  ↓
ErrorBoundary catches it
  ↓
Shows: "Oops! Something went wrong"
  ↓
User can click "Refresh Page"
  ↓
(In dev mode, shows error details)
```

**Code location**: `components/ErrorBoundary.tsx` and `app/layout.tsx`

---

## Performance Notes

### 1. Form Data in Memory

The form data stays in **memory** (React state) while the user is filling it out. This is fast.

```
Memory: Fast, but lost if browser closes
Database: Slow (network call), but permanent
```

That's why we have "Save as Draft" — to move data from memory to database.

### 2. Lazy Loading

Large data (like submission lists) are only loaded when needed:

```
- User visits /submissions
  → fetch submissions
  
- User stays on /history
  → DON'T fetch if already cached
```

### 3. Database Indexes

The database has indexes on common queries (like `week_label`, `user_id`). This makes queries fast.

**Code**: `supabase/migrations/001_schema.sql`

---

## Common Debugging

### "Form data isn't saving"

Check:
1. Browser console for JavaScript errors
2. Network tab: Is API call being made?
3. API response: Is it returning success?
4. Database: Run `SELECT * FROM submissions` in Supabase

### "User can't see submissions"

Check:
1. Is user logged in? (`auth.getUser()`)
2. Does user have a profile row?
3. Is RLS policy correct? (See `002_rls.sql`)

### "Validation errors"

Check:
1. Error message in console
2. Form data matches schema in `lib/schemas.ts`
3. All required fields filled

---

## Next Steps

- Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to set up your database
- Read [API.md](API.md) for detailed API endpoint documentation
- Read [TESTING.md](TESTING.md) to learn how to test your changes

---

Last Updated: 2026-03-20
