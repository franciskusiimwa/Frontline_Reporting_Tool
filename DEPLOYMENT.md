# Deployment Guide

This document outlines the process for deploying the PO Project (EXP Weekly Regional Update Platform) to production.

## Pre-Deployment Checklist

- [ ] All tests pass locally (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Unit tests pass (`npm run test`)
- [ ] Environment variables are configured in `.env.local`
- [ ] Database migrations are up-to-date
- [ ] Security review completed
- [ ] Staging environment tested
- [ ] Backup plan documented

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
UPSTASH_REDIS_REST_URL=your-upstash-rest-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-rest-token
NODE_ENV=production
```

Never commit `.env.local` to version control.

## Build Process

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run type checks
npm run typecheck

# Run unit tests
npm run test

# Build optimized production bundle
npm run build

# Test production build locally
npm start
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node Version: 18.x or higher

4. Deploy:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

### CI/CD Pipeline (GitHub Actions)

The project includes automated CI and deployment in `.github/workflows/ci-cd.yml`:

1. Lint + typecheck + tests + build
2. Security audit (`npm audit`)
3. Staging deploy (on `staging` branch pushes)
4. Production deploy (on `main` branch pushes)
5. Post-deploy health check (`/api/health`) for staging and production

Required GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Option 2: Netlify

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build Command: `npm run build`
   - Publish Directory: `.next/static`

3. Set environment variables in Netlify dashboard

### Option 3: Self-hosted (Docker/VM)

1. Build production bundle:
   ```bash
   npm run build
   ```

2. Create Docker setup (if applicable):
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY .next ./
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

3. Deploy to your server

4. Set up reverse proxy (Nginx/Apache)

5. Configure SSL/TLS certificates

## Database Setup

1. Provision Supabase project
2. Run migrations:
   ```bash
   npx supabase migration up
   ```

3. Seed initial data:
   ```bash
   psql -h your-db-host -U postgres -d your-db < supabase/migrations/003_seed_weeks.sql
   ```

## Post-Deployment Validation

0. **Health check**: Verify `/api/health` returns 200
1. **Health Check**: Verify all pages load
2. **Authentication**: Test login/logout flow
3. **Form Submission**: Test full workflow (submit → review → approve)
4. **Exports**: Verify CSV/PDF export functionality
5. **Admin Dashboard**: Check dashboard loads and displays data
6. **Performance**: Run Lighthouse audit
7. **Error Handling**: Trigger sample error and verify error boundary

## Rollback Plan

If critical issues occur post-deployment:

1. **Immediate Rollback**:
   - Vercel: Click "Rollback" in deployment history
   - Netlify: Deploy previous successful build
   - Self-hosted: Restore from previous container version

2. **Database Rollback**:
   - Keep backup of pre-deployment database state
   - Use Supabase backup/restore feature if needed

3. **Notify Stakeholders**:
   - Document what failed and when
   - Provide timeline for fix and redeploy

## Monitoring & Alerts

Set up monitoring for:

- **Uptime**: Use UptimeRobot or similar
- **Error Tracking**: Configure Sentry for error reporting
- **Performance**: Monitor Core Web Vitals via Google Analytics
- **Logs**: Stream application logs to centralized logging service

### Example Sentry Configuration

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## Scaling Considerations

- Use database connection pooling (Supabase manages this)
- Enable CDN for static assets
- Implement caching strategies
- Monitor database query performance

## Security Best Practices

1. Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code
2. Keep dependencies updated (`npm update`)
3. Enable CORS properly for API endpoints
4. Set up rate limiting on API routes
5. Enable HTTPS/TLS everywhere
6. Regular security audits

## Support & Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Connection Issues
- Verify Supabase URL and keys are correct
- Check firewall/security group settings
- Confirm database is accessible

### Performance Issues
- Check database query performance
- Review bundle size with `npm run build --analyze`
- Monitor server resource usage

## Contacts

- **Tech Lead**: [contact]
- **DevOps**: [contact]
- **Emergency**: [contact]

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | TBD  | Initial production release |

---

Last Updated: 2026-03-20
