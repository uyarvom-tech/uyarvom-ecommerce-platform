#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' } }
})
async function main() {
  // Find the specific product from the network tab URL
  const imgs = await db.productImage.findMany({
    where: { imageUrl: { contains: 'uy-hd-irn-cnd-std' } },
    select: { id: true, imageUrl: true }
  })
  console.log('Found:', imgs)

  // Also check variants table if exists
  const variants = await db.productVariant.findMany({
    where: { sku: { contains: 'UY-HD-IRN-CND' } },
    include: { images: { select: { imageUrl: true } } }
  }).catch(() => [])
  console.log('Variants:', variants.slice(0,3))
}
main().catch(e => console.error(e.message)).finally(() => db.$disconnect())
