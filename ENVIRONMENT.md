# Environment Setup Guide

This guide explains all environment variables used in the PO Project and how to configure them for different environments.

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values from your Supabase project

3. Never commit `.env.local` to version control

## Environment Variables Reference

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Type**: String (URL)
- **Required**: Yes
- **Scope**: Public (exposed to client)
- **Description**: The Supabase project URL
- **Example**: `https://xxxxxxx.supabase.co`
- **Where to find**: Supabase Dashboard → Project Settings → API

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type**: String (API Key)
- **Required**: Yes
- **Scope**: Public (exposed to client, safe to expose)
- **Description**: Anonymous API key for client-side Supabase operations
- **Security**: Limited by RLS policies on database
- **Where to find**: Supabase Dashboard → Project Settings → API

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Type**: String (API Key)
- **Required**: Yes (server-side only)
- **Scope**: Private (server-side only, NEVER expose to client)
- **Description**: Service role key for admin operations and bypassing RLS
- **Security**: ⚠️ SENSITIVE - Full database access
- **Where to find**: Supabase Dashboard → Project Settings → API
- **Usage**: Server-side API routes only (e.g., `/api/users`, auth operations)

### External APIs

#### `ANTHROPIC_API_KEY`
- **Type**: String (API Key)
- **Required**: No (only if using Claude for summarization)
- **Scope**: Private (server-side only)
- **Description**: API key for Anthropic's Claude API
- **Usage**: Report summarization feature
- **Where to get**: Anthropic Console → API Keys
- **Cost**: Per-token pricing

### Rate Limiting

#### `UPSTASH_REDIS_REST_URL`
- **Type**: String (URL)
- **Required**: Yes (production)
- **Scope**: Private (server-side only)
- **Description**: Upstash Redis REST endpoint used for distributed API rate limiting
- **Where to find**: Upstash Console → Redis Database → REST API

#### `UPSTASH_REDIS_REST_TOKEN`
- **Type**: String (Token)
- **Required**: Yes (production)
- **Scope**: Private (server-side only)
- **Description**: Auth token for Upstash Redis REST API
- **Where to find**: Upstash Console → Redis Database → REST API
- **Security**: ⚠️ SENSITIVE - Treat as secret

### Database

#### `DATABASE_URL`
- **Type**: String (Connection String)
- **Required**: No (Supabase handles this)
- **Scope**: Private (server-side only)
- **Description**: Direct PostgreSQL connection string (if needed for migrations)
- **Format**: `postgresql://user:password@host:port/database`

### Application Configuration

#### `NODE_ENV`
- **Type**: String (`development` | `production` | `test`)
- **Required**: No (defaults to `development`)
- **Scope**: Public
- **Description**: Execution environment
- **Values**:
  - `development`: Local development with hot reload, verbose logging
  - `production`: Optimized build, error reporting, no debug info
  - `test`: Testing environment

#### `NEXT_PUBLIC_APP_URL`
- **Type**: String (URL)
- **Required**: Yes (production)
- **Scope**: Public
- **Description**: Public URL of the application
- **Examples**:
  - Local: `http://localhost:3000`
  - Staging: `https://staging.yourdomain.com`
  - Production: `https://yourdomain.com`

## Environment Profiles

### Development (`npm run dev`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Notes**:
- Uses local Supabase instance (via `supabase start`)
- Debug outputting enabled
- Hot Module Reload active

### Staging (`npm run build`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_key
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
UPSTASH_REDIS_REST_URL=https://your-staging-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_staging_upstash_token
NODE_ENV=production
ANTHROPIC_API_KEY=your_staging_key
```

**Deployment Target**: Vercel/Netlify/staging server

### Production (`npm start`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
UPSTASH_REDIS_REST_URL=https://your-prod-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_prod_upstash_token
NODE_ENV=production
ANTHROPIC_API_KEY=your_prod_key
```

**Notes**:
- Use dedicated production Supabase project
- Enable monitoring and alerts
- Use distributed rate limiting via Upstash (required in production)
- Use secrets manager (AWS, Azure, HashiCorp Vault)
- Regular backups enabled

## Setting Environment Variables

### Local Development

Create `.env.local` in project root:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Vercel Deployment

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add variables for each environment (Preview, Staging, Production)
3. Restart deployment

```bash
# CLI method
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Netlify Deployment

1. Go to Site Settings → Build & Deploy → Environment
2. Add variables via:
   - Dashboard UI
   - `netlify.toml`:
     ```toml
     [build]
     environment = { NODE_VERSION = "18", NEXT_PUBLIC_SUPABASE_URL = "..." }
     ```

### Docker/Self-hosted

Pass as runtime arguments:
```bash
docker run -e NEXT_PUBLIC_SUPABASE_URL="..." -e NODE_ENV="production" myapp
```

Or in `.env` file mounted to container:
```bash
docker run --env-file .env.production myapp
```

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key never exposed to frontend
- [ ] All secrets stored in secure vault (not in code)
- [ ] Different keys for dev/staging/production
- [ ] Keys rotated regularly
- [ ] Access to keys restricted (RBAC)
- [ ] Monitoring enabled for API usage

## Troubleshooting

### "Missing required environment variable"
- Verify `.env.local` exists
- Check variable names exactly (case-sensitive)
- Restart dev server after adding variables: `npm run dev`

### "Supabase connection failed"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check network/firewall settings
- Ensure Supabase project is running
- Verify API keys are valid

### "Service role key errors"
- Confirm key is in `SUPABASE_SERVICE_ROLE_KEY` (not `NEXT_PUBLIC_*`)
- Verify RLS policies are configured in Supabase
- Check database permissions

## Environment Validation Script

The app automatically validates required environment variables on startup:

```typescript
// Validated in lib/supabase/client.ts
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing Supabase environment variables')
}
```

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

Last Updated: 2026-03-20
