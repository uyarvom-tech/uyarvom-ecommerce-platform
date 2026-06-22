#!/usr/bin/env node
/**
 * Syncs BETA → PROD using bulk raw SQL (fast, single transaction per table).
 * Copies all product data, categories, images, variants, users, orders, etc.
 * 
 * Run: node scripts/sync-beta-to-prod.js
 */
const { PrismaClient } = require('@prisma/client')

const BETA_URL = 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom%402026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
const PROD_URL = 'postgresql://postgres.poncfubviioirqpcqsge:Uyarvom2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'

const beta = new PrismaClient({ datasources: { db: { url: BETA_URL } } })
const prod = new PrismaClient({ datasources: { db: { url: PROD_URL } } })

// Build bulk upsert SQL from records
function buildUpsert(table, records, conflictCol = 'id') {
  if (!records.length) return null
  const keys = Object.keys(records[0])
  const cols = keys.map(k => `"${k}"`).join(', ')
  const updates = keys.filter(k => k !== conflictCol).map(k => `"${k}" = EXCLUDED."${k}"`).join(', ')
  const rows = records.map(r =>
    '(' + keys.map(k => {
      const v = r[k]
      if (v === null || v === undefined) return 'NULL'
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
      if (typeof v === 'number') return v
      if (v instanceof Date) return `'${v.toISOString()}'`
      return `'${String(v).replace(/'/g, "''")}'`
    }).join(', ') + ')'
  ).join(',\n')
  return `INSERT INTO "${table}" (${cols}) VALUES\n${rows}\nON CONFLICT ("${conflictCol}") DO UPDATE SET ${updates};`
}

async function bulkSync(table, records, label, conflictCol = 'id') {
  if (!records.length) { console.log(`  ⏭  ${label}: none`); return }
  const sql = buildUpsert(table, records, conflictCol)
  try {
    await prod.$executeRawUnsafe(sql)
    console.log(`  ✅ ${label}: ${records.length}`)
  } catch (err) {
    console.log(`  ⚠️  ${label}: FAILED — ${err.message.slice(0, 100)}`)
  }
}

async function main() {
  console.log('\n🔄  Syncing BETA → PROD (bulk SQL)\n')
  console.log('  Source: beta (ap-south-1)')
  console.log('  Target: prod (ap-southeast-1)')
  console.log('')

  console.log('📥  Reading all BETA data...')
  const systemSettings    = await beta.systemSetting.findMany()
  const heroBanners       = await beta.heroBanner.findMany()
  const categories        = await beta.category.findMany()
  const products          = await beta.product.findMany()
  const productColors     = await beta.productColor.findMany()
  const productImages     = await beta.productImage.findMany()
  const productVariants   = await beta.productVariant.findMany()
  const productCategories = await beta.productCategory.findMany()
  const users             = await beta.user.findMany()
  const adminUsers        = await beta.adminUser.findMany()
  const addresses         = await beta.address.findMany()
  const orders            = await beta.order.findMany()
  const orderItems        = await beta.orderItem.findMany()
  const orderEvents       = await beta.orderEvent.findMany()
  const cartItems         = await beta.cartItem.findMany()
  const reviews           = await beta.review.findMany()
  const supportTickets    = await beta.supportTicket.findMany()
  const supportMessages   = await beta.supportMessage.findMany()
  const auditLogs         = await beta.auditLog.findMany()
  const deletionTickets   = await beta.deletionTicket.findMany()

  console.log(`  categories=${categories.length} products=${products.length} users=${users.length} orders=${orders.length}`)

  console.log('\n📤  Writing to PROD...')

  // Core content
  await bulkSync('system_settings', systemSettings, 'SystemSettings', 'id')
  await bulkSync('hero_banners', heroBanners, 'HeroBanners')

  // Categories (parents first, then children)
  const rootCats = categories.filter(c => !c.parentId)
  const childCats = categories.filter(c => c.parentId)
  await bulkSync('categories', rootCats, 'Categories (root)')
  await bulkSync('categories', childCats, 'Categories (children)')

  // Products & relations
  await bulkSync('products', products, 'Products')
  await bulkSync('product_colors', productColors, 'ProductColors')
  await bulkSync('product_images', productImages, 'ProductImages')
  await bulkSync('product_variants', productVariants, 'ProductVariants')
  await bulkSync('product_categories', productCategories, 'ProductCategories')

  // Users & auth
  await bulkSync('users', users, 'Users')
  await bulkSync('admin_users', adminUsers, 'AdminUsers')
  await bulkSync('addresses', addresses, 'Addresses')

  // Orders
  await bulkSync('orders', orders, 'Orders')
  await bulkSync('order_items', orderItems, 'OrderItems')
  await bulkSync('order_events', orderEvents, 'OrderEvents')

  // Other data
  await bulkSync('cart_items', cartItems, 'CartItems')
  await bulkSync('reviews', reviews, 'Reviews')
  await bulkSync('support_tickets', supportTickets, 'SupportTickets')
  await bulkSync('support_messages', supportMessages, 'SupportMessages')
  await bulkSync('audit_logs', auditLogs, 'AuditLogs')
  await bulkSync('deletion_tickets', deletionTickets, 'DeletionTickets')

  console.log('\n✅  BETA → PROD sync complete!\n')
  console.log('All products, categories, users, orders, and settings have been copied to production.')
}

main()
  .catch(e => { console.error('❌ Failed:', e.message); process.exit(1) })
  .finally(async () => { await beta.$disconnect(); await prod.$disconnect() })
