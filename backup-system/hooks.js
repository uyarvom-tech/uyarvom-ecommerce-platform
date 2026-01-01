const { BackupManager } = require('./backup-manager')

class BackupHooks {
  constructor() {
    this.backupManager = new BackupManager()
  }

  // Hook for before database migrations
  async beforeMigration(migrationName) {
    console.log(`🛡️ Creating pre-migration backup for: ${migrationName}`)
    
    const result = await this.backupManager.createFullBackup(
      `Pre-migration backup: ${migrationName}`
    )
    
    if (result.success) {
      console.log(`✅ Pre-migration backup created: ${result.backupId}`)
      return result.backupId
    }
    
    throw new Error('Failed to create pre-migration backup')
  }

  // Hook for before schema changes
  async beforeSchemaChange(description) {
    console.log(`🛡️ Creating pre-schema-change backup: ${description}`)
    
    const result = await this.backupManager.createFullBackup(
      `Pre-schema-change: ${description}`
    )
    
    if (result.success) {
      console.log(`✅ Pre-schema-change backup created: ${result.backupId}`)
      return result.backupId
    }
    
    throw new Error('Failed to create pre-schema-change backup')
  }

  // Hook for scheduled backups
  async scheduledBackup() {
    const timestamp = new Date().toLocaleString()
    
    const result = await this.backupManager.createFullBackup(
      `Scheduled backup: ${timestamp}`
    )
    
    if (result.success) {
      console.log(`✅ Scheduled backup created: ${result.backupId}`)
      return result.backupId
    }
    
    throw new Error('Failed to create scheduled backup')
  }

  // Hook for before bulk operations
  async beforeBulkOperation(operationType, recordCount) {
    console.log(`🛡️ Creating backup before bulk ${operationType} (${recordCount} records)`)
    
    const result = await this.backupManager.createFullBackup(
      `Pre-bulk-${operationType}: ${recordCount} records`
    )
    
    if (result.success) {
      console.log(`✅ Pre-bulk-operation backup created: ${result.backupId}`)
      return result.backupId
    }
    
    throw new Error('Failed to create pre-bulk-operation backup')
  }

  async close() {
    await this.backupManager.close()
  }
}

module.exports = { BackupHooks }