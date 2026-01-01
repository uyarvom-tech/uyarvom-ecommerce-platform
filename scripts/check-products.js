const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProducts() {
  try {
    const products = await prisma.product.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true
      }
    })

    console.log('Products:')
    products.forEach(p => {
      console.log(`- ${p.name} (${p.slug})`)
      console.log(`  URL: http://localhost:3000/products/${p.slug}`)
      console.log(`  Admin Edit: http://localhost:3000/admin/products/${p.id}/edit`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProducts()