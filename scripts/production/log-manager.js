#!/usr/bin/env node

/**
 * PRODUCTION LOG MANAGER
 * Collects, downloads, and manages production logs for debugging
 * Supports local log analysis and error tracking
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
require('dotenv').config({ path: '.env.production' });

// Configuration
const CONFIG = {
  LOG_DIRS: {
    application: '/var/log/pm2',
    nginx: '/var/log/nginx',
    system: '/var/log',
    app_custom: '/var/www/newsteps/logs'
  },
  LOCAL_LOG_DIR: './logs/production',
  S3_BUCKET: process.env.LOG_S3_BUCKET || 'newsteps-logs',
  AWS_REGION: process.env.AWS_REGION || 'us-west-2',
  RETENTION_DAYS: 90,
  MAX_LOG_SIZE: 100 * 1024 * 1024, // 100MB
  LOG_PATTERNS: {
    error: /error|ERROR|Error|exception|Exception|fail|FAIL|Fail/,
    warning: /warn|WARNING|Warning|deprecated|Deprecated/,
    info: /info|INFO|Info|success|SUCCESS|Success/
  }
};

// AWS CloudWatch Configuration
const cloudWatchLogs = new AWS.CloudWatchLogs({
  region: CONFIG.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// S3 Configuration
const s3 = new AWS.S3({
  region: CONFIG.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class LogManager {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logSession = `log-session-${this.timestamp}`;
    this.localLogPath = path.join(CONFIG.LOCAL_LOG_DIR, this.logSession);
    
    // Ensure local log directory exists
    if (!fs.existsSync(this.localLogPath)) {
      fs.mkdirSync(this.localLogPath, { recursive: true });
    }
  }

  // Collect all system logs
  async collectSystemLogs() {
    console.log('📋 Collecting system logs...');
    
    const logSummary = {
      timestamp: new Date().toISOString(),
      logs: {},
      errors: [],
      summary: {
        totalFiles: 0,
        totalSize: 0,
        errorCount: 0,
        warningCount: 0
      }
    };

    for (const [category, logDir] of Object.entries(CONFIG.LOG_DIRS)) {
      console.log(`\n📁 Processing ${category} logs from ${logDir}...`);
      
      try {
        if (!fs.existsSync(logDir)) {
          console.warn(`   ⚠️  Directory not found: ${logDir}`);
          continue;
        }

        const categoryLogs = await this.processLogDirectory(logDir, category);
        logSummary.logs[category] = categoryLogs;
        
        // Update summary
        logSummary.summary.totalFiles += categoryLogs.files.length;
        logSummary.summary.totalSize += categoryLogs.totalSize;
        logSummary.summary.errorCount += categoryLogs.errorCount;
        logSummary.summary.warningCount += categoryLogs.warningCount;
        
        console.log(`   ✅ ${category}: ${categoryLogs.files.length} files, ${(categoryLogs.totalSize / 1024 / 1024).toFixed(2)}MB`);
        
      } catch (error) {
        console.error(`   ❌ Failed to process ${category} logs:`, error.message);
        logSummary.errors.push({
          category,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return logSummary;
  }

  // Process a single log directory
  async processLogDirectory(logDir, category) {
    const result = {
      category,
      directory: logDir,
      files: [],
      totalSize: 0,
      errorCount: 0,
      warningCount: 0,
      latestError: null,
      latestWarning: null
    };

    try {
      const files = await readdir(logDir);
      
      for (const file of files) {
        const filePath = path.join(logDir, file);
        
        try {
          const fileStat = await stat(filePath);
          
          if (fileStat.isFile() && this.isLogFile(file)) {
            const fileInfo = {
              name: file,
              path: filePath,
              size: fileStat.size,
              modified: fileStat.mtime,
              category
            };
            
            // Analyze log content for errors/warnings
            const analysis = await this.analyzeLogFile(filePath);
            fileInfo.analysis = analysis;
            
            result.files.push(fileInfo);
            result.totalSize += fileStat.size;
            result.errorCount += analysis.errorCount;
            result.warningCount += analysis.warningCount;
            
            // Track latest error/warning
            if (analysis.latestError) {
              result.latestError = analysis.latestError;
            }
            if (analysis.latestWarning) {
              result.latestWarning = analysis.latestWarning;
            }
          }
        } catch (error) {
          console.warn(`   ⚠️  Skipping ${file}: ${error.message}`);
        }
      }
      
      // Sort files by modification time (newest first)
      result.files.sort((a, b) => b.modified - a.modified);
      
    } catch (error) {
      console.error(`Failed to read directory ${logDir}:`, error.message);
      throw error;
    }

    return result;
  }

  // Check if file is a log file
  isLogFile(filename) {
    const logExtensions = ['.log', '.out', '.err', '.access', '.error'];
    const logPatterns = [/\.log$/, /\.out$/, /\.err$/, /access\.log/, /error\.log/];
    
    return logExtensions.some(ext => filename.endsWith(ext)) ||
           logPatterns.some(pattern => pattern.test(filename));
  }

  // Analyze log file for errors and warnings
  async analyzeLogFile(filePath) {
    const analysis = {
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      latestError: null,
      latestWarning: null,
      fileSize: 0
    };

    try {
      const fileStat = await stat(filePath);
      analysis.fileSize = fileStat.size;
      
      // Skip very large files to avoid memory issues
      if (fileStat.size > CONFIG.MAX_LOG_SIZE) {
        console.warn(`   ⚠️  Skipping analysis of large file: ${path.basename(filePath)} (${(fileStat.size / 1024 / 1024).toFixed(2)}MB)`);
        return analysis;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (CONFIG.LOG_PATTERNS.error.test(line)) {
          analysis.errorCount++;
          analysis.latestError = {
            line: line.trim(),
            timestamp: new Date().toISOString()
          };
        } else if (CONFIG.LOG_PATTERNS.warning.test(line)) {
          analysis.warningCount++;
          analysis.latestWarning = {
            line: line.trim(),
            timestamp: new Date().toISOString()
          };
        } else if (CONFIG.LOG_PATTERNS.info.test(line)) {
          analysis.infoCount++;
        }
      }
      
    } catch (error) {
      console.warn(`   ⚠️  Failed to analyze ${path.basename(filePath)}: ${error.message}`);
    }

    return analysis;
  }

  // Download logs from CloudWatch
  async downloadCloudWatchLogs() {
    console.log('☁️  Downloading CloudWatch logs...');
    
    try {
      const logGroups = await cloudWatchLogs.describeLogGroups().promise();
      const newStepsGroups = logGroups.logGroups.filter(group => 
        group.logGroupName.includes('newsteps')
      );
      
      for (const group of newStepsGroups) {
        console.log(`   📥 Downloading ${group.logGroupName}...`);
        
        const streams = await cloudWatchLogs.describeLogStreams({
          logGroupName: group.logGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 10
        }).promise();
        
        for (const stream of streams.logStreams) {
          const events = await cloudWatchLogs.getLogEvents({
            logGroupName: group.logGroupName,
            logStreamName: stream.logStreamName,
            startTime: Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
          }).promise();
          
          if (events.events.length > 0) {
            const logContent = events.events.map(event => 
              `${new Date(event.timestamp).toISOString()} ${event.message}`
            ).join('\n');
            
            const filename = `${group.logGroupName.replace(/[^a-zA-Z0-9]/g, '_')}_${stream.logStreamName.replace(/[^a-zA-Z0-9]/g, '_')}.log`;
            const filepath = path.join(this.localLogPath, 'cloudwatch', filename);
            
            // Ensure directory exists
            if (!fs.existsSync(path.dirname(filepath))) {
              fs.mkdirSync(path.dirname(filepath), { recursive: true });
            }
            
            fs.writeFileSync(filepath, logContent);
            console.log(`   ✅ Saved ${filename} (${events.events.length} events)`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ CloudWatch download failed:', error.message);
    }
  }

  // Download and archive logs
  async downloadLogs() {
    console.log(`🚀 Starting log download session: ${this.logSession}`);
    console.log('=' .repeat(60));
    
    try {
      const startTime = Date.now();
      
      // Collect system logs
      const logSummary = await this.collectSystemLogs();
      
      // Copy relevant log files to local directory
      console.log('\n📋 Copying log files to local directory...');
      
      for (const [category, categoryLogs] of Object.entries(logSummary.logs)) {
        const categoryDir = path.join(this.localLogPath, category);
        if (!fs.existsSync(categoryDir)) {
          fs.mkdirSync(categoryDir, { recursive: true });
        }
        
        // Copy recent log files
        for (const file of categoryLogs.files.slice(0, 10)) { // Limit to 10 most recent files per category
          try {
            const destPath = path.join(categoryDir, file.name);
            execSync(`cp "${file.path}" "${destPath}"`);
            console.log(`   ✅ Copied: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
          } catch (error) {
            console.warn(`   ⚠️  Failed to copy ${file.name}: ${error.message}`);
          }
        }
      }
      
      // Download CloudWatch logs
      await this.downloadCloudWatchLogs();
      
      // Create summary report
      const reportPath = path.join(this.localLogPath, 'log-analysis-report.json');
      const report = {
        session: this.logSession,
        timestamp: new Date().toISOString(),
        summary: logSummary.summary,
        topErrors: this.extractTopErrors(logSummary),
        topWarnings: this.extractTopWarnings(logSummary),
        recommendations: this.generateRecommendations(logSummary)
      };
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n✅ Analysis report saved: ${reportPath}`);
      
      // Create archive
      const archivePath = path.join(CONFIG.LOCAL_LOG_DIR, `${this.logSession}.tar.gz`);
      const tarCommand = `tar -czf "${archivePath}" -C "${CONFIG.LOCAL_LOG_DIR}" "${this.logSession}"`;
      execSync(tarCommand);
      
      const duration = (Date.now() - startTime) / 1000;
      
      console.log('=' .repeat(60));
      console.log(`🎉 LOG DOWNLOAD COMPLETE: ${this.logSession}`);
      console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
      console.log(`📁 Archive: ${archivePath}`);
      console.log(`📊 Total Errors: ${logSummary.summary.errorCount}`);
      console.log(`⚠️  Total Warnings: ${logSummary.summary.warningCount}`);
      console.log(`📄 Total Files: ${logSummary.summary.totalFiles}`);
      console.log(`💾 Total Size: ${(logSummary.summary.totalSize / 1024 / 1024).toFixed(2)}MB`);
      
      return {
        success: true,
        session: this.logSession,
        archive: archivePath,
        report: reportPath,
        summary: logSummary.summary
      };
      
    } catch (error) {
      console.error('💥 LOG DOWNLOAD FAILED:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Extract top errors from log summary
  extractTopErrors(logSummary) {
    const errors = [];
    
    for (const [category, categoryLogs] of Object.entries(logSummary.logs)) {
      for (const file of categoryLogs.files) {
        if (file.analysis && file.analysis.latestError) {
          errors.push({
            category,
            file: file.name,
            error: file.analysis.latestError.line,
            timestamp: file.analysis.latestError.timestamp
          });
        }
      }
    }
    
    return errors.slice(0, 20); // Top 20 errors
  }

  // Extract top warnings from log summary
  extractTopWarnings(logSummary) {
    const warnings = [];
    
    for (const [category, categoryLogs] of Object.entries(logSummary.logs)) {
      for (const file of categoryLogs.files) {
        if (file.analysis && file.analysis.latestWarning) {
          warnings.push({
            category,
            file: file.name,
            warning: file.analysis.latestWarning.line,
            timestamp: file.analysis.latestWarning.timestamp
          });
        }
      }
    }
    
    return warnings.slice(0, 20); // Top 20 warnings
  }

  // Generate recommendations based on log analysis
  generateRecommendations(logSummary) {
    const recommendations = [];
    
    // Check for high error rates
    if (logSummary.summary.errorCount > 100) {
      recommendations.push({
        priority: 'high',
        category: 'errors',
        message: `High error count detected (${logSummary.summary.errorCount}). Investigate application stability.`,
        action: 'Review error logs and fix underlying issues'
      });
    }
    
    // Check for high warning rates
    if (logSummary.summary.warningCount > 500) {
      recommendations.push({
        priority: 'medium',
        category: 'warnings',
        message: `High warning count detected (${logSummary.summary.warningCount}). Review and optimize code.`,
        action: 'Address warning messages to prevent future issues'
      });
    }
    
    // Check for large log files
    const largeLogs = [];
    for (const [category, categoryLogs] of Object.entries(logSummary.logs)) {
      for (const file of categoryLogs.files) {
        if (file.size > 50 * 1024 * 1024) { // 50MB
          largeLogs.push(`${category}/${file.name}`);
        }
      }
    }
    
    if (largeLogs.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'maintenance',
        message: `Large log files detected: ${largeLogs.join(', ')}`,
        action: 'Implement log rotation and cleanup policies'
      });
    }
    
    return recommendations;
  }

  // Upload logs to S3 for long-term storage
  async uploadToS3(archivePath) {
    console.log('☁️  Uploading logs to S3...');
    
    try {
      const fileStream = fs.createReadStream(archivePath);
      const uploadParams = {
        Bucket: CONFIG.S3_BUCKET,
        Key: `production-logs/${this.logSession}.tar.gz`,
        Body: fileStream,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'log-session': this.logSession,
          'upload-date': new Date().toISOString()
        }
      };
      
      await s3.upload(uploadParams).promise();
      console.log(`✅ Logs uploaded to S3: s3://${CONFIG.S3_BUCKET}/production-logs/${this.logSession}.tar.gz`);
      
    } catch (error) {
      console.error('❌ S3 upload failed:', error);
    }
  }

  // Clean up old log sessions
  async cleanupOldSessions() {
    console.log('🧹 Cleaning up old log sessions...');
    
    try {
      const sessions = fs.readdirSync(CONFIG.LOCAL_LOG_DIR);
      const cutoffDate = new Date(Date.now() - CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);
      
      let deleted = 0;
      for (const session of sessions) {
        const sessionPath = path.join(CONFIG.LOCAL_LOG_DIR, session);
        const sessionStat = await stat(sessionPath);
        
        if (sessionStat.mtime < cutoffDate) {
          execSync(`rm -rf "${sessionPath}"`);
          deleted++;
        }
      }
      
      console.log(`✅ Cleaned up ${deleted} old log sessions`);
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  // Analyze specific error patterns
  async analyzeErrors(pattern) {
    console.log(`🔍 Analyzing error pattern: ${pattern}`);
    
    const results = [];
    const regex = new RegExp(pattern, 'gi');
    
    for (const [category, logDir] of Object.entries(CONFIG.LOG_DIRS)) {
      if (!fs.existsSync(logDir)) continue;
      
      try {
        const files = await readdir(logDir);
        
        for (const file of files) {
          if (!this.isLogFile(file)) continue;
          
          const filePath = path.join(logDir, file);
          const fileStat = await stat(filePath);
          
          if (fileStat.size > CONFIG.MAX_LOG_SIZE) continue;
          
          const content = fs.readFileSync(filePath, 'utf8');
          const matches = content.match(regex);
          
          if (matches && matches.length > 0) {
            results.push({
              category,
              file,
              path: filePath,
              matches: matches.length,
              examples: matches.slice(0, 5)
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${category}: ${error.message}`);
      }
    }
    
    console.log(`Found ${results.length} files with pattern "${pattern}"`);
    return results;
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  const parameter = process.argv[3];
  
  const logManager = new LogManager();
  
  switch (command) {
    case 'download':
      const result = await logManager.downloadLogs();
      if (result.success && process.argv.includes('--upload')) {
        await logManager.uploadToS3(result.archive);
      }
      break;
      
    case 'analyze':
      if (!parameter) {
        console.error('❌ Please provide error pattern: node log-manager.js analyze "error_pattern"');
        process.exit(1);
      }
      await logManager.analyzeErrors(parameter);
      break;
      
    case 'cleanup':
      await logManager.cleanupOldSessions();
      break;
      
    default:
      console.log('📚 Usage:');
      console.log('  node log-manager.js download [--upload]     - Download all logs');
      console.log('  node log-manager.js analyze "pattern"       - Analyze specific error pattern');
      console.log('  node log-manager.js cleanup                 - Clean up old log sessions');
      console.log('\nExamples:');
      console.log('  node log-manager.js download --upload');
      console.log('  node log-manager.js analyze "database connection"');
      console.log('  node log-manager.js analyze "500 error"');
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = LogManager; 