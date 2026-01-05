# Vercel Deployment Guide

## Prerequisites

### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Wait for setup to complete
4. Go to Settings > API
5. Copy your Project URL and anon key

### 2. Set up PostgreSQL Database
**Option A: Use Supabase Database (Recommended)**
- Your Supabase project includes a PostgreSQL database
- Get connection string from Settings > Database > Connection string > URI

**Option B: Use Vercel Postgres**
1. Go to Vercel Dashboard
2. Create new project
3. Go to Storage tab
4. Create Postgres database
5. Copy connection string

**Option C: Use External Provider**
- Neon, PlanetScale, or Railway PostgreSQL

## Deployment Steps

### 1. Push to GitHub
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# Push to GitHub
git remote add origin https://github.com/yourusername/uyarvom-ecommerce.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:

#### Required Environment Variables:
```
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-super-secure-jwt-secret-key-256-bits
```

#### Optional Environment Variables:
```
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/jpg
```

### 3. Database Migration
After deployment, run database migration:

1. Go to Vercel Dashboard > Your Project > Functions
2. Or use Vercel CLI:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Run migration
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

### 4. File Upload Configuration
For production file uploads, you'll need to:

1. **Use Vercel Blob Storage** (Recommended)
   - Enable Vercel Blob in your project settings
   - Update upload API to use Vercel Blob

2. **Or use AWS S3/Cloudinary**
   - Set up external storage service
   - Update upload endpoints

## Post-Deployment Checklist

- [ ] Database connected and migrated
- [ ] Authentication working (Supabase)
- [ ] Admin panel accessible
- [ ] Product creation/editing working
- [ ] Image uploads working
- [ ] Role-based access control working
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

## Troubleshooting

### Build Errors
- Check TypeScript errors in build logs
- Ensure all environment variables are set
- Verify Prisma client generation

### Database Connection Issues
- Verify DATABASE_URL format
- Check database server accessibility
- Ensure SSL mode is configured

### Authentication Issues
- Verify Supabase URL and keys
- Check CORS settings in Supabase
- Ensure JWT_SECRET is set

## Performance Optimization

### After Deployment
1. Enable Vercel Analytics
2. Configure caching headers
3. Optimize images for production
4. Set up monitoring (Sentry, LogRocket)

### Scaling Considerations
- Monitor function execution time
- Consider upgrading Vercel plan for higher limits
- Implement database connection pooling
- Use CDN for static assets

## Cost Estimation

### Vercel Pro Plan: ~$20/month
- Includes: Hosting, CDN, Analytics
- Function execution: 1000 GB-hours
- Bandwidth: 1TB

### Database Costs:
- Supabase: $25/month (Pro plan)
- Vercel Postgres: $20/month (Pro plan)
- External providers: $10-30/month

### Total Monthly Cost: ~$40-50/month

## Support

For deployment issues:
1. Check Vercel build logs
2. Review environment variables
3. Test database connection
4. Verify Supabase configuration

## Next Steps After Deployment

1. Set up custom domain
2. Configure email notifications
3. Implement backup strategy
4. Set up monitoring and alerts
5. Plan for scaling and optimization