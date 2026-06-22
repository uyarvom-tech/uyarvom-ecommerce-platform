/**
 * Fix variants that have colorId=null by creating a "Default" color for their product
 * and linking them. This ensures the admin catalog (which queries colors→variants) shows stock.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Finding variants without a color...')
  
  const orphanVariants = await prisma.productVariant.findMany({
    where: { colorId: null },
    select: { id: true, productId: true, stock: true },
  })

  console.log(`Found ${orphanVariants.length} colorless variants`)
  
  // Group by productId
  const byProduct = new Map()
  for (const v of orphanVariants) {
    if (!byProduct.has(v.productId)) byProduct.set(v.productId, [])
    byProduct.get(v.productId).push(v)
  }

  console.log(`Across ${byProduct.size} products`)
  let fixed = 0

  for (const [productId, variants] of byProduct) {
    // Find or create a Default color for this product
    let defaultColor = await prisma.productColor.findFirst({
      where: { productId },
    })

    if (!defaultColor) {
      try {
        defaultColor = await prisma.productColor.create({
          data: { productId, colorName: 'Default', colorCode: null, sortOrder: 0 },
        })
      } catch {
        // If unique constraint fails, the color already exists — just find it
        defaultColor = await prisma.productColor.findFirst({ where: { productId } })
      }
    }

    // Link all orphan variants to this color
    for (const v of variants) {
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { colorId: defaultColor.id },
      })
    }
    
    fixed++
  }

  console.log(`Fixed ${fixed} products. All variants now have a color.`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
