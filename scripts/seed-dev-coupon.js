/**
 * Seed the DEV2026 test coupon — applies ₹1 total for dev testing.
 * Run: node scripts/seed-dev-coupon.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const coupon = await prisma.coupon.upsert({
    where: { code: 'DEV2026' },
    update: {
      type: 'fixed',
      value: 999999, // Huge discount that effectively makes total ₹1
      minOrderAmount: 0,
      maxDiscount: 999999,
      usageLimit: 0, // Unlimited
      perUserLimit: 0, // Unlimited per user
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-12-31'),
      isActive: true,
      description: 'Dev test coupon — reduces order to ₹1',
    },
    create: {
      code: 'DEV2026',
      type: 'fixed',
      value: 999999,
      minOrderAmount: 0,
      maxDiscount: 999999,
      usageLimit: 0,
      perUserLimit: 0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-12-31'),
      isActive: true,
      description: 'Dev test coupon — reduces order to ₹1',
    },
  })

  console.log('✅ DEV2026 coupon seeded:', coupon.id)
}

main().catch(console.error).finally(() => prisma.$disconnect())
