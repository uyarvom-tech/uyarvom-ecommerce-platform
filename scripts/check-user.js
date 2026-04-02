#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function main() {
  const email = process.argv[2] || 'hpofficial420@gmail.com'
  
  // All users with this email
  const users = await db.user.findMany({ where: { email } })
  console.log('\nUsers with email:', email)
  users.forEach(u => console.log(`  id: ${u.id} | name: ${u.fullName}`))

  // All AdminUser records
  const admins = await db.adminUser.findMany({ include: { user: { select: { email: true } } } })
  console.log('\nAll AdminUser records:')
  admins.forEach(a => console.log(`  userId: ${a.userId} | role: ${a.role} | email: ${a.user?.email}`))
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => db.$disconnect())
