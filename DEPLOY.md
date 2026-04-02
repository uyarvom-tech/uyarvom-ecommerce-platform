# Uyarvom Deployment

## Environment Variables

Set the production values in Vercel Environment Variables, not in the repo:

- `DATABASE_URL` - pooled Postgres connection string
- `DIRECT_URL` - direct Postgres connection string for migrations

Example formats:

```text
postgres://<user>:<password>@<host>:6543/postgres?pgbouncer=true&connection_limit=1
postgres://<user>:<password>@<host>:5432/postgres
```

## Redeploy

After changing environment variables in Vercel, redeploy the latest deployment so the new values are picked up.

## Verification

1. Visit `/api/ping`.
2. Visit `/api/health` as an authenticated admin.
   - Expected result: a generic `status: ok` response.
   - If it returns `503`, the database connection needs attention.
