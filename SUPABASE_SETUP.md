# Supabase Setup & Database Guide

**This guide is for junior developers.** It explains step-by-step how to set up Supabase and understand the database structure.

## Table of Contents

1. [What is Supabase?](#what-is-supabase)
2. [Creating a Supabase Project](#creating-a-supabase-project)
3. [Database Structure](#database-structure)
4. [Running Migrations](#running-migrations)
5. [Testing the Connection](#testing-the-connection)
6. [Common Tasks](#common-tasks)

---

## What is Supabase?

Supabase is a **PostgreSQL database** that you can use from the internet. Think of it like having a professional database server without managing all the hardware yourself.

**Key terms**:
- **PostgreSQL**: A powerful database language (think of it like Excel but much more powerful)
- **API Keys**: Like passwords that let your app talk to the database
- **RLS (Row Level Security)**: Rules that control who can see/edit what data

---

## Creating a Supabase Project

### Step 1: Sign Up

1. Go to https://supabase.com
2. Click "Sign Up" and use your email
3. Verify your email

### Step 2: Create Project

1. Click "New Project"
2. Give it a name (e.g., `po-project-prod`)
3. Choose a region closest to you
4. Create a strong password (you won't need to remember it)
5. Wait 2-3 minutes for the project to initialize

### Step 3: Get Your API Keys

These are like passwords for your app to access the database.

1. Go to **Settings** → **API** in the left sidebar
2. You'll see two important keys:
   ```
   Project URL: https://xxx.supabase.co
   Anon Key: eyJxx...  (this is safe to expose in code)
   Service Role Key: eyJyy...  (KEEP THIS SECRET! Server-side only)
   ```

3. Copy these to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
   SUPABASE_SERVICE_ROLE_KEY=eyJyy...
   ```

---

## Database Structure

The database has 4 main tables (like worksheets in Excel):

### 1. **auth.users** (Built-in)
Managed by Supabase automatically. Stores login info.

```
id        | email           | created_at
---       | ---             | ---
uuid-123  | john@school.ug  | 2026-03-20
uuid-456  | admin@school.ug | 2026-03-20
```

### 2. **profiles** (Links auth to user info)
Extends the auth.users table with additional info.

```
id        | full_name       | region    | role       | created_at
---       | ---             | ---       | ---        | ---
uuid-123  | John Musoke     | Central   | field_staff| 2026-03-20
uuid-456  | Sarah Admin     | Head Qtr  | admin      | 2026-03-20
```

**Allowed roles**:
- `field_staff` - Can submit forms and see own submissions
- `admin` - Can see all submissions, approve/reject

### 3. **week_config** (Admin creates these)
Defines which week is "current" for submissions.

```
id        | label              | term    | week_number | is_current
---       | ---                | ---     | ---         | ---
uuid-100  | Term 2, Week 5     | Term 2  | 5           | true
uuid-101  | Term 2, Week 6     | Term 2  | 6           | false
```

**One is always `is_current = true`** (the week field staff should submit for).

### 4. **submissions** (The form responses)
When a user fills out the form and clicks "Submit", a row is created here.

```
id        | submitted_by | status    | data (JSON)           | submitted_at | week_label
---       | ---          | ---       | ---                   | ---          | ---
uuid-500  | uuid-123     | submitted | {"step1":{...}}       | 2026-03-21   | Term 2, Week 5
uuid-501  | uuid-123     | draft     | {"step1":{...}}       | null         | Term 2, Week 5
```

**Status values**:
- `draft` - User is still filling it out
- `submitted` - User clicked "Submit Final"
- `revision_requested` - Admin asked for changes
- `approved` - Admin approved it

**Important**: The `data` field is **JSON** (JavaScript Object Notation), which stores the entire form as text. When the form is filled:

```json
{
  "step1": { "field_name": "John", "region": "Central" },
  "step2": { "snapshot": "Growing" },
  "step3": { "metrics": { "scholars": 150 } }
}
```

### 5. **audit_log** (History/tracking)
Every action creates a row here. Think of it like a receipt.

```
id        | submission_id | actor_id  | action     | note              | created_at
---       | ---           | ---       | ---        | ---               | ---
uuid-600  | uuid-500      | uuid-123  | submitted  | Final submission  | 2026-03-21
uuid-601  | uuid-500      | uuid-456  | approved   | Looks good        | 2026-03-22
```

---

## Running Migrations

**Migrations** are like instructions to build the tables. They only run once.

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Link Your Project

In your project folder:

```bash
supabase link --project-ref xxx  # xxx is from your Supabase URL
```

When prompted for password, use the one you created on Supabase.

### Step 3: Run Migrations

```bash
supabase migration up
```

This runs the files in `supabase/migrations/` in order:
1. `001_schema.sql` - Creates the tables
2. `002_rls.sql` - Sets up security rules
3. `003_seed_weeks.sql` - Adds initial week data

### Step 4: Verify

Go to Supabase Dashboard → **Tables** in left sidebar.

You should see:
- `auth.users` (empty)
- `profiles` (empty)
- `week_config` (has 10 weeks)
- `submissions` (empty)
- `audit_log` (empty)

If you see these, **you're good!** ✅

---

## Testing the Connection

### Test from Your App

1. Create a test file `test-db.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'

export async function testConnection() {
  const supabase = createClient()
  
  // Test 1: Get current user
  const { data: userData } = await supabase.auth.getUser()
  console.log('Current user:', userData.user?.email)
  
  // Test 2: Get weeks
  const { data: weeks } = await supabase
    .from('week_config')
    .select('*')
  console.log('Weeks:', weeks)
  
  // Test 3: Get my submissions
  const { data: subs } = await supabase
    .from('submissions')
    .select('*')
  console.log('My submissions:', subs)
}
```

2. Run it in a page or API route
3. Check console for output

---

## Common Tasks

### Task 1: Create a Test User

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click "Create New User"
3. Email: `test@example.com`
4. Password: (any password)
5. Check "Auto confirm user" (so you don't need to verify email)
6. Click "Create User"

Now you can log in locally with this user!

### Task 2: Create a Draft Submission Manually

Sometimes it's useful to test with real data. You can insert a draft:

```typescript
// In an API route
const { error } = await supabase
  .from('submissions')
  .insert([{
    submitted_by: 'uuid-of-user',
    region: 'Central',
    week_label: 'Term 2, Week 5',
    status: 'draft',
    data: {
      step1: { field_name: 'Test', region: 'Central' }
    }
  }])

if (error) console.error('Error:', error)
```

### Task 3: Query All Submissions for a Week

```typescript
const { data: submissions } = await supabase
  .from('submissions')
  .select('*, submitted_by_profile:profiles(full_name, region)')
  .eq('week_label', 'Term 2, Week 5')

// Result:
// [
//   { id: 'uuid-500', week_label: 'Term 2, Week 5', submitted_by_profile: { full_name: 'John', region: 'Central' } }
// ]
```

### Task 4: Check Who Can See What

The database has **RLS (Row Level Security)** rules. These automatically hide data.

**What field_staff can see:**
- Their own profile
- Their own submissions only
- Their own audit log entries

**What admin can see:**
- All profiles
- All submissions across all users
- All audit log entries

These rules are in `supabase/migrations/002_rls.sql`. They run automatically—you don't need to do anything!

---

## Troubleshooting

### Problem: "Missing Supabase environment variables"

**Solution**: Check your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Then restart your dev server: `npm run dev`

### Problem: "SUPABASE_SERVICE_ROLE_KEY is missing"

**Solution**: This error happens in API routes. Check your server `.env.local` has:
```
SUPABASE_SERVICE_ROLE_KEY=...
```

### Problem: "Unauthorized" errors when querying

**Solution**: This is likely an **RLS** issue. Check:
1. Is the user logged in? (`auth.getUser()`)
2. Does the user have a profile in the `profiles` table?
3. Is the RLS policy correct in `002_rls.sql`?

### Problem: Tables aren't appearing in Dashboard

**Solution**: 
1. Refresh the page
2. Go to **Settings** → **Database** → make sure you can connect
3. Re-run migrations: `supabase migration up`

---

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand how data flows through your app
- Read [API.md](API.md) to understand each API endpoint
- Read [TESTING.md](TESTING.md) to learn how to write tests

---

**Questions?** Check the Supabase docs: https://supabase.com/docs

Last Updated: 2026-03-20
