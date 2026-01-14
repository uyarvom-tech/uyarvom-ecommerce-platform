# 🚀 Deploy Uyarvom to Vercel

## ✅ What I've Already Done For You:
- ✅ Fixed all build errors
- ✅ Set up your Supabase database schema
- ✅ Configured your .env.local with production credentials
- ✅ Pushed all changes to GitHub

---

## 📝 What YOU Need To Do:

### Step 1: Add Environment Variables to Vercel (5 minutes)

1. Go to [vercel.com](https://vercel.com) and login
2. Click **"New Project"**
3. Import: `HPTHECONQUEROR/uyarvom-ecommerce-platform`
4. **BEFORE clicking Deploy**, click **"Environment Variables"**
5. Copy-paste these variables ONE BY ONE:

```bash
DATABASE_URL
postgresql://postgres:Uyarvomdb%40%23%235922@db.nwphbpiftvhwvsnurqun.supabase.co:5432/postgres

NEXT_PUBLIC_SUPABASE_URL
https://nwphbpiftvhwvsnurqun.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cGhicGlmdHZod3ZzbnVycXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMDMwMTUsImV4cCI6MjA4Mzc3OTAxNX0.wr26AKjGzGutRpglF431JVd5VeTlbaCR-_0cVPHiZ0U

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cGhicGlmdHZod3ZzbnVycXVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIwMzAxNSwiZXhwIjoyMDgzNzc5MDE1fQ.fURfexccfiTudv26V_4bFxfqbL7E35QooQ5DdDkJvy8

R2_ACCOUNT_ID
c74b4cbf9c11d39a99c92bbd9bbc214b

R2_ACCESS_KEY_ID
1a03e1f58a5feae5cfe8cb1b5f106257

R2_SECRET_ACCESS_KEY
54584f9c87105d73104c9280c71194053199f4262dccf941260fecff034855dd

R2_BUCKET_NAME
uyarvom-images

R2_PUBLIC_URL
https://pub-c74b4cbf9c11d39a99c92bbd9bbc214b.r2.dev

JWT_SECRET
uyarvom-super-secure-jwt-secret-key-2025-production

NODE_ENV
production

UPLOAD_MAX_SIZE
10485760

ALLOWED_FILE_TYPES
image/jpeg,image/png,image/webp,image/jpg
```

6. For each variable, select **"Production, Preview, Development"**
7. Click **"Deploy"**
8. Wait 3-5 minutes

---

### Step 2: Configure Cloudflare R2 CORS (2 minutes)

1. Go to Cloudflare Dashboard → **R2** → **uyarvom-images**
2. Click **Settings** → **CORS Policy**
3. Paste this (replace YOUR-VERCEL-URL with your actual Vercel domain):

```json
[
  {
    "AllowedOrigins": [
      "https://YOUR-VERCEL-URL.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

4. Click **Save**

---

### Step 3: Update Supabase URLs (1 minute)

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Update **Site URL**: `https://YOUR-VERCEL-URL.vercel.app`
3. Add **Redirect URLs**:
   - `https://YOUR-VERCEL-URL.vercel.app/*`
   - `http://localhost:3000/*`

---

## 🎉 You're Live!

Visit: `https://YOUR-VERCEL-URL.vercel.app`

### Admin Login:
- URL: `https://YOUR-VERCEL-URL.vercel.app/auth/admin-login`
- Email: `admin@uyarvom.com`
- Password: `admin123`

---

## 🐛 If Something Breaks:

1. Check Vercel deployment logs
2. Verify all environment variables are added
3. Make sure CORS is configured in R2
4. Check Supabase redirect URLs match your domain

---

That's it! Your e-commerce platform is deployed. 🚀
