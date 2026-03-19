# Quick Start Guide for Junior Developers

**Get the project running on your computer in 15 minutes.**

## Prerequisites

Make sure you have these installed:

1. **Node.js** (v18+): [Download](https://nodejs.org)
   - Check: `node --version` (should show `v18.x.x`)

2. **Git**: [Download](https://git-scm.com)
   - Check: `git --version`

3. **A Code Editor**: [VS Code](https://code.visualstudio.com) recommended

4. **Terminal**: Already have one (PowerShell on Windows, Terminal on Mac/Linux)

---

## Step 1: Clone the Project

Open your terminal and run:

```bash
# Navigate to where you want the project
cd ~/Documents

# Clone the repository
git clone https://github.com/YOUR-ORG/po-project.git
cd po-project
```

If you don't have git access yet, ask your tech lead for the GitHub link.

---

## Step 2: Install Dependencies

```bash
npm install
```

This downloads all the code libraries the project needs.

**Expected time**: 2-3 minutes

**You should see**: `added XXX packages` at the end

---

## Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# From project root:
cp .env.example .env.local
```

Now open `.env.local` in your editor and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-KEY-HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Where to get these values**:
1. Go to https://supabase.com and sign in
2. Click on your project
3. Go to **Settings** → **API**
4. Copy the URL and keys into `.env.local`

**Don't have a Supabase project yet?** See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

---

## Step 4: Start the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.1.7 (Turbopack)
- Environments: .env.local

✓ Ready in 2.5s
✓ Ready on http://localhost:3000
```

---

## Step 5: Open in Browser

Open your browser and go to:

```
http://localhost:3000
```

You should see the app! 🎉

---

## Common First Tasks

### Task 1: Create a Test Account

1. Go to http://localhost:3000/login
2. Click "Don't have an account? Register"
3. Fill in:
   - Email: `testuser@example.com`
   - Password: anything (e.g., `Test123!!`)
   - Full Name: `Test User`
   - Region: `Central`
4. Click "Register"

### Task 2: Fill Out a Test Form

1. After logging in, click "Submit Weekly Report"
2. Fill in Step 1 (Basic Info)
3. Click "Save as Draft"
4. You should see "Saved!" message
5. Click "Next" to see Step 2

### Task 3: Check the Network

1. Open browser DevTools: `F12` or `Right Click → Inspect`
2. Go to **Network** tab
3. As you click "Save as Draft", you'll see an API call to `/api/draft`
4. Click on it to see the data being sent

### Task 4: Check the Database

1. Go to https://supabase.com and log in
2. Click your project
3. Go to **Tables** in left sidebar
4. Click **submissions**
5. You should see your test submission with status `draft`

---

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter (check code style)
npm run lint

# Start production server (after build)
npm start

# Stop server
Ctrl + C
```

---

## Project Structure Basics

```
po-project/
├── app/              ← Pages and routes
├── components/       ← Reusable UI pieces
├── lib/              ← Helper functions and utilities
├── public/           ← Static files
├── supabase/         ← Database setup
├── package.json      ← Dependencies list
└── .env.local        ← Your secrets
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed structure explanation.

---

## Making Your First Change

### Change 1: Update the Page Title

1. Open `app/(field)/submit/page.tsx`
2. Find this line:
   ```tsx
   <h1 className="text-2xl font-semibold">Submit Weekly Report</h1>
   ```
3. Change "Submit Weekly Report" to something else
4. Save the file
5. Browser automatically reloads! ✨

### Change 2: Add a Button

1. Open `components/ui/Button.tsx`
2. Add a new style:
   ```tsx
   if (variant === 'success') {
     return 'bg-green-600 hover:bg-green-700'
   }
   ```
3. Now use it:
   ```tsx
   <Button variant="success">Click me</Button>
   ```

---

## Debugging Tips

### Using `console.log()`

Add logging to see what's happening:

```typescript
function MyComponent() {
  const { formData } = useSubmission()
  
  console.log('Current form data:', formData)  // ← You'll see this in browser console
  
  return <div>...</div>
}
```

**View output**:
- Open DevTools: `F12`
- Go to **Console** tab
- You'll see your log messages

### Using DevTools Debugger

```typescript
function MyComponent() {
  debugger  // ← Execution will pause here
  return <div>...</div>
}
```

Then in DevTools:
- Click "Continue" to resume
- Hover over variables to see values
- Step through line by line

### Checking API Calls

1. Open DevTools
2. Go to **Network** tab
3. Do an action (save form, approve, etc.)
4. You'll see the API call listed
5. Click on it to see:
   - Request (what you sent)
   - Response (what you got)
   - Headers (metadata)

---

## Common Problems

### Problem: "npm command not found"

**Solution**: Node.js isn't installed or not in PATH
```bash
# Check if installed:
node --version

# If not, download from: https://nodejs.org
```

### Problem: "Cannot find module '@supabase/supabase-js'"

**Solution**: Dependencies not installed
```bash
npm install
```

### Problem: "SUPABASE_SERVICE_ROLE_KEY is missing"

**Solution**: Check `.env.local` has the correct key
```bash
echo $SUPABASE_SERVICE_ROLE_KEY  # Linux/Mac
echo %SUPABASE_SERVICE_ROLE_KEY%  # Windows
```

### Problem: "Cannot connect to Supabase"

**Solution**: Check your `.env.local`:
1. URL should be like `https://xxx.supabase.co`
2. Keys should start with `eyJ`
3. Restart dev server after changing `.env.local`

### Problem: "Port 3000 already in use"

**Solution**: Another app is using port 3000
```bash
# Start on different port:
npm run dev -- -p 3001

# Then go to http://localhost:3001
```

---

## Next Steps After Getting Running

1. **Read the docs**:
   - [ARCHITECTURE.md](ARCHITECTURE.md) - How everything connects
   - [API.md](API.md) - What each endpoint does
   - [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Database details

2. **Make your first feature**:
   - Add a new input field to a form
   - Update the Zod schema in `lib/schemas.ts`
   - Test by submitting the form

3. **Run the build**:
   ```bash
   npm run build
   ```
   This checks if everything works in production mode

4. **Join project meetings** to understand business context

---

## Useful Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zod Validation**: https://zod.dev
- **Supabase Docs**: https://supabase.com/docs

---

## Getting Help

1. **Check the docs first** - Most answers are in this folder
2. **Search GitHub Issues** - Someone might have had same problem
3. **Ask the team** - Never hesitate to ask in Slack/Teams
4. **Google it** - Errors are usually shared by thousands of devs

---

## Staying Updated

Your team might update the code while you're working. To get latest changes:

```bash
# Download latest from GitHub
git pull

# Install any new dependencies
npm install

# Restart dev server
npm run dev
```

---

## Tips for Success

✅ **Do**:
- Read the documentation
- Ask questions when stuck
- Test your changes
- Commit regularly
- Read error messages carefully

❌ **Don't**:
- Never commit `.env.local` (it has secrets!)
- Don't ignore error messages
- Don't make massive changes without testing
- Don't push directly to main branch

---

## You're Ready! 🚀

You've got everything set up. Now:

1. Explore the code
2. Make small changes
3. Break things (it's okay!)
4. Ask questions
5. Have fun!

---

Last Updated: 2026-03-20
