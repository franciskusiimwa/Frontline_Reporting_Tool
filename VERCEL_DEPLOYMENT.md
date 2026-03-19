# Vercel Deployment - Quick Start

**Deploy your project to production in 5 minutes.**

## Step 1: Sign Up for Vercel (if needed)

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

## Step 2: Import Your Repository

1. After signing in, click "Add New..." → "Project"
2. Click "Import Git Repository"
3. Paste your repo URL: `https://github.com/franciskusiimwa/Frontline_Reporting_Tool`
4. Click "Import"

## Step 3: Configure Environment Variables

1. Vercel will ask for environment variables
2. Add these variables (get values from your Supabase project):

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJyy...
NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN.vercel.app
NODE_ENV=production
```

**Where to find Supabase keys:**
- Go to https://supabase.com → Your Project → Settings → API
- Copy the Project URL and Anon Key
- Also copy the Service Role Key

3. Click "Add"

## Step 4: Deploy

1. Click "Deploy"
2. Vercel will start building (takes ~2-3 minutes)
3. You'll see a deployment URL like: `https://po-project-xxxxx.vercel.app`

## Step 5: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `reports.yourorg.com`)
4. Follow DNS instructions

## Step 6: Test Your Deployment

1. Go to your deployment URL
2. Create a test account
3. Fill out a form
4. Check Supabase to verify data was saved

## Post-Deployment

### Auto-Deploy on GitHub Push
From now on, whenever you push to the `main` branch:
```bash
git add .
git commit -m "Your changes"
git push
```

Vercel automatically rebuilds and deploys! 🚀

### View Logs
- Click your project in Vercel dashboard
- Click "Deployment" to see logs and status
- Click individual deployment to see build details

### Rollback if Issues
- Under "Deployments", click a previous deployment
- Click "Promote to Production" to revert

---

## Troubleshooting

### Build Fails
1. Check build logs in Vercel dashboard
2. Make sure `.env.local` has all required variables
3. Run `npm run build` locally to test

### Database Connection Failed
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check Supabase project is active
3. Ensure RLS policies allow access

### Pages Show 404
1. Check routes exist in `app/` folder
2. Verify no typos in file names
3. Restart deployment

---

## Environment Variables Reference

| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key from Supabase | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (server-side only) | `eyJyb2x...` |
| `NEXT_PUBLIC_APP_URL` | Your deployment domain | `https://yourapp.vercel.app` |
| `NODE_ENV` | Environment | `production` |

---

## You're Live! 🎉

Your app is now running on **Vercel** and accessible to the world!

**Next steps:**
1. Share the URL with your team
2. Create admin and field staff accounts
3. Start collecting submissions
4. Monitor the dashboard

**Questions?** See the full [DEPLOYMENT.md](../DEPLOYMENT.md) guide.

---

Last Updated: 2026-03-20
