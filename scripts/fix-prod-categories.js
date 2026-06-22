/**
 * Fix ProductCategories in prod — delete existing and re-insert from beta.
 */
const { PrismaClient } = require('@prisma/client')

const BETA_URL = 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom%402026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
const PROD_URL = 'postgresql://postgres.poncfubviioirqpcqsge:Uyarvom2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'

const beta = new PrismaClient({ datasources: { db: { url: BETA_URL } } })
const prod = new PrismaClient({ datasources: { db: { url: PROD_URL } } })

async function main() {
  console.log('Reading product categories from beta...')
  const pcs = await beta.productCategory.findMany()
  console.log(`Found ${pcs.length} product-category links`)

  console.log('Clearing prod product_categories...')
  await prod.productCategory.deleteMany({})

  console.log('Inserting to prod in batches...')
  let inserted = 0
  const batchSize = 20

  for (let i = 0; i < pcs.length; i += batchSize) {
    const batch = pcs.slice(i, i + batchSize)
    try {
      await prod.productCategory.createMany({
        data: batch.map(pc => ({
          id: pc.id,
          productId: pc.productId,
          categoryId: pc.categoryId,
          isPrimary: pc.isPrimary,
          createdAt: pc.createdAt,
        })),
        skipDuplicates: true,
      })
      inserted += batch.length
    } catch (err) {
      console.log(`  Batch ${i} failed: ${err.message.slice(0, 60)}`)
    }
  }

  console.log(`\n✅ Done. Inserted ${inserted} product-category links to prod.`)
}

main()
  .catch(e => { console.error('Failed:', e.message); process.exit(1) })
  .finally(async () => { await beta.$disconnect(); await prod.$disconnect() })
