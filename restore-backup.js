const { BackupManager } = require('./backup-system/backup-manager')

async function restore() {
  const backupManager = new BackupManager()
  
  try {
    // Restore from the backup before Task 4
    const backupId = 'backup-2025-12-31T01-49-58-374Z-e18d78'
    
    console.log(`🔄 Restoring from backup: ${backupId}`)
    const result = await backupManager.restoreFromBackup(backupId, { skipSafetyBackup: true })
    
    if (result.success) {
      console.log('✅ Restore completed successfully!')
    }
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message)
  } finally {
    await backupManager.close()
  }
}

restore()