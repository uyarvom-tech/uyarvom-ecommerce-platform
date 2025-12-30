const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCategories() {
  try {
    console.log('🧪 Testing Category System...')
    
    // Create a test category
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Kids Collection',
        slug: 'test-kids-collection',
        description: 'Fun and colorful items for children',
        displayOrder: 100,
        isActive: true
      }
    })
    
    console.log('✅ Created test category:', testCategory.name)
    
    // Get a product to test with
    const product = await prisma.product.findFirst({
      include: {
        productCategories: {
          include: { category: true }
        }
      }
    })
    
    if (product) {
      console.log(`📦 Testing with product: ${product.name}`)
      console.log(`🏷️ Current categories: ${product.productCategories.map(pc => pc.category.name).join(', ')}`)
      
      // Add the test category to this product
      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: testCategory.id,
          isPrimary: false
        }
      })
      
      console.log('✅ Added test category to product')
      
      // Verify the relationship
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          productCategories: {
            include: { category: true }
          }
        }
      })
      
      console.log(`🎉 Updated categories: ${updatedProduct.productCategories.map(pc => pc.category.name).join(', ')}`)
      
      // Clean up - remove the test category relationship
      await prisma.productCategory.deleteMany({
        where: {
          productId: product.id,
          categoryId: testCategory.id
        }
      })
      
      // Delete the test category
      await prisma.category.delete({
        where: { id: testCategory.id }
      })
      
      console.log('🧹 Cleaned up test data')
    }
    
    console.log('✅ Category system test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCategories()