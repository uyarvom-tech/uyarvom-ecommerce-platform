const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyAdminCategories() {
  try {
    console.log('🔍 Verifying Admin Category Display...')
    
    // Simulate the exact query used by the admin products page
    const products = await prisma.product.findMany({
      include: {
        productCategories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log(`📦 Found ${products.length} products for admin display`)
    
    // Transform products exactly like the admin page does
    const transformedProducts = products.map(product => ({
      ...product,
      categories: product.productCategories.map(pc => pc.category),
      primaryCategory: product.productCategories.find(pc => pc.isPrimary)?.category || product.productCategories[0]?.category,
      // Keep backward compatibility
      category: product.productCategories.find(pc => pc.isPrimary)?.category || product.productCategories[0]?.category
    }))
    
    console.log('\n📊 Admin Display Results:')
    transformedProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`)
      
      // Check what admin interface would show
      if (product.categories && product.categories.length > 0) {
        console.log(`   ✅ Categories (${product.categories.length}):`)
        product.categories.forEach((cat, i) => {
          const isPrimary = i === 0 ? '⭐ PRIMARY' : '🏷️ Secondary'
          console.log(`      ${i + 1}. ${cat.name} (${isPrimary})`)
        })
      } else if (product.category) {
        console.log(`   ✅ Legacy Category: ${product.category.name}`)
      } else {
        console.log(`   ❌ NO CATEGORY - This would show "No Category" in admin`)
      }
    })
    
    // Check for any issues
    const productsWithoutCategories = transformedProducts.filter(p => 
      (!p.categories || p.categories.length === 0) && !p.category
    )
    
    if (productsWithoutCategories.length > 0) {
      console.log(`\n⚠️ ISSUE: ${productsWithoutCategories.length} products would show "No Category":`)
      productsWithoutCategories.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`)
      })
    } else {
      console.log('\n✅ All products have categories - admin should display them correctly!')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdminCategories()