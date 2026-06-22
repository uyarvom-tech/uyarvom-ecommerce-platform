/**
 * Fix variant stock mismatch.
 *
 * Problem: Excel re-imports update product.stockQuantity but NOT variant.stock,
 * so the admin catalog (which reads variant stock) shows 0 even though the
 * product has stock.
 *
 * This script: for each product whose variant-stock total is 0 but
 * product.stockQuantity > 0, pushes the product's stock into its variant(s).
 * - Single variant (default products from Excel): set that variant's stock.
 * - Multiple variants: assign the full quantity to the first/default variant.
 *
 * Safe: products that already have variant stock are left untouched.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      variants: { select: { id: true, stock: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
    },
  })

  let fixedProducts = 0
  let skipped = 0
  const fixes = []

  for (const product of products) {
    const variantStockTotal = product.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)

    // Only fix if variants sum to 0 but the product has stock recorded
    if (variantStockTotal === 0 && Number(product.stockQuantity || 0) > 0 && product.variants.length > 0) {
      const targetStock = Number(product.stockQuantity)
      // Assign full quantity to the first (default) variant
      const firstVariant = product.variants[0]

      await prisma.productVariant.update({
        where: { id: firstVariant.id },
        data: { stock: targetStock },
      })

      fixedProducts += 1
      fixes.push({ name: product.name, stock: targetStock })
    } else {
      skipped += 1
    }
  }

  // Re-sync product.stockQuantity from variant totals for consistency
  const stockByProduct = await prisma.productVariant.groupBy({
    by: ['productId'],
    _sum: { stock: true },
  })
  for (const item of stockByProduct) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stockQuantity: item._sum.stock ?? 0 },
    })
  }

  console.log(JSON.stringify({
    totalProducts: products.length,
    fixedProducts,
    skipped,
    sampleFixes: fixes.slice(0, 10),
  }, null, 2))
}

main()
  .catch((error) => {
    console.error('Fix failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
