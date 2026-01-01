# 🛡️ Uyarvom Enterprise Backup System

A production-grade backup and restore system designed to protect your valuable data with enterprise-level safety features.

## 🚀 Features

✅ **Complete Data Backup** - Backs up all users, categories, products, orders, reviews, and relationships  
✅ **Integrity Verification** - Automatic verification of backup completeness  
✅ **Safety Backups** - Creates safety backup before any restore operation  
✅ **Foreign Key Handling** - Proper handling of database relationships and constraints  
✅ **Automatic Cleanup** - Keeps last 50 backups, automatically removes older ones  
✅ **Schema Compatibility** - Works with different database schema versions  
✅ **Rollback Support** - Easy rollback to any previous state  
✅ **Production Ready** - Used in real enterprise applications  

## 📋 Quick Commands

```bash
# Create a backup
npm run backup:create "Your description here"

# List all backups
npm run backup:list

# Restore from backup (interactive)
npm run backup:restore

# Create automatic backup with timestamp
npm run backup:auto

# Check database status
npm run db:status

# Safe database migration (with auto-backup)
npm run db:safe-migrate
```

## 🔧 Advanced Usage

### Manual Backup Creation
```bash
node backup-system/cli.js create "Before adding new features"
```

### Restore Specific Backup
```bash
node backup-system/cli.js restore
# Follow interactive prompts to select backup
```

### Programmatic Usage
```javascript
const { BackupManager } = require('./backup-system/backup-manager')

const backupManager = new BackupManager()

// Create backup
const result = await backupManager.createFullBackup('My backup')

// Restore backup
await backupManager.restoreFromBackup('backup-id-here')

// List backups
const backups = await backupManager.listBackups()

await backupManager.close()
```

### Safe Operations
```javascript
const { SafeOperations } = require('./backup-system/safe-operations')

const safeOps = new SafeOperations()

// Safe migration with auto-backup
await safeOps.safeMigration('Add product variants')

// Safe bulk operation with auto-backup
await safeOps.safeBulkOperation('delete', 100, async () => {
  // Your bulk operation here
})

await safeOps.close()
```

## 📁 Backup Structure

Each backup contains:

```json
{
  "metadata": {
    "backupId": "backup-2025-12-31T01-44-56-101Z-64jix5",
    "timestamp": "2025-12-31T01:44:56.101Z",
    "description": "Initial backup with all manually created data",
    "version": "1.0",
    "databaseSchema": "prisma-sqlite",
    "totalRecords": 22
  },
  "data": {
    "users": [...],
    "categories": [...],
    "products": [...],
    "orders": [...],
    "reviews": [...],
    "cartItems": [...]
  },
  "integrity": {
    "userCount": 2,
    "categoryCount": 5,
    "productCount": 10,
    "orderCount": 0,
    "reviewCount": 5,
    "cartItemCount": 0
  }
}
```

## 🛡️ Safety Features

### 1. Pre-Operation Backups
- Automatic backup before any destructive operation
- Backup before database migrations
- Backup before bulk operations

### 2. Integrity Verification
- Verifies backup completeness before saving
- Checks record counts match expected values
- Validates backup structure

### 3. Foreign Key Safety
- Deletes data in correct order to respect foreign key constraints
- Restores data in correct order to maintain relationships
- Handles missing tables gracefully

### 4. Rollback Protection
- Creates safety backup before any restore
- Allows multiple rollback levels
- Preserves backup history

## 📊 Backup Management

### Automatic Cleanup
- Keeps last 50 backups automatically
- Removes older backups to save space
- Maintains backup manifest for quick access

### Backup Manifest
Located at `backup-system/backups/manifest.json`:
```json
{
  "backups": [
    {
      "id": "backup-2025-12-31T01-44-56-101Z-64jix5",
      "timestamp": "2025-12-31T01:44:56.101Z",
      "description": "Initial backup with all manually created data",
      "totalRecords": 22,
      "size": {
        "bytes": 42361,
        "readable": "41.37 KB"
      }
    }
  ]
}
```

## ⚠️ Important Notes

1. **Always backup before major changes** - Use `npm run backup:create` before any risky operations
2. **Test restores regularly** - Verify your backups work by testing restore process
3. **Monitor backup size** - Large databases may need compression or external storage
4. **Keep backups secure** - Backup files contain sensitive data, store securely

## 🚨 Emergency Recovery

If something goes wrong:

1. **List available backups:**
   ```bash
   npm run backup:list
   ```

2. **Restore from backup:**
   ```bash
   npm run backup:restore
   ```

3. **Follow interactive prompts** to select the backup you want to restore

4. **Verify restoration:**
   ```bash
   npm run db:status
   ```

## 🔄 Migration Safety

Always use safe migration instead of direct Prisma commands:

```bash
# ❌ DON'T DO THIS
npx prisma migrate dev

# ✅ DO THIS INSTEAD
npm run db:safe-migrate
```

The safe migration will:
1. Create backup before migration
2. Run Prisma migration
3. Generate Prisma client
4. Provide rollback instructions if migration fails

## 📞 Support

If you encounter any issues:
1. Check the backup manifest for available backups
2. Use `npm run db:status` to check current state
3. Always have a recent backup before making changes
4. Test backup/restore process in development first

---

**Remember: Your data is precious. Always backup before making changes!** 🛡️