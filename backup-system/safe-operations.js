const { BackupHooks } = require('./hooks')
const { execSync } = require('child_process')

class SafeOperations {
  constructor() {
    this.hooks = new BackupHooks()
  }

  async safeMigration(migrationName) {
    let backupId = null
    
    try {
      // Create backup before migration
      backupId = await this.hooks.beforeMigration(migrationName || 'Unknown migration')
      
      console.log('🔄 Running Prisma migration...')
      execSync('npx prisma migrate dev', { stdio: 'inherit' })
      
      console.log('🔄 Generating Prisma client...')
      execSync('npx prisma generate', { stdio: 'inherit' })
      
      console.log('✅ Migration completed successfully!')
      console.log(`💡 Backup available for rollback: ${backupId}`)
      
      return { success: true, backupId }
      
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`)
      
      if (backupId) {
        console.log(`🛡️ Backup available for rollback: ${backupId}`)
        console.log(`💡 To rollback: node backup-system/cli.js restore`)
      }
      
      throw error
    }
  }

  async safeSchemaChange(description, schemaChangeFunction) {
    let backupId = null
    
    try {
      // Create backup before schema change
      backupId = await this.hooks.beforeSchemaChange(description)
      
      console.log('🔄 Applying schema changes...')
      await schemaChangeFunction()
      
      console.log('✅ Schema changes applied successfully!')
      console.log(`💡 Backup available for rollback: ${backupId}`)
      
      return { success: true, backupId }
      
    } catch (error) {
      console.error(`❌ Schema change failed: ${error.message}`)
      
      if (backupId) {
        console.log(`🛡️ Backup available for rollback: ${backupId}`)
        console.log(`💡 To rollback: node backup-system/cli.js restore`)
      }
      
      throw error
    }
  }

  async safeBulkOperation(operationType, recordCount, operationFunction) {
    let backupId = null
    
    try {
      // Create backup before bulk operation
      backupId = await this.hooks.beforeBulkOperation(operationType, recordCount)
      
      console.log(`🔄 Performing bulk ${operationType}...`)
      const result = await operationFunction()
      
      console.log(`✅ Bulk ${operationType} completed successfully!`)
      console.log(`💡 Backup available for rollback: ${backupId}`)
      
      return { success: true, backupId, result }
      
    } catch (error) {
      console.error(`❌ Bulk ${operationType} failed: ${error.message}`)
      
      if (backupId) {
        console.log(`🛡️ Backup available for rollback: ${backupId}`)
        console.log(`💡 To rollback: node backup-system/cli.js restore`)
      }
      
      throw error
    }
  }

  async close() {
    await this.hooks.close()
  }
}

module.exports = { SafeOperations }