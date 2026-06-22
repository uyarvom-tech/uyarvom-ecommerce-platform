require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const variants = await prisma.productVariant.findMany({
    select: {
      id: true,
      productId: true,
      stock: true,
    },
  })

  let updatedVariants = 0

  for (const variant of variants) {
    const nextStock = Math.max(Number(variant.stock || 0), 1)

    if (nextStock !== variant.stock) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: nextStock },
      })
      updatedVariants += 1
    }
  }

  const stockByProduct = await prisma.productVariant.groupBy({
    by: ['productId'],
    _sum: { stock: true },
  })

  const productStockMap = new Map(
    stockByProduct.map((item) => [item.productId, item._sum.stock ?? 1])
  )

  const products = await prisma.product.findMany({
    select: { id: true },
  })

  for (const product of products) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: productStockMap.get(product.id) ?? 1,
      },
    })
  }

  console.log(JSON.stringify({
    totalVariants: variants.length,
    updatedVariants,
    totalProducts: products.length,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
