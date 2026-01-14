# 🚀 Uyarvom Deployment - Connection Fix

**IMPORTANT:** After changing environment variables in Vercel, you MUST click **"Redeploy"** on the deployment for changes to take effect.

---

## 🛠️ THE FIX (Step-by-Step)

### 1. Update Vercel Env Vars
Go to **Vercel Settings → Environment Variables** and set TWO variables:

#### **Variable 1: `DATABASE_URL` (The Pooler)**
This uses port **6543** and is for the app logic.
```text
postgres://postgres:Uyarvomdb%40%23%235922@db.nwphbpiftvhwvsnurqun.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

#### **Variable 2: `DIRECT_URL` (Direct Connection)**
This uses port **5432** and is for Prisma migrations.
```text
postgres://postgres:Uyarvomdb%40%23%235922@db.nwphbpiftvhwvsnurqun.supabase.co:5432/postgres
```

### 2. TRIGGER REDEPLOY
1. Go to your **Deployments** tab in Vercel.
2. Click the **...** next to the latest "Failed" or "Error" deployment.
3. Select **Redeploy**.
4. Wait for it to finish.

---

## 🔍 Why the previous try failed:
- The error in the screenshot showed port **5432**.
- If you had updated Vercel with the new string (port 6543) but didn't **Redeploy**, Vercel kept using the old "5432" string.
- This is why you saw "database server at ... :5432" even after you thought you changed it.

---

## ✅ Post-Redeploy Verification:
1. Visit `/api/ping` (Should be OK).
2. Visit `/api/health`. 
   - If it still shows port `5432` in the error message, the Redeploy didn't work.
   - If it shows port `6543` and an error, we have a credential issue.
