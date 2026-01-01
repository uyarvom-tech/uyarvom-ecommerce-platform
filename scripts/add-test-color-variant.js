const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTestColorVariant() {
  try {
    console.log('🎨 Adding test color variant...')
    
    const productId = 'cmjr0bwj1000r4y6i0ewmnic2' // Plastic Stool – Multi Color
    
    // Add a red color variant
    const redVariant = await prisma.productVariant.create({
      data: {
        productId: productId,
        name: 'Color',
        value: 'Red',
        colorCode: '#dc2626',
        colorImage: '/uploads/products/red-stool-example.jpg', // Placeholder image
        stock: 10,
        sortOrder: 0,
        isActive: true
      }
    })
    
    console.log('✅ Red variant created:', redVariant.id)
    
    // Add a blue color variant
    const blueVariant = await prisma.productVariant.create({
      data: {
        productId: productId,
        name: 'Color',
        value: 'Blue',
        colorCode: '#2563eb',
        colorImage: '/uploads/products/blue-stool-example.jpg', // Placeholder image
        stock: 15,
        sortOrder: 1,
        isActive: true
      }
    })
    
    console.log('✅ Blue variant created:', blueVariant.id)
    
    // Add a green color variant
    const greenVariant = await prisma.productVariant.create({
      data: {
        productId: productId,
        name: 'Color',
        value: 'Green',
        colorCode: '#16a34a',
        colorImage: '/uploads/products/green-stool-example.jpg', // Placeholder image
        stock: 8,
        sortOrder: 2,
        isActive: true
      }
    })
    
    console.log('✅ Green variant created:', greenVariant.id)
    
    console.log('🎉 Test color variants added successfully!')
    
  } catch (error) {
    console.error('❌ Failed to add color variants:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestColorVariant()