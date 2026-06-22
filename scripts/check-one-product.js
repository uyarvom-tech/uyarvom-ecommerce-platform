require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Find Cast Iron Dosa Tawa
  const product = await prisma.product.findFirst({
    where: { name: { contains: 'Cast Iron Dosa Tawa' } },
    include: {
      colors: {
        include: { variants: true }
      },
      variants: true,
    }
  })

  if (!product) { console.log('Product not found'); return }

  console.log(JSON.stringify({
    name: product.name,
    sku: product.sku,
    stockQuantity: product.stockQuantity,
    moq: product.moq,
    colorsCount: product.colors.length,
    colors: product.colors.map(c => ({
      colorName: c.colorName,
      variants: c.variants.map(v => ({ id: v.id, size: v.size, stock: v.stock, isActive: v.isActive }))
    })),
    directVariants: product.variants.map(v => ({ id: v.id, size: v.size, stock: v.stock, colorId: v.colorId, isActive: v.isActive })),
  }, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
