# 🚀 Uyarvom E-commerce Platform - Production Deployment Guide

This guide will help you deploy the Uyarvom e-commerce platform to production using **Vercel + Supabase + Cloudflare R2**.

## 📋 Prerequisites

- GitHub account
- Vercel account
- Supabase account
- Cloudflare account
- Domain name (optional, for custom R2 URLs)

---

## 🗄️ Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project:
   - **Name**: `uyarvom-ecommerce`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Wait for project to be ready (2-3 minutes)

### 1.2 Get Database Connection Details
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format) 
3. Replace `[YOUR-PASSWORD]` with your actual password
4. Save this as your `DATABASE_URL`
postgresql://postgres:Uyarvomdb@##5922@db.nwphbpiftvhwvsnurqun.supabase.co:5432/postgres

### 1.3 Enable Authentication
1. Go to **Authentication** → **Settings**
2. Enable **Email** provider
3. Configure **Site URL**: `https://your-app.vercel.app`
4. Add **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 1.4 Set Up Row Level Security (RLS)
1. Go to **SQL Editor**
2. Run this SQL to create admin users table:

```sql
-- Create admin_users table
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'super_admin')),
  permissions TEXT DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users
CREATE POLICY "Admin users can view all admin records" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role IN ('admin', 'super_admin')
    )
  );
```

### 1.5 Create Your First Admin User
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter your email and password
4. Copy the **User ID**
5. Go to **SQL Editor** and run:

```sql
INSERT INTO admin_users (user_id, role) 
VALUES ('your-user-id-here', 'super_admin');
```

---

## 📁 Step 2: Set Up Cloudflare R2

### 2.1 Create R2 Bucket
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. **Bucket name**: `uyarvom-images` (or your preferred name)
5. **Location**: Choose closest to your users
6. Click **Create bucket**

### 2.2 Configure CORS
1. Go to your bucket → **Settings**
2. Scroll to **CORS policy**
3. Add this configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://your-app.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 2.3 Create API Token
1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use **Custom token** template
4. **Token name**: `Uyarvom R2 Access`
5. **Permissions**:
   - Account: `Cloudflare R2:Edit`
   - Zone Resources: `Include - All zones`
6. Click **Continue to summary** → **Create Token**
7. **Save the token** - you won't see it again!

for this i didnt found r2:edit and all but i did added this  token = _heqZ4E-eyarcJsB0_Ba34tSJfDAN08SaWvW0aix

Permissions:-
Workers R2 Storage
Read
Workers R2 Storage
Edit



### 2.4 Get Account ID
1. Go to Cloudflare Dashboard
2. Copy your **Account ID** from the right sidebar

### 2.5 Set Up Custom Domain (Optional)
1. Go to your bucket → **Settings**
2. Click **Connect Domain**
3. Enter your domain: `images.yourdomain.com`
4. Follow DNS setup instructions
5. Wait for SSL certificate (5-10 minutes)

---

## 🌐 Step 3: Deploy to Vercel

### 3.1 Push Code to GitHub
1. Create a new GitHub repository
2. Push your code:

```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 3.2 Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. **Framework Preset**: Next.js
5. **Root Directory**: `./` (default)
6. **IMPORTANT**: Click **Environment Variables** to add them BEFORE deploying
7. Add all environment variables from Step 3.3 below
8. After adding environment variables, click **Deploy**

> **Note**: The build will fail if environment variables are not set first, especially `DATABASE_URL`.

### 3.3 Configure Environment Variables
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these variables:

```bash
# Database (from Supabase Step 1.2)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Supabase (from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2 (from Step 2)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=uyarvom-images
R2_PUBLIC_URL=https://images.yourdomain.com

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production

# File Upload
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

### 3.4 Deploy Database Schema (AFTER Vercel deployment succeeds)
1. In your local project, create a `.env` file with your production `DATABASE_URL`
2. Run database migration:

```bash
npx prisma db push
```

3. Verify tables were created in Supabase → **Table Editor**

> **Important**: Only run this AFTER your Vercel deployment succeeds. The build no longer tries to push the database schema automatically.

### 3.5 Test Your Deployment
1. Wait for Vercel deployment to complete
2. Visit your live site URL
3. Test basic functionality (should work without database initially)
4. After running database schema (Step 3.4), test full functionality

---

## 📊 Step 4: Migrate Existing Data

### 4.1 Export Local Data
1. Create a backup script:

```bash
# Create data export
sqlite3 dev.db ".dump" > data_backup.sql
```

### 4.2 Convert and Import Data
1. Convert SQLite data to PostgreSQL format
2. Import categories and products manually through admin panel
3. Upload images to R2 and update URLs

---

## ✅ Step 5: Post-Deployment Checklist

### 5.1 Test Core Features
- [ ] User registration/login works
- [ ] Admin login works with your admin account
- [ ] Product catalog displays correctly
- [ ] Image uploads work
- [ ] Category management works
- [ ] Product creation works

### 5.2 Configure Domain (Optional)
1. Add custom domain in Vercel
2. Update Supabase redirect URLs
3. Update CORS settings in R2

### 5.3 Set Up Monitoring
1. Enable Vercel Analytics
2. Set up error tracking
3. Configure uptime monitoring

---

## 🔧 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure IP restrictions allow Vercel

**Dependency/Lockfile Errors**
- Run `pnpm install` locally to update lockfile
- Remove `pnpm-lock.yaml` and run `pnpm install` again
- Push updated lockfile to GitHub
- Redeploy on Vercel

**Authentication Issues**
- Verify Supabase keys are correct
- Check redirect URLs match exactly
- Ensure RLS policies are set up

**Image Upload Failures**
- Verify R2 credentials are correct
- Check CORS configuration
- Ensure bucket permissions are set

**Build Failures**
- Check all environment variables are set
- Verify dependencies are installed
- Review build logs for specific errors

---

## 💰 Expected Costs

### Monthly Estimates:
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month  
- **Cloudflare R2**: ~$5/month (for moderate usage)
- **Total**: ~$50/month

### Free Tier Limits:
- **Vercel Hobby**: Free (good for testing)
- **Supabase Free**: 500MB database, 50MB storage
- **Cloudflare R2**: 10GB storage, 1M requests/month

---

## 🎉 You're Live!

Your Uyarvom e-commerce platform is now running in production with:
- ✅ Scalable database (Supabase PostgreSQL)
- ✅ Secure authentication (Supabase Auth)
- ✅ Fast image delivery (Cloudflare R2)
- ✅ Global deployment (Vercel)

**Next Steps:**
1. Set up your product catalog
2. Configure payment processing
3. Add analytics and monitoring
4. Optimize for SEO

Need help? Check the troubleshooting section or create an issue in the repository.