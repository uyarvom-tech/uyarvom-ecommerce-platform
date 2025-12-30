const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function backupData() {
  try {
    console.log('🔄 Creating backup of current data...')
    
    // Get all current data
    const users = await prisma.user.findMany({
      include: { adminUser: true }
    })
    
    const categories = await prisma.category.findMany()
    
    const products = await prisma.product.findMany({
      include: {
        images: true,
        category: true
      }
    })
    
    const orders = await prisma.order.findMany({
      include: { orderItems: true }
    })
    
    const backup = {
      timestamp: new Date().toISOString(),
      users,
      categories,
      products,
      orders
    }
    
    // Save backup to file
    fs.writeFileSync('data-backup.json', JSON.stringify(backup, null, 2))
    
    console.log('✅ Backup created successfully!')
    console.log(`📊 Backed up:`)
    console.log(`   - ${users.length} users`)
    console.log(`   - ${categories.length} categories`) 
    console.log(`   - ${products.length} products`)
    console.log(`   - ${orders.length} orders`)
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

backupData()