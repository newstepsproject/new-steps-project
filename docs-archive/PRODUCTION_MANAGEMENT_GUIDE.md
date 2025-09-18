# 🚀 NEW STEPS PROJECT - PRODUCTION MANAGEMENT GUIDE
## Complete Operations Guide for Solo Developer

---

## **📋 EXECUTIVE SUMMARY**

This guide provides everything you need to manage the New Steps Project in production as a solo developer. All scripts, monitoring, and maintenance procedures are automated with manual override capabilities.

**🎯 Quick Access Commands:**
```bash
# Health check
curl https://newsteps.fit/api/health

# Manual backup
node scripts/production/daily-backup.js backup

# Download logs for debugging
node scripts/production/log-manager.js download

# Emergency database reset
node scripts/production/reset-database.js

# Deploy new version
bash scripts/production/deploy.sh
```

---

## **🔧 PRODUCTION ENVIRONMENT OVERVIEW**

### **Current Architecture**
```
Production Stack:
├── AWS EC2 (t3.medium) - Application Server
├── MongoDB Atlas (M10) - Production Database  
├── AWS SES - Email Service
├── PayPal Live - Payment Processing
├── AWS S3 - File Storage & Backups
├── CloudWatch - Monitoring & Logs
└── Route 53 - DNS Management
```

### **Access Credentials**
- **Server**: `ssh ubuntu@newsteps.fit`
- **Admin Panel**: `https://newsteps.fit/admin`
- **Database**: MongoDB Atlas Dashboard
- **AWS Console**: AWS Management Console
- **PayPal**: PayPal Developer Dashboard

---

## **🛠️ DAILY OPERATIONS**

### **Automated Tasks (No Action Required)**
| Time | Task | Script | Purpose |
|------|------|--------|---------|
| **Every 5 min** | Health Check | health-monitoring-cron.sh | Auto-restart if down |
| **2:00 AM** | Database Backup | daily-backup.js | Full backup to S3 |
| **3:30 AM** | Log Management | log-manager.js | Download & cleanup logs |
| **12:00 PM/AM** | SSL Renewal | ssl-renewal-cron.sh | Keep certificates valid |
| **Sunday 4:00 AM** | System Updates | system-updates-cron.sh | Security patches |

### **Manual Monitoring (5 minutes daily)**
```bash
# Check application status
pm2 status

# Check system resources
df -h          # Disk usage
free -h        # Memory usage
top            # CPU usage

# Check recent logs
tail -f /var/log/pm2/newsteps-combined.log
```

---

## **🚨 EMERGENCY PROCEDURES**

### **Site Down (Application Not Responding)**
```bash
# 1. Check PM2 status
pm2 status

# 2. Restart application
pm2 restart newsteps-production

# 3. If still down, check logs
pm2 logs newsteps-production

# 4. If critical, rollback to previous version
bash scripts/production/deploy.sh --rollback

# 5. If database issues, check MongoDB Atlas
# Visit: https://cloud.mongodb.com/
```

### **Database Issues**
```bash
# Check database connection
node -e "require('./src/lib/db').connectToDatabase().then(() => console.log('DB OK')).catch(console.error)"

# If corrupted, restore from backup
node scripts/production/daily-backup.js restore backup-YYYYMMDD-HHMMSS

# Emergency reset (DANGER: Deletes all data)
node scripts/production/reset-database.js
```

### **High Resource Usage Alerts**
```bash
# Check disk space (if >85% used)
du -sh /var/www/newsteps/*     # Check app directory
du -sh /var/log/*              # Check log files
du -sh /var/backups/*          # Check backup files

# Clean up if needed
npm run clean                  # Clean build files
pm2 flush                     # Clear PM2 logs
docker system prune -f        # Clean Docker (if using)

# Check memory usage (if >90% used)
pm2 monit                     # Check PM2 memory usage
ps aux --sort=-%mem | head    # Check top memory processes
```

---

## **📊 MONITORING & ALERTS**

### **Key Metrics to Watch**
- **Uptime**: Target 99.9% (8.76 hours downtime/year)
- **Response Time**: < 2 seconds average
- **Error Rate**: < 1% of requests
- **Disk Usage**: < 80% capacity
- **Memory Usage**: < 85% capacity

### **Alert Channels**
- **Email**: admin@newsteps.fit (configured in cron scripts)
- **Logs**: `/var/log/newsteps/monitoring/`
- **PM2**: `pm2 monit` for real-time monitoring

### **Manual Health Checks**
```bash
# Application health
curl -I https://newsteps.fit/api/health

# Database health  
curl -I https://newsteps.fit/api/health/database

# SSL certificate status
openssl s_client -connect newsteps.fit:443 -servername newsteps.fit </dev/null 2>/dev/null | openssl x509 -noout -dates
```

---

## **🔄 DEPLOYMENT WORKFLOW**

### **Standard Deployment**
```bash
# 1. Connect to server
ssh ubuntu@newsteps.fit

# 2. Navigate to app directory
cd /var/www/newsteps

# 3. Run deployment script
bash scripts/production/deploy.sh

# 4. Monitor logs after deployment
pm2 logs newsteps-production --lines 50
```

### **Hotfix Deployment**
```bash
# For urgent fixes, force deployment without confirmation
bash scripts/production/deploy.sh --force

# Monitor closely after hotfix
watch -n 5 'curl -s https://newsteps.fit/api/health'
```

### **Rollback Procedure**
```bash
# If deployment fails, automatic rollback occurs
# Manual rollback:
bash scripts/production/deploy.sh --rollback

# Verify rollback success
curl https://newsteps.fit/api/health
```

---

## **💾 BACKUP & RECOVERY**

### **Backup Schedule**
- **Daily**: Complete database + application backup (2:00 AM)
- **Pre-deployment**: Automatic backup before each deployment
- **Manual**: On-demand backups for major changes

### **Manual Backup**
```bash
# Create immediate backup
node scripts/production/daily-backup.js backup

# List available backups
node scripts/production/daily-backup.js list

# Restore from specific backup
node scripts/production/daily-backup.js restore backup-20240131-120000
```

### **Recovery Procedures**
```bash
# Full system restore (CRITICAL PROCEDURE)
# 1. Stop application
pm2 stop newsteps-production

# 2. Restore from backup
node scripts/production/daily-backup.js restore [backup-id]

# 3. Verify restoration
npm run test:health

# 4. Restart application
pm2 start ecosystem.config.js
```

---

## **🐛 DEBUGGING & LOG ANALYSIS**

### **Log Collection for Local Analysis**
```bash
# Download all logs for debugging
node scripts/production/log-manager.js download

# Download logs with S3 upload
node scripts/production/log-manager.js download --upload

# Analyze specific error patterns
node scripts/production/log-manager.js analyze "database connection"
node scripts/production/log-manager.js analyze "500 error"
```

### **Common Issues & Solutions**

#### **PayPal Payment Failures**
```bash
# Check PayPal logs
grep -r "paypal" /var/log/pm2/
grep -r "payment" /var/log/pm2/

# Verify PayPal credentials
curl -X POST https://api-m.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -d "grant_type=client_credentials" \
  -u "$PAYPAL_CLIENT_ID:$PAYPAL_CLIENT_SECRET"
```

#### **Email Delivery Issues**
```bash
# Check SES status
aws ses get-send-quota --region us-west-2

# Test email sending
node -e "
const { sendEmail } = require('./src/lib/email');
sendEmail('test@example.com', 'TEST', { message: 'Test email' })
  .then(() => console.log('Email sent'))
  .catch(console.error);
"
```

#### **Database Connection Problems**
```bash
# Test MongoDB connection
mongo "$MONGODB_URI" --eval "db.runCommand({ping: 1})"

# Check connection pool
node -e "
require('./src/lib/db').connectToDatabase()
  .then(() => console.log('Connected'))
  .catch(err => console.error('Failed:', err.message));
"
```

---

## **🔐 SECURITY MAINTENANCE**

### **Weekly Security Tasks**
```bash
# Check for security updates
sudo apt list --upgradable

# Update SSL certificates (automated, but verify)
sudo certbot certificates

# Review access logs for suspicious activity
tail -100 /var/log/nginx/access.log | grep -E "(404|500|403)"

# Check failed login attempts
sudo journalctl -u ssh -n 50
```

### **Monthly Security Review**
- [ ] Review AWS IAM permissions
- [ ] Check MongoDB Atlas security settings
- [ ] Update PayPal webhook endpoints if needed
- [ ] Review application user accounts in admin panel
- [ ] Verify backup encryption and retention

---

## **📈 PERFORMANCE OPTIMIZATION**

### **Performance Monitoring**
```bash
# Check application response times
curl -w "@curl-format.txt" -o /dev/null -s https://newsteps.fit

# Create curl-format.txt:
cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

### **Optimization Actions**
```bash
# Clear application cache
pm2 restart newsteps-production

# Clean up old files
find /var/log -name "*.log" -mtime +7 -delete
find /tmp -name "tmp*" -mtime +1 -delete

# Optimize database (if needed)
# Connect to MongoDB Atlas and run db.runCommand({compact: "collection_name"})
```

---

## **💰 COST MONITORING**

### **Monthly AWS Costs (Target: <$120/month)**
- **EC2 t3.medium**: ~$30/month
- **MongoDB Atlas M10**: ~$57/month  
- **Route 53**: ~$1/month
- **S3 Storage**: ~$5/month
- **SES**: ~$0.10/month
- **Data Transfer**: ~$10/month
- **CloudWatch**: ~$5/month

### **Cost Optimization Tips**
```bash
# Monitor S3 storage usage
aws s3 ls s3://newsteps-backups --recursive --summarize

# Check data transfer costs
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name NetworkOut \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \
  --statistics Sum \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 86400
```

---

## **📞 SUPPORT RESOURCES**

### **Technical Support**
- **AWS Support**: Business plan provides 24/7 support
- **MongoDB Atlas**: Built-in support with M10 tier
- **PayPal Developer**: developer.paypal.com/support
- **Community**: Stack Overflow, GitHub Issues

### **Emergency Contacts**
- **Domain Registrar**: [Your registrar support]
- **AWS Support**: 1-800-221-0051 (US)
- **MongoDB Support**: Through Atlas dashboard
- **PayPal Support**: Through developer dashboard

---

## **📚 DOCUMENTATION REFERENCES**

### **Project Documentation**
- **API Documentation**: `/docs/api/`
- **Database Schema**: `/docs/database-schema.md`
- **Deployment Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Testing Plan**: `COMPREHENSIVE_TEST_PLAN.md`

### **External Documentation**
- **Next.js**: https://nextjs.org/docs
- **MongoDB**: https://docs.mongodb.com/
- **AWS EC2**: https://docs.aws.amazon.com/ec2/
- **PM2**: https://pm2.keymetrics.io/docs/

---

## **🎯 SUCCESS METRICS**

### **Weekly Goals**
- **Uptime**: > 99.5%
- **Page Load Time**: < 2 seconds
- **Error Rate**: < 0.5%
- **Backup Success**: 100%

### **Monthly Review**
- [ ] Performance metrics analysis
- [ ] Cost optimization review
- [ ] Security audit completion
- [ ] Backup integrity verification
- [ ] User feedback assessment

---

## **⚡ QUICK REFERENCE COMMANDS**

```bash
# === DAILY COMMANDS ===
pm2 status                           # Check app status
df -h && free -h                     # Check resources
tail -f /var/log/pm2/newsteps-*.log  # Monitor logs

# === BACKUP COMMANDS ===
node scripts/production/daily-backup.js backup        # Manual backup
node scripts/production/daily-backup.js list          # List backups
node scripts/production/daily-backup.js restore ID    # Restore backup

# === DEPLOYMENT COMMANDS ===
bash scripts/production/deploy.sh                     # Standard deploy
bash scripts/production/deploy.sh --force             # Force deploy
bash scripts/production/deploy.sh --rollback          # Rollback

# === DEBUGGING COMMANDS ===
node scripts/production/log-manager.js download       # Get logs
node scripts/production/log-manager.js analyze "term" # Analyze errors
pm2 logs newsteps-production                          # Real-time logs

# === EMERGENCY COMMANDS ===
pm2 restart newsteps-production                       # Restart app
node scripts/production/reset-database.js             # Reset DB (DANGER!)
bash scripts/production/deploy.sh --rollback          # Emergency rollback
```

---

**🎉 CONGRATULATIONS!** You now have a complete production management system for the New Steps Project. All operations are automated with manual overrides available. The system is designed to be maintenance-light while providing comprehensive monitoring and recovery capabilities.

**Next Steps**: Monitor the automated systems for the first week and familiarize yourself with the emergency procedures. The platform is production-ready and scalable for growth. 