const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' } } })
async function main() {
  const imgs = await p.productImage.findMany({ select: { imageUrl: true }, take: 3 })
  const cats = await p.category.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true }, take: 3 })
  console.log('Product images (first 3):', imgs.map(i => i.imageUrl))
  console.log('Category images:', cats.map(c => c.imageUrl))
}
main().finally(() => p.$disconnect())