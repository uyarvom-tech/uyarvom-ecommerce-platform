# 🚀 Uyarvom Deployment - Debugging Runtime Error

**Status:** Pushed enhanced diagnostic code. Vercel is auto-deploying.

---

## 🔍 DIAGNOSTIC STEPS (Check these in order):

### 1. Simple Ping (API Check):
Visit: `https://uyarvom-ecommerce-platform-gn4jwa1mr.vercel.app/api/ping`
- **If 404:** Next.js Routing is failing. Check if the project is built correctly on Vercel.
- **If JSON:** API routes are working! Proceed to Step 2.

### 2. Health Check (DB Check):
Visit: `https://uyarvom-ecommerce-platform-gn4jwa1mr.vercel.app/api/health`
- This now has a **5-second timeout** and detailed environment reporting.
- It will show if `DATABASE_URL` is detected and if the connection fails.

---

## 🔧 Critical Fix: DATABASE_URL

The error `Can't reach database server at db.nwphbpiftvhwvsnurqun.supabase.co:5432` means the connection is being blocked or the credentials/host are wrong.

### Check 1: URL Encoding (Most Likely)
In **Vercel → Settings → Environment Variables**, your password MUST be encoded.
- `@` ➔ `%40`
- `#` ➔ `%23`

**Correct Pattern:**
`postgresql://postgres:Uyarvomdb%40%23%235922@db.nwphbpiftvhwvsnurqun.supabase.co:5432/postgres`

### Check 2: Try IPv4 vs IPv6
If the above fails, try adding `?connect_timeout=30` to the end of the URL.
Or, if Supabase is using IPv6 and Vercel is struggling, use the **Transaction** connection string (port 6543) instead of 5432.

### Check 3: Supabase Paused?
Log in to Supabase and ensure the project isn't "Paused". If it is, click "Restore project".

---

## ⏳ What to do now:
1. Wait for Vercel to finish the new deployment.
2. Visit `/api/ping` first. If it works, try `/api/health`.
3. If `/api/health` shows `database: "error: ..."`, the `DATABASE_URL` definitely needs fixing in Vercel settings.
