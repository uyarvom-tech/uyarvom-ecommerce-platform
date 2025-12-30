const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCategoryImages() {
  try {
    console.log('🖼️ Testing Category Image System...')
    
    // Create a test category with image
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Image Category',
        slug: 'test-image-category',
        description: 'Category with image for testing',
        imageUrl: '/uploads/categories/test-image.jpg', // Simulated image URL
        displayOrder: 999,
        isActive: true
      }
    })
    
    console.log('✅ Created test category with image:', testCategory.name)
    console.log('🖼️ Image URL:', testCategory.imageUrl)
    
    // Verify the category was created with image
    const categoryWithImage = await prisma.category.findUnique({
      where: { id: testCategory.id }
    })
    
    if (categoryWithImage && categoryWithImage.imageUrl) {
      console.log('✅ Category image URL saved successfully')
    } else {
      console.log('❌ Category image URL not saved')
    }
    
    // Update the category image
    const updatedCategory = await prisma.category.update({
      where: { id: testCategory.id },
      data: {
        imageUrl: '/uploads/categories/updated-test-image.jpg'
      }
    })
    
    console.log('✅ Updated category image URL:', updatedCategory.imageUrl)
    
    // Clean up - delete the test category
    await prisma.category.delete({
      where: { id: testCategory.id }
    })
    
    console.log('🧹 Cleaned up test category')
    console.log('✅ Category image system test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCategoryImages()