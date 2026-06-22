#!/usr/bin/env node
/**
 * Creates a super_admin account.
 * Usage: node scripts/create-admin.js <email> <password>
 * Example: node scripts/create-admin.js admin@uyarvom.com MyPass123
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { PrismaClient } = require('@prisma/client')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Use direct connection (port 5432) for scripts, not PgBouncer (6543)
const directUrl = process.env.DATABASE_URL.replace(':6543', ':5432').replace('pgbouncer=true&', '').replace('&pgbouncer=true', '').replace('?pgbouncer=true', '')
const db = new PrismaClient({ datasources: { db: { url: directUrl } } })

async function main() {
  const [email, password] = process.argv.slice(2)

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password>')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters')
    process.exit(1)
  }

  console.log(`\nCreating admin: ${email}`)

  // 1. Create or get Supabase auth user (using service role = no email confirmation needed)
  const { data: existing } = await supabase.auth.admin.listUsers()
  const existingUser = existing?.users?.find(u => u.email === email)

  let authUserId

  if (existingUser) {
    console.log('  Auth user already exists, updating password...')
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, { password })
    if (error) throw new Error('Failed to update password: ' + error.message)
    authUserId = existingUser.id
  } else {
    console.log('  Creating Supabase auth user...')
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation
    })
    if (error) throw new Error('Failed to create auth user: ' + error.message)
    authUserId = data.user.id
  }

  console.log(`  Auth user ID: ${authUserId}`)

  // 2. Upsert User in DB
  await db.user.upsert({
    where: { id: authUserId },
    update: { email },
    create: {
      id: authUserId,
      email,
      fullName: email.split('@')[0],
    },
  })
  console.log('  DB user record ready')

  // 3. Upsert AdminUser record
  await db.adminUser.upsert({
    where: { userId: authUserId },
    update: { role: 'super_admin', isActive: true },
    create: { userId: authUserId, role: 'super_admin', isActive: true },
  })
  console.log('  AdminUser record set: super_admin')

  console.log(`
✅ Done!
   Email:    ${email}
   Password: ${password}
   Role:     super_admin

   Login at: http://localhost:3001/auth/admin-login
`)
}

main()
  .catch(e => { console.error('ERROR:', e.message); process.exit(1) })
  .finally(() => db.$disconnect())
