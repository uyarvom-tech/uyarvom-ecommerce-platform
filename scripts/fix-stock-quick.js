/**
 * Quick fix: For ALL products where product.stockQuantity > 0 but the
 * variant stock total is 0, push product.stockQuantity into the first variant.
 * Then also handle the case where both are 0 but MOQ is set — use MOQ as stock.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Fetching products...')
  
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      moq: true,
      variants: { select: { id: true, stock: true }, orderBy: { sortOrder: 'asc' } },
    },
  })

  console.log(`Found ${products.length} products`)
  let fixed = 0

  for (const product of products) {
    const variantTotal = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    
    if (variantTotal > 0) continue // Already has stock, skip
    if (product.variants.length === 0) continue // No variants to fix
    
    // Determine the correct stock value
    let targetStock = product.stockQuantity || product.moq || 25
    
    // Update the first variant
    await prisma.productVariant.update({
      where: { id: product.variants[0].id },
      data: { stock: targetStock },
    })
    
    // Sync product.stockQuantity too
    await prisma.product.update({
      where: { id: product.id },
      data: { stockQuantity: targetStock },
    })
    
    fixed++
    if (fixed <= 5) console.log(`  Fixed: ${product.name} → stock=${targetStock}`)
  }

  console.log(`\nDone. Fixed ${fixed} of ${products.length} products.`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
