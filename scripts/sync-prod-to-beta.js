#!/usr/bin/env node
/**
 * Syncs prod → beta using bulk raw SQL (fast, single transaction per table)
 */
const { PrismaClient } = require('@prisma/client')

const PROD_URL = 'postgresql://postgres.poncfubviioirqpcqsge:Uyarvom2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
const BETA_URL = 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'

const prod = new PrismaClient({ datasources: { db: { url: PROD_URL } } })
const beta = new PrismaClient({ datasources: { db: { url: BETA_URL } } })

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
  await beta.$executeRawUnsafe(sql)
  console.log(`  ✅ ${label}: ${records.length}`)
}

async function main() {
  console.log('\n🔄  Syncing prod → beta (bulk SQL)\n')

  console.log('📥  Reading all prod data...')
  const systemSettings       = await prod.systemSetting.findMany()
  const heroBanners          = await prod.heroBanner.findMany()
  const categories           = await prod.category.findMany()
  const products             = await prod.product.findMany()
  const productImages        = await prod.productImage.findMany()
  const productVariants      = await prod.productVariant.findMany()
  const productVariantImages = await prod.productVariantImage.findMany()
  const productCategories    = await prod.productCategory.findMany()
  const users                = await prod.user.findMany()
  const adminUsers           = await prod.adminUser.findMany()
  const addresses            = await prod.address.findMany()
  const orders               = await prod.order.findMany()
  const orderItems           = await prod.orderItem.findMany()
  const orderEvents          = await prod.orderEvent.findMany()
  const cartItems            = await prod.cartItem.findMany()
  const reviews              = await prod.review.findMany()
  const supportTickets       = await prod.supportTicket.findMany()
  const supportMessages      = await prod.supportMessage.findMany()
  const auditLogs            = await prod.auditLog.findMany()
  const deletionTickets      = await prod.deletionTicket.findMany()
  console.log(`  categories=${categories.length} products=${products.length} productCategories=${productCategories.length}`)

  console.log('\n📤  Writing to beta...')
  await bulkSync('system_settings', systemSettings, 'SystemSettings')
  await bulkSync('hero_banners', heroBanners, 'HeroBanners')

  const rootCats = categories.filter(c => !c.parentId)
  const childCats = categories.filter(c => c.parentId)
  await bulkSync('categories', rootCats, 'Categories (root)')
  await bulkSync('categories', childCats, 'Categories (children)')

  await bulkSync('products', products, 'Products')
  await bulkSync('product_images', productImages, 'ProductImages')
  await bulkSync('product_variants', productVariants, 'ProductVariants')
  await bulkSync('product_variant_images', productVariantImages, 'ProductVariantImages')
  await bulkSync('product_categories', productCategories, 'ProductCategories')

  await bulkSync('users', users, 'Users')
  await bulkSync('admin_users', adminUsers, 'AdminUsers')
  await bulkSync('addresses', addresses, 'Addresses')
  await bulkSync('orders', orders, 'Orders')
  await bulkSync('order_items', orderItems, 'OrderItems')
  await bulkSync('order_events', orderEvents, 'OrderEvents')
  await bulkSync('cart_items', cartItems, 'CartItems')
  await bulkSync('reviews', reviews, 'Reviews')
  await bulkSync('support_tickets', supportTickets, 'SupportTickets')
  await bulkSync('support_messages', supportMessages, 'SupportMessages')
  await bulkSync('audit_logs', auditLogs, 'AuditLogs')
  await bulkSync('deletion_tickets', deletionTickets, 'DeletionTickets')

  console.log('\n✅  Sync complete!\n')
}

main()
  .catch(e => { console.error('❌ Failed:', e.message); process.exit(1) })
  .finally(async () => { await prod.$disconnect(); await beta.$disconnect() })
