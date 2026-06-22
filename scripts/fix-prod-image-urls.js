/**
 * Update product image URLs in PROD DB from beta R2 URL to prod R2 URL.
 */
const { PrismaClient } = require('@prisma/client')

const PROD_URL = 'postgresql://postgres.poncfubviioirqpcqsge:Uyarvom2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
const BETA_R2 = 'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev'
const PROD_R2 = 'https://pub-46ed84286d6e4cf8afc208ed6c378a37.r2.dev'

const prod = new PrismaClient({ datasources: { db: { url: PROD_URL } } })

async function main() {
  console.log(`Updating image URLs: ${BETA_R2} → ${PROD_R2}`)

  // Update product_images
  const imgResult = await prod.$executeRawUnsafe(
    `UPDATE product_images SET "imageUrl" = REPLACE("imageUrl", '${BETA_R2}', '${PROD_R2}') WHERE "imageUrl" LIKE '${BETA_R2}%'`
  )
  console.log(`  product_images updated: ${imgResult}`)

  // Update categories
  const catResult = await prod.$executeRawUnsafe(
    `UPDATE categories SET "imageUrl" = REPLACE("imageUrl", '${BETA_R2}', '${PROD_R2}') WHERE "imageUrl" LIKE '${BETA_R2}%'`
  )
  console.log(`  categories updated: ${catResult}`)

  // Update hero_banners
  const bannerResult = await prod.$executeRawUnsafe(
    `UPDATE hero_banners SET "imageUrl" = REPLACE("imageUrl", '${BETA_R2}', '${PROD_R2}') WHERE "imageUrl" LIKE '${BETA_R2}%'`
  )
  console.log(`  hero_banners updated: ${bannerResult}`)

  console.log('\n✅ All image URLs updated to prod R2.')
}

main().catch(e => { console.error('Failed:', e.message); process.exit(1) }).finally(() => prod.$disconnect())
