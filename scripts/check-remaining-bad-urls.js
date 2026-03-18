#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' } }
})
async function main() {
  const bad = await db.productImage.findMany({
    where: { imageUrl: { not: { startsWith: 'http' } } },
    select: { id: true, imageUrl: true }
  })
  console.log('Non-http product image URLs:', bad.length)
  bad.slice(0, 10).forEach(i => console.log(' ', i.imageUrl))

  const total = await db.productImage.count()
  const withOldPath = await db.productImage.count({ where: { imageUrl: { contains: '/uploads/catalog/' } } })
  const withR2 = await db.productImage.count({ where: { imageUrl: { startsWith: 'https://pub-' } } })
  console.log(`\nTotal: ${total}, Old /uploads/catalog/ paths: ${withOldPath}, R2 URLs: ${withR2}`)

  // Sample of what's actually in DB
  const sample = await db.productImage.findMany({ take: 5, select: { imageUrl: true } })
  console.log('\nFirst 5 in DB:', sample.map(i => i.imageUrl))
}
main().catch(e => console.error(e.message)).finally(() => db.$disconnect())
