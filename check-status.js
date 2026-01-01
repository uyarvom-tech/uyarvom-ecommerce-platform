const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkStatus() {
  try {
    const [users, categories, products] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count()
    ])
    
    console.log(`Users: ${users}`)
    console.log(`Categories: ${categories}`)
    console.log(`Products: ${products}`)
    
    if (categories > 0) {
      console.log('\nCategories:')
      const cats = await prisma.category.findMany()
      cats.forEach(cat => console.log(`- ${cat.name} (${cat.slug})`))
    }
    
    if (products > 0) {
      console.log(`\nFirst few products:`)
      const prods = await prisma.product.findMany({ take: 3 })
      prods.forEach(prod => console.log(`- ${prod.name}`))
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkStatus()