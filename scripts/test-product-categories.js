const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testProductCategories() {
  try {
    console.log('🔍 Testing Product Category Display...')
    
    // Get products with their categories
    const products = await prisma.product.findMany({
      include: {
        productCategories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' }
        }
      },
      take: 5
    })
    
    console.log(`📦 Found ${products.length} products`)
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`)
      console.log(`   Categories (${product.productCategories.length}):`)
      
      if (product.productCategories.length === 0) {
        console.log('   ❌ NO CATEGORIES ASSIGNED')
      } else {
        product.productCategories.forEach((pc, i) => {
          const isPrimary = pc.isPrimary ? '⭐ PRIMARY' : '🏷️ Secondary'
          console.log(`   ${i + 1}. ${pc.category.name} (${isPrimary})`)
        })
      }
    })
    
    // Check if any products have no categories
    const productsWithoutCategories = products.filter(p => p.productCategories.length === 0)
    
    if (productsWithoutCategories.length > 0) {
      console.log(`\n⚠️ Found ${productsWithoutCategories.length} products without categories:`)
      productsWithoutCategories.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`)
      })
    } else {
      console.log('\n✅ All products have categories assigned!')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testProductCategories()