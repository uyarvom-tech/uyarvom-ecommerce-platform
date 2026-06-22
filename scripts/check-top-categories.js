#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' } }
})

async function main() {
  // Only top-level categories (parentId = null) — these are the round circles
  const cats = await db.category.findMany({
    where: { parentId: null },
    select: { name: true, slug: true, imageUrl: true },
    orderBy: { displayOrder: 'asc' }
  })
  console.log('\n=== TOP-LEVEL CATEGORIES (round circles) ===')
  cats.forEach(c => console.log(`  ${c.name} [${c.slug}]: ${c.imageUrl || 'NULL'}`))

  // Also check heroBanner
  const banners = await db.heroBanner.findMany({ select: { title: true, imageUrl: true } }).catch(() => [])
  console.log('\n=== HERO BANNERS ===')
  banners.forEach(b => console.log(`  ${b.title}: ${b.imageUrl || 'NULL'}`))
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => db.$disconnect())
