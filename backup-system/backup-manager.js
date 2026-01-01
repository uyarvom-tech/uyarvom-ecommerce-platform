const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class BackupManager {
  constructor() {
    this.prisma = new PrismaClient()
    this.backupDir = path.join(__dirname, 'backups')
    this.maxBackups = 50 // Keep last 50 backups
    this.ensureBackupDirectory()
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const randomId = Math.random().toString(36).substring(2, 8)
    return `backup-${timestamp}-${randomId}`
  }

  async createFullBackup(description = 'Manual backup') {
    const backupId = this.generateBackupId()
    const backupPath = path.join(this.backupDir, `${backupId}.json`)
    
    try {
      console.log(`🔄 Creating full backup: ${backupId}`)
      console.log(`📝 Description: ${description}`)

      // Get all data with complete relationships
      const [users, categories, products, orders, reviews] = await Promise.all([
        this.prisma.user.findMany({
          include: {
            adminUser: true
          }
        }),
        this.prisma.category.findMany(),
        this.prisma.product.findMany({
          include: {
            images: true,
            productCategories: {
              include: {
                category: true
              }
            }
          }
        }),
        this.prisma.order.findMany({
          include: {
            orderItems: {
              include: {
                product: true
              }
            },
            user: true
          }
        }),
        this.prisma.review.findMany({
          include: {
            user: true,
            product: true
          }
        })
      ])

      // Try to get cart items if they exist
      let cartItems = []
      try {
        cartItems = await this.prisma.cartItem.findMany({
          include: {
            user: true,
            product: true
          }
        })
      } catch (error) {
        console.log('ℹ️ CartItem table not found or incompatible, skipping...')
      }

      const backupData = {
        metadata: {
          backupId,
          timestamp: new Date().toISOString(),
          description,
          version: '1.0',
          databaseSchema: 'prisma-sqlite',
          totalRecords: users.length + categories.length + products.length + orders.length + reviews.length + cartItems.length
        },
        data: {
          users,
          categories,
          products,
          orders,
          reviews,
          cartItems
        },
        integrity: {
          userCount: users.length,
          categoryCount: categories.length,
          productCount: products.length,
          orderCount: orders.length,
          reviewCount: reviews.length,
          cartItemCount: cartItems.length
        }
      }

      // Write backup file
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))

      // Create backup manifest
      await this.updateBackupManifest(backupId, backupData.metadata)

      // Cleanup old backups
      await this.cleanupOldBackups()

      console.log(`✅ Backup created successfully: ${backupId}`)
      console.log(`📁 Location: ${backupPath}`)
      console.log(`📊 Records backed up:`)
      console.log(`   - Users: ${users.length}`)
      console.log(`   - Categories: ${categories.length}`)
      console.log(`   - Products: ${products.length}`)
      console.log(`   - Orders: ${orders.length}`)
      console.log(`   - Reviews: ${reviews.length}`)
      console.log(`   - Cart Items: ${cartItems.length}`)

      return {
        success: true,
        backupId,
        backupPath,
        metadata: backupData.metadata
      }

    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`)
      
      // Cleanup failed backup file
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath)
      }
      
      throw new Error(`Backup creation failed: ${error.message}`)
    }
  }

  async updateBackupManifest(backupId, metadata) {
    const manifestPath = path.join(this.backupDir, 'manifest.json')
    let manifest = { backups: [] }

    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    }

    manifest.backups.unshift({
      id: backupId,
      ...metadata,
      size: this.getFileSize(path.join(this.backupDir, `${backupId}.json`))
    })

    // Keep only last 50 entries in manifest
    manifest.backups = manifest.backups.slice(0, this.maxBackups)

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  }

  getFileSize(filePath) {
    const stats = fs.statSync(filePath)
    return {
      bytes: stats.size,
      readable: this.formatBytes(stats.size)
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async listBackups() {
    const manifestPath = path.join(this.backupDir, 'manifest.json')
    
    if (!fs.existsSync(manifestPath)) {
      return []
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    return manifest.backups || []
  }

  async restoreFromBackup(backupId, options = {}) {
    const backupPath = path.join(this.backupDir, `${backupId}.json`)
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupId}`)
    }

    try {
      console.log(`🔄 Restoring from backup: ${backupId}`)
      
      // Create safety backup before restore
      if (!options.skipSafetyBackup) {
        console.log(`🛡️ Creating safety backup before restore...`)
        await this.createFullBackup(`Safety backup before restoring ${backupId}`)
      }

      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
      
      // Verify backup integrity
      if (!this.verifyBackupIntegrity(backupData)) {
        throw new Error('Backup integrity check failed')
      }

      console.log(`📊 Backup contains:`)
      console.log(`   - Users: ${backupData.integrity.userCount}`)
      console.log(`   - Categories: ${backupData.integrity.categoryCount}`)
      console.log(`   - Products: ${backupData.integrity.productCount}`)
      console.log(`   - Orders: ${backupData.integrity.orderCount}`)
      console.log(`   - Reviews: ${backupData.integrity.reviewCount}`)

      // Clear existing data in correct order (respecting foreign keys)
      console.log(`🗑️ Clearing existing data...`)
      
      // Try to clear cart items if they exist
      try {
        await this.prisma.cartItem.deleteMany()
      } catch (error) {
        console.log('ℹ️ CartItem table not found, skipping...')
      }
      
      await this.prisma.orderItem.deleteMany()
      await this.prisma.order.deleteMany()
      await this.prisma.review.deleteMany()
      await this.prisma.productImage.deleteMany()
      
      // Try to clear variants if they exist
      try {
        await this.prisma.productVariant.deleteMany()
      } catch (error) {
        console.log('ℹ️ ProductVariant table not found, skipping...')
      }
      
      await this.prisma.productCategory.deleteMany()
      await this.prisma.product.deleteMany()
      await this.prisma.category.deleteMany()
      await this.prisma.adminUser.deleteMany()
      await this.prisma.user.deleteMany()

      // Restore data in correct order
      console.log(`📥 Restoring data...`)
      
      // Restore users first
      for (const userData of backupData.data.users) {
        const { adminUser, ...userFields } = userData
        const user = await this.prisma.user.create({ data: userFields })
        
        if (adminUser) {
          await this.prisma.adminUser.create({
            data: {
              ...adminUser,
              userId: user.id
            }
          })
        }
      }

      // Restore categories
      for (const categoryData of backupData.data.categories) {
        await this.prisma.category.create({ data: categoryData })
      }

      // Restore products with relationships
      for (const productData of backupData.data.products) {
        const { images, productCategories, variants, ...productFields } = productData
        
        const product = await this.prisma.product.create({ data: productFields })

        // Restore product images
        if (images && images.length > 0) {
          for (const imageData of images) {
            await this.prisma.productImage.create({
              data: {
                ...imageData,
                productId: product.id
              }
            })
          }
        }

        // Restore product categories
        if (productCategories && productCategories.length > 0) {
          for (const pcData of productCategories) {
            await this.prisma.productCategory.create({
              data: {
                productId: product.id,
                categoryId: pcData.categoryId,
                isPrimary: pcData.isPrimary
              }
            })
          }
        }

        // Restore product variants if they exist in schema
        if (variants && variants.length > 0) {
          try {
            for (const variantData of variants) {
              await this.prisma.productVariant.create({
                data: {
                  ...variantData,
                  productId: product.id
                }
              })
            }
          } catch (error) {
            console.log('ℹ️ ProductVariant table not found, skipping variants...')
          }
        }
      }

      // Restore orders
      for (const orderData of backupData.data.orders) {
        const { orderItems, ...orderFields } = orderData
        
        const order = await this.prisma.order.create({ data: orderFields })

        if (orderItems && orderItems.length > 0) {
          for (const itemData of orderItems) {
            const { product, productVariant, ...itemFields } = itemData
            await this.prisma.orderItem.create({
              data: {
                ...itemFields,
                orderId: order.id
              }
            })
          }
        }
      }

      // Restore reviews
      for (const reviewData of backupData.data.reviews) {
        const { user, product, ...reviewFields } = reviewData
        await this.prisma.review.create({ data: reviewFields })
      }

      // Restore cart items if they exist
      if (backupData.data.cartItems && backupData.data.cartItems.length > 0) {
        try {
          for (const cartData of backupData.data.cartItems) {
            const { user, product, productVariant, ...cartFields } = cartData
            await this.prisma.cartItem.create({ data: cartFields })
          }
        } catch (error) {
          console.log('ℹ️ CartItem table not found, skipping cart items...')
        }
      }

      console.log(`✅ Restore completed successfully!`)
      
      // Verify restore
      const [finalUsers, finalCategories, finalProducts] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.category.count(),
        this.prisma.product.count()
      ])

      console.log(`📊 Verification:`)
      console.log(`   - Users: ${finalUsers}`)
      console.log(`   - Categories: ${finalCategories}`)
      console.log(`   - Products: ${finalProducts}`)

      return {
        success: true,
        backupId,
        restoredCounts: {
          users: finalUsers,
          categories: finalCategories,
          products: finalProducts
        }
      }

    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`)
      throw new Error(`Restore operation failed: ${error.message}`)
    }
  }

  verifyBackupIntegrity(backupData) {
    if (!backupData.metadata || !backupData.data || !backupData.integrity) {
      return false
    }

    const { data, integrity } = backupData
    
    return (
      data.users.length === integrity.userCount &&
      data.categories.length === integrity.categoryCount &&
      data.products.length === integrity.productCount &&
      data.orders.length === integrity.orderCount &&
      data.reviews.length === integrity.reviewCount &&
      (data.cartItems ? data.cartItems.length === integrity.cartItemCount : integrity.cartItemCount === 0)
    )
  }

  async cleanupOldBackups() {
    const backups = await this.listBackups()
    
    if (backups.length > this.maxBackups) {
      const toDelete = backups.slice(this.maxBackups)
      
      for (const backup of toDelete) {
        const backupPath = path.join(this.backupDir, `${backup.id}.json`)
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath)
          console.log(`🗑️ Cleaned up old backup: ${backup.id}`)
        }
      }
    }
  }

  async createDatabaseCopy() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db')
    const copyPath = path.join(this.backupDir, `database-copy-${timestamp}.db`)
    
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, copyPath)
      console.log(`📁 Database file copied to: ${copyPath}`)
      return copyPath
    }
    
    return null
  }

  async close() {
    await this.prisma.$disconnect()
  }
}

module.exports = { BackupManager }