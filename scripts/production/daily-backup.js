#!/usr/bin/env node

/**
 * PRODUCTION DAILY BACKUP SCRIPT
 * Creates comprehensive backups of database and application files
 * Supports restore functionality for disaster recovery
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AWS = require('aws-sdk');
require('dotenv').config({ path: '.env.production' });

// Configuration
const CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DB_NAME || 'newsteps',
  BACKUP_DIR: '/var/backups/newsteps',
  APP_DIR: '/var/www/newsteps',
  S3_BUCKET: process.env.BACKUP_S3_BUCKET || 'newsteps-backups',
  RETENTION_DAYS: 30,
  AWS_REGION: process.env.AWS_REGION || 'us-west-2'
};

// AWS S3 Configuration
const s3 = new AWS.S3({
  region: CONFIG.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class BackupManager {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupId = `backup-${this.timestamp}`;
    this.backupPath = path.join(CONFIG.BACKUP_DIR, this.backupId);
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  // Create database backup
  async backupDatabase() {
    console.log('📊 Starting database backup...');
    
    try {
      const client = new MongoClient(CONFIG.MONGODB_URI);
      await client.connect();
      const db = client.db(CONFIG.DATABASE_NAME);
      
      // Get all collections
      const collections = await db.listCollections().toArray();
      const dbBackup = { metadata: { timestamp: new Date(), collections: collections.length }, data: {} };
      
      // Export each collection
      for (const collection of collections) {
        const data = await db.collection(collection.name).find({}).toArray();
        dbBackup.data[collection.name] = data;
        console.log(`   ✅ Exported: ${collection.name} (${data.length} documents)`);
      }
      
      // Save database backup
      const dbBackupFile = path.join(this.backupPath, 'database.json');
      fs.writeFileSync(dbBackupFile, JSON.stringify(dbBackup, null, 2));
      
      await client.close();
      console.log(`✅ Database backup saved: ${dbBackupFile}`);
      
      return dbBackupFile;
      
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  // Create application files backup
  async backupApplication() {
    console.log('📁 Starting application backup...');
    
    try {
      const appBackupFile = path.join(this.backupPath, 'application.tar.gz');
      
      // Create tar archive of application directory
      const tarCommand = `tar -czf ${appBackupFile} -C ${CONFIG.APP_DIR} . --exclude=node_modules --exclude=.next --exclude=.git --exclude=logs --exclude=backups`;
      execSync(tarCommand);
      
      console.log(`✅ Application backup saved: ${appBackupFile}`);
      return appBackupFile;
      
    } catch (error) {
      console.error('❌ Application backup failed:', error);
      throw error;
    }
  }

  // Create system configuration backup
  async backupSystemConfig() {
    console.log('⚙️  Starting system configuration backup...');
    
    try {
      const configBackupDir = path.join(this.backupPath, 'system-config');
      fs.mkdirSync(configBackupDir, { recursive: true });
      
      // Backup nginx configuration
      try {
        execSync(`cp -r /etc/nginx/sites-available ${configBackupDir}/nginx-sites-available`);
        execSync(`cp -r /etc/nginx/sites-enabled ${configBackupDir}/nginx-sites-enabled`);
        console.log('   ✅ Nginx configuration backed up');
      } catch (error) {
        console.warn('   ⚠️  Nginx backup failed (might not exist)');
      }
      
      // Backup PM2 configuration
      try {
        execSync(`cp ${CONFIG.APP_DIR}/ecosystem.config.js ${configBackupDir}/ecosystem.config.js`);
        console.log('   ✅ PM2 configuration backed up');
      } catch (error) {
        console.warn('   ⚠️  PM2 config backup failed (might not exist)');
      }
      
      // Backup SSL certificates
      try {
        execSync(`cp -r /etc/letsencrypt ${configBackupDir}/letsencrypt`);
        console.log('   ✅ SSL certificates backed up');
      } catch (error) {
        console.warn('   ⚠️  SSL certificates backup failed (might not exist)');
      }
      
      console.log(`✅ System configuration backup saved: ${configBackupDir}`);
      return configBackupDir;
      
    } catch (error) {
      console.error('❌ System configuration backup failed:', error);
      throw error;
    }
  }

  // Upload backup to S3
  async uploadToS3() {
    console.log('☁️  Uploading backup to S3...');
    
    try {
      const archiveFile = path.join(CONFIG.BACKUP_DIR, `${this.backupId}.tar.gz`);
      
      // Create complete archive
      const tarCommand = `tar -czf ${archiveFile} -C ${CONFIG.BACKUP_DIR} ${this.backupId}`;
      execSync(tarCommand);
      
      // Upload to S3
      const fileStream = fs.createReadStream(archiveFile);
      const uploadParams = {
        Bucket: CONFIG.S3_BUCKET,
        Key: `daily-backups/${this.backupId}.tar.gz`,
        Body: fileStream,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'backup-date': new Date().toISOString(),
          'backup-type': 'daily-full'
        }
      };
      
      await s3.upload(uploadParams).promise();
      console.log(`✅ Backup uploaded to S3: s3://${CONFIG.S3_BUCKET}/daily-backups/${this.backupId}.tar.gz`);
      
      // Clean up local archive
      fs.unlinkSync(archiveFile);
      
    } catch (error) {
      console.error('❌ S3 upload failed:', error);
      throw error;
    }
  }

  // Clean up old backups
  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');
    
    try {
      // Local cleanup
      const backupDirs = fs.readdirSync(CONFIG.BACKUP_DIR);
      const cutoffDate = new Date(Date.now() - CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);
      
      let localDeleted = 0;
      for (const dir of backupDirs) {
        const dirPath = path.join(CONFIG.BACKUP_DIR, dir);
        const stat = fs.statSync(dirPath);
        
        if (stat.mtime < cutoffDate) {
          execSync(`rm -rf ${dirPath}`);
          localDeleted++;
        }
      }
      
      console.log(`✅ Cleaned up ${localDeleted} old local backups`);
      
      // S3 cleanup
      const s3Objects = await s3.listObjects({
        Bucket: CONFIG.S3_BUCKET,
        Prefix: 'daily-backups/'
      }).promise();
      
      let s3Deleted = 0;
      for (const obj of s3Objects.Contents) {
        if (obj.LastModified < cutoffDate) {
          await s3.deleteObject({
            Bucket: CONFIG.S3_BUCKET,
            Key: obj.Key
          }).promise();
          s3Deleted++;
        }
      }
      
      console.log(`✅ Cleaned up ${s3Deleted} old S3 backups`);
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      // Don't fail the entire backup process for cleanup errors
    }
  }

  // Execute full backup
  async executeFullBackup() {
    console.log(`🚀 Starting full backup: ${this.backupId}`);
    console.log('=' .repeat(60));
    
    try {
      const startTime = Date.now();
      
      // Create all backups
      await this.backupDatabase();
      await this.backupApplication();
      await this.backupSystemConfig();
      
      // Upload to S3
      await this.uploadToS3();
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      const duration = (Date.now() - startTime) / 1000;
      
      console.log('=' .repeat(60));
      console.log(`🎉 BACKUP COMPLETE: ${this.backupId}`);
      console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
      console.log(`📁 Local: ${this.backupPath}`);
      console.log(`☁️  S3: s3://${CONFIG.S3_BUCKET}/daily-backups/${this.backupId}.tar.gz`);
      
      return {
        success: true,
        backupId: this.backupId,
        duration: duration,
        path: this.backupPath
      };
      
    } catch (error) {
      console.error('💥 BACKUP FAILED:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Restore from backup
  async restoreFromBackup(backupId) {
    console.log(`🔄 Starting restore from backup: ${backupId}`);
    console.log('=' .repeat(60));
    
    try {
      const restorePath = path.join(CONFIG.BACKUP_DIR, backupId);
      
      // Check if backup exists locally
      if (!fs.existsSync(restorePath)) {
        console.log('📥 Backup not found locally, downloading from S3...');
        
        // Download from S3
        const downloadParams = {
          Bucket: CONFIG.S3_BUCKET,
          Key: `daily-backups/${backupId}.tar.gz`
        };
        
        const archiveFile = path.join(CONFIG.BACKUP_DIR, `${backupId}.tar.gz`);
        const fileStream = fs.createWriteStream(archiveFile);
        
        await s3.getObject(downloadParams).createReadStream().pipe(fileStream);
        
        // Extract archive
        const extractCommand = `tar -xzf ${archiveFile} -C ${CONFIG.BACKUP_DIR}`;
        execSync(extractCommand);
        
        // Clean up archive
        fs.unlinkSync(archiveFile);
        
        console.log('✅ Backup downloaded and extracted');
      }
      
      // Restore database
      console.log('📊 Restoring database...');
      const dbBackupFile = path.join(restorePath, 'database.json');
      
      if (fs.existsSync(dbBackupFile)) {
        const backup = JSON.parse(fs.readFileSync(dbBackupFile, 'utf8'));
        
        const client = new MongoClient(CONFIG.MONGODB_URI);
        await client.connect();
        const db = client.db(CONFIG.DATABASE_NAME);
        
        // Clear existing data
        const collections = await db.listCollections().toArray();
        for (const collection of collections) {
          await db.collection(collection.name).drop().catch(() => {});
        }
        
        // Restore data
        for (const [collectionName, data] of Object.entries(backup.data)) {
          if (data.length > 0) {
            await db.collection(collectionName).insertMany(data);
            console.log(`   ✅ Restored: ${collectionName} (${data.length} documents)`);
          }
        }
        
        await client.close();
        console.log('✅ Database restored');
      }
      
      // Restore application
      console.log('📁 Restoring application...');
      const appBackupFile = path.join(restorePath, 'application.tar.gz');
      
      if (fs.existsSync(appBackupFile)) {
        // Stop application
        try {
          execSync('pm2 stop newsteps-production');
        } catch (error) {
          console.warn('⚠️  PM2 stop failed (might not be running)');
        }
        
        // Extract application
        const extractCommand = `tar -xzf ${appBackupFile} -C ${CONFIG.APP_DIR}`;
        execSync(extractCommand);
        
        // Restore dependencies
        execSync('npm install', { cwd: CONFIG.APP_DIR });
        
        // Restart application
        execSync('pm2 start ecosystem.config.js', { cwd: CONFIG.APP_DIR });
        
        console.log('✅ Application restored and restarted');
      }
      
      console.log('=' .repeat(60));
      console.log('🎉 RESTORE COMPLETE!');
      console.log('🔄 Please verify system functionality');
      
    } catch (error) {
      console.error('💥 RESTORE FAILED:', error);
      throw error;
    }
  }

  // List available backups
  async listBackups() {
    console.log('📋 Available backups:');
    console.log('=' .repeat(40));
    
    try {
      // Local backups
      const localBackups = fs.readdirSync(CONFIG.BACKUP_DIR).filter(name => name.startsWith('backup-'));
      console.log(`\n💾 Local backups (${localBackups.length}):`);
      
      for (const backup of localBackups) {
        const backupPath = path.join(CONFIG.BACKUP_DIR, backup);
        const stat = fs.statSync(backupPath);
        console.log(`   📁 ${backup} (${stat.mtime.toLocaleDateString()})`);
      }
      
      // S3 backups
      const s3Objects = await s3.listObjects({
        Bucket: CONFIG.S3_BUCKET,
        Prefix: 'daily-backups/'
      }).promise();
      
      console.log(`\n☁️  S3 backups (${s3Objects.Contents.length}):`);
      
      for (const obj of s3Objects.Contents) {
        const backupName = path.basename(obj.Key, '.tar.gz');
        console.log(`   📦 ${backupName} (${obj.LastModified.toLocaleDateString()})`);
      }
      
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
    }
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  const backupId = process.argv[3];
  
  const backupManager = new BackupManager();
  
  switch (command) {
    case 'backup':
      await backupManager.executeFullBackup();
      break;
      
    case 'restore':
      if (!backupId) {
        console.error('❌ Please provide backup ID: node daily-backup.js restore <backup-id>');
        process.exit(1);
      }
      await backupManager.restoreFromBackup(backupId);
      break;
      
    case 'list':
      await backupManager.listBackups();
      break;
      
    default:
      console.log('📚 Usage:');
      console.log('  node daily-backup.js backup          - Create full backup');
      console.log('  node daily-backup.js restore <id>    - Restore from backup');
      console.log('  node daily-backup.js list            - List available backups');
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = BackupManager; 