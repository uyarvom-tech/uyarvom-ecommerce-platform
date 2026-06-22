# 🚀 Uyarvom — Production Push Checklist

> Work through each section in order. Check off items as you complete them.

---

## Phase A: Database (Supabase Prod)

- [x] Push Prisma schema to prod DB (`node scripts/push-to-prod.js` ✅ Done)
- [x] Sync products, categories, images, variants from beta to prod (`node scripts/sync-beta-to-prod.js`)
- [x] Fix product-category links in prod (`node scripts/fix-prod-categories.js` — 308 links)
- [x] Create admin user in prod Supabase (manual SQL)

**Manual Steps:**
1. Go to prod Supabase Dashboard → SQL Editor
2. After you sign in with Google on the prod app, find your user ID in `auth.users`
3. Run:
   ```sql
   INSERT INTO admin_users (id, "userId", role, "isActive", "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), 'YOUR_USER_ID_HERE', 'super_admin', true, now(), now());
   ```

---

## Phase B: Supabase Auth Configuration

- [x] Go to Supabase Prod → Authentication → URL Configuration
- [x] Set Site URL to your production domain (e.g., `https://uyarvom.com`)
- [x] Add redirect URLs:
  - `https://uyarvom.com/auth/callback`
  - `https://uyarvom.com/auth/admin-login`
  - `http://localhost:3001/auth/callback` (for local testing)
- [x] Enable Google OAuth provider in Supabase Prod → Auth → Providers
- [x] Add your prod domain to Google Cloud Console → OAuth → Authorized redirect URIs:
  - `https://poncfubviioirqpcqsge.supabase.co/auth/v1/callback`

---

## Phase C: Cloudflare R2 (Image Storage)

- [x] Prod R2 bucket exists: `uyarvom-images`
- [x] R2 API credentials configured
- [x] Public URL set: `https://pub-46ed84286d6e4cf8afc208ed6c378a37.r2.dev`
- [x] Images synced from beta to prod (165 objects — `node scripts/sync-r2-beta-to-prod.js`)
- [x] Product image URLs in prod DB updated to prod R2 URL (`node scripts/fix-prod-image-urls.js`)

**How to copy images (rclone):**
```bash
# Install rclone, then:
rclone config  # Add r2-beta and r2-prod remotes
rclone sync r2-beta:uyarvom-images-beta r2-prod:uyarvom-images-prod
```

Or manually: Cloudflare Dashboard → R2 → Beta Bucket → Download all → Upload to Prod Bucket.

---

## Phase D: Vercel Deployment

- [ ] Connect your GitHub repo to Vercel (if not already)
- [ ] Set all production environment variables in Vercel (Settings → Environment Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://postgres.poncfubviioirqpcqsge:Uyarvom2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10` | Prod Supabase pooler |
| `DIRECT_URL` | `postgresql://postgres.poncfubviioirqpcqsge:Uyarvom2026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres` | Prod Supabase direct |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://poncfubviioirqpcqsge.supabase.co` | Prod Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...Ff7JAAThUFz...` | Prod anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...09hi4i0ikv...` | Prod service role |
| `R2_ACCOUNT_ID` | `c08825f6d9d99fd75c640ae57c5e97f2` | Same Cloudflare account |
| `R2_ACCESS_KEY_ID` | _(your prod R2 key)_ | From Phase C |
| `R2_SECRET_ACCESS_KEY` | _(your prod R2 secret)_ | From Phase C |
| `R2_BUCKET_NAME` | `uyarvom-images-prod` | Prod bucket |
| `R2_PUBLIC_URL` | _(your prod R2 public URL)_ | From Phase C |
| `NEXT_PUBLIC_APP_URL` | `https://uyarvom.com` | Your domain |
| `GEMINI_API_KEY` | `AQ.Ab8RN6I5iUt7dr...` | Same key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIzaSyDfQLwFwPbKk...` | Same key |
| `RAZORPAY_KEY_ID` | _(live key — do later)_ | Phase F |
| `RAZORPAY_KEY_SECRET` | _(live secret — do later)_ | Phase F |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | _(same as RAZORPAY_KEY_ID)_ | Phase F |
| `NODE_ENV` | `production` | Auto-set by Vercel |

- [ ] Deploy: `git push origin main` or run `vercel --prod`
- [ ] Verify deployment is live and accessible

---

## Phase E: Domain & DNS

- [ ] Add custom domain in Vercel → Project → Settings → Domains
- [ ] Update DNS records (CNAME or A record as Vercel instructs)
- [ ] Wait for SSL certificate provisioning (automatic, takes a few minutes)
- [ ] Verify `https://uyarvom.com` loads correctly
- [ ] Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to match final domain

---

## Phase F: Razorpay (Live Payment) — Do Last

- [ ] Go to Razorpay Dashboard → Switch to Live Mode
- [ ] Get Live API Key ID + Secret
- [ ] Update Vercel env vars:
  - `RAZORPAY_KEY_ID` = live key
  - `RAZORPAY_KEY_SECRET` = live secret
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = live key
- [ ] Set up Razorpay Webhook (optional, for auto-confirmation):
  - URL: `https://yourdomain.com/api/checkout/verify`
  - Events: `payment.captured`, `payment.failed`
- [ ] Test with a real ₹1 transaction and refund it

---

## Phase G: Google Maps API Key Restriction

- [ ] Go to Google Cloud Console → Credentials → Your Maps API Key
- [ ] Click "Restrict Key"
- [ ] Under "Application restrictions" → HTTP referrers:
  - `https://uyarvom.com/*`
  - `https://www.uyarvom.com/*`
  - `http://localhost:3001/*` (for local dev)
- [ ] Under "API restrictions" → Restrict to:
  - Maps JavaScript API
  - Places API
  - Geocoding API

---

## Phase H: Post-Launch Verification

- [ ] Homepage loads with products
- [ ] Product images display from R2 prod
- [ ] Google login works (OAuth redirects correctly)
- [ ] Admin dashboard accessible after login
- [ ] Add to cart works
- [ ] Checkout with Google Maps address picker works
- [ ] COD order placement works
- [ ] Online payment works (after Razorpay live keys added)
- [ ] Order confirmation shows in "My Orders"
- [ ] Admin can view/fulfill orders
- [ ] Support ticket creation works
- [ ] Product search works

---

## Quick Command Reference

```bash
# Push schema to prod
node scripts/push-to-prod.js

# Import products to prod (create this script or modify env temporarily)
# Temporarily set DATABASE_URL to prod, then:
node scripts/import-products-from-excel.js
node scripts/fix-variant-stock.js

# Deploy to Vercel
vercel --prod

# Or push to trigger auto-deploy
git add . && git commit -m "Production release" && git push origin main
```

---

## Current Status

| Phase | Status |
|-------|--------|
| A. Database Schema | ✅ Pushed |
| A. Product/Category Data Sync | ✅ 154 products, 145 categories, 308 links synced |
| A. Admin User | ✅ Done (manual) |
| B. Supabase Auth Config | ✅ Done (manual — Site URL, redirects, Google OAuth) |
| C. R2 Storage | ✅ Synced (165 images + URLs updated) |
| D. Vercel Deploy | ⬜ Pending |
| E. Domain & DNS | ⬜ Pending |
| F. Razorpay Live | ⬜ Do last |
| G. Google Maps Restrict | ⬜ After domain set |
| H. Verification | ⬜ After all above |
