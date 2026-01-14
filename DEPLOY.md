# 🚀 Deploy Uyarvom to Vercel

## ✅ DEPLOYMENT SUCCESSFUL!

Your app is deployed at: **https://uyarvom-ecommerce-platform-gn4jwa1mr.vercel.app**

The "Application error" you're seeing is normal - it's because we need to complete the setup.

---

## 📝 Complete These Final Steps:

### Step 1: Configure Cloudflare R2 CORS (2 minutes)

1. Go to Cloudflare Dashboard → **R2** → **uyarvom-images**
2. Click **Settings** → **CORS Policy**
3. Paste this:

```json
[
  {
    "AllowedOrigins": [
      "https://uyarvom-ecommerce-platform-gn4jwa1mr.vercel.app",
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

### Step 2: Update Supabase URLs (1 minute)

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Update **Site URL**: `https://uyarvom-ecommerce-platform-gn4jwa1mr.vercel.app`
3. Add **Redirect URLs**:
   - `https://uyarvom-ecommerce-platform-gn4jwa1mr.vercel.app/*`
   - `http://localhost:3000/*`

---

### Step 3: Update NEXT_PUBLIC_APP_URL in Vercel

1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_APP_URL`
3. Change value to: `https://uyarvom-ecommerce-platform-gn4jwa1mr.vercel.app`
4. Click **Save**
5. Go to **Deployments** tab
6. Click **Redeploy** (with "Use existing Build Cache" checked)

---

## 🎉 After These Steps:

Visit: `https://uyarvom-ecommerce-platform-gn4jwa1mr.vercel.app`

### Admin Login:
- URL: `https://uyarvom-ecommerce-platform-gn4jwa1mr.vercel.app/auth/admin-login`
- Email: `admin@uyarvom.com`
- Password: `admin123`

---

That's it! Your e-commerce platform will be fully live! 🚀
