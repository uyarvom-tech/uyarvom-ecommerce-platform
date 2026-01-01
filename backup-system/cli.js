#!/usr/bin/env node

const { BackupManager } = require('./backup-manager')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function main() {
  const backupManager = new BackupManager()
  
  try {
    const command = process.argv[2]
    
    switch (command) {
      case 'create':
        await createBackup(backupManager)
        break
        
      case 'list':
        await listBackups(backupManager)
        break
        
      case 'restore':
        await restoreBackup(backupManager)
        break
        
      case 'auto':
        await autoBackup(backupManager)
        break
        
      default:
        showHelp()
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  } finally {
    await backupManager.close()
    rl.close()
  }
}

async function createBackup(backupManager) {
  const description = process.argv[3] || await ask('Enter backup description (optional): ')
  
  console.log('🔄 Creating backup...')
  const result = await backupManager.createFullBackup(description || 'Manual backup via CLI')
  
  if (result.success) {
    console.log(`✅ Backup created: ${result.backupId}`)
  }
}

async function listBackups(backupManager) {
  const backups = await backupManager.listBackups()
  
  if (backups.length === 0) {
    console.log('📭 No backups found')
    return
  }
  
  console.log(`📋 Available backups (${backups.length}):`)
  console.log('')
  
  backups.forEach((backup, index) => {
    const date = new Date(backup.timestamp).toLocaleString()
    console.log(`${index + 1}. ${backup.id}`)
    console.log(`   📅 Created: ${date}`)
    console.log(`   📝 Description: ${backup.description}`)
    console.log(`   📊 Records: ${backup.totalRecords}`)
    console.log(`   💾 Size: ${backup.size.readable}`)
    console.log('')
  })
}

async function restoreBackup(backupManager) {
  const backups = await backupManager.listBackups()
  
  if (backups.length === 0) {
    console.log('📭 No backups available for restore')
    return
  }
  
  console.log('📋 Available backups:')
  backups.forEach((backup, index) => {
    const date = new Date(backup.timestamp).toLocaleString()
    console.log(`${index + 1}. ${backup.id} (${date}) - ${backup.description}`)
  })
  
  const choice = await ask('\nEnter backup number to restore: ')
  const backupIndex = parseInt(choice) - 1
  
  if (backupIndex < 0 || backupIndex >= backups.length) {
    console.log('❌ Invalid backup selection')
    return
  }
  
  const selectedBackup = backups[backupIndex]
  
  console.log(`⚠️  WARNING: This will replace ALL current data with backup from:`)
  console.log(`   📅 ${new Date(selectedBackup.timestamp).toLocaleString()}`)
  console.log(`   📝 ${selectedBackup.description}`)
  console.log(`   📊 ${selectedBackup.totalRecords} records`)
  
  const confirm = await ask('\nType "RESTORE" to confirm: ')
  
  if (confirm !== 'RESTORE') {
    console.log('❌ Restore cancelled')
    return
  }
  
  console.log('🔄 Starting restore...')
  const result = await backupManager.restoreFromBackup(selectedBackup.id)
  
  if (result.success) {
    console.log(`✅ Restore completed successfully!`)
  }
}

async function autoBackup(backupManager) {
  const description = `Auto backup - ${new Date().toLocaleString()}`
  
  console.log('🤖 Creating automatic backup...')
  const result = await backupManager.createFullBackup(description)
  
  if (result.success) {
    console.log(`✅ Auto backup created: ${result.backupId}`)
    
    // Also create database file copy
    await backupManager.createDatabaseCopy()
  }
}

function showHelp() {
  console.log(`
🛡️  Uyarvom Backup System

Usage: node backup-system/cli.js <command>

Commands:
  create [description]  - Create a new backup
  list                 - List all available backups  
  restore              - Restore from a backup (interactive)
  auto                 - Create automatic backup with timestamp

Examples:
  node backup-system/cli.js create "Before adding variants"
  node backup-system/cli.js list
  node backup-system/cli.js restore
  node backup-system/cli.js auto

Safety Features:
✅ Automatic safety backup before restore
✅ Integrity verification
✅ Foreign key constraint handling
✅ Automatic cleanup of old backups
✅ Complete data relationship preservation
`)
}

if (require.main === module) {
  main()
}

module.exports = { main }