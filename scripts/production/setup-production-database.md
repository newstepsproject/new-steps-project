# 🗄️ NEW STEPS PROJECT - PRODUCTION DATABASE SETUP

## **Overview**
Set up a separate MongoDB Atlas production database instance, distinct from development.

---

## **🎯 STEP 1: CREATE MONGODB ATLAS PRODUCTION CLUSTER**

### **1.1 Access MongoDB Atlas**
```bash
# Navigate to MongoDB Atlas
https://cloud.mongodb.com/
```

### **1.2 Create New Cluster**
```bash
# Cluster Configuration:
Cluster Name: newsteps-production
Cloud Provider: AWS
Region: US West (Oregon) - us-west-2
Cluster Tier: M10 (Dedicated)
Storage: 10 GB (auto-scaling enabled)
```

### **1.3 Database Security**
```bash
# Create Database User:
Username: newsteps-prod-user
Password: [Generate strong password]
Roles: readWrite@newsteps-production

# Network Access:
IP Whitelist: 
- Your production server IP
- 0.0.0.0/0 (for development - restrict later)
```

---

## **🎯 STEP 2: DATABASE MIGRATION STRATEGY**

### **2.1 Export Development Data (Selective)**
```bash
# Export only essential data (not test data)
mongodump --uri="mongodb://localhost:27017/newsteps" \
  --collection=users \
  --collection=operators \
  --collection=settings \
  --out=./production-backup

# Skip test collections:
# - Skip test users (email contains 'test' or 'example')  
# - Skip test donations
# - Skip temporary data
```

### **2.2 Clean Data Export Script**
```javascript
// scripts/production/export-clean-data.js
const mongoose = require('mongoose');

async function exportCleanData() {
    // Connect to development database
    await mongoose.connect('mongodb://localhost:27017/newsteps');
    
    // Export only production-ready data:
    // 1. Real users (exclude test emails)
    // 2. Real donations (exclude test data)
    // 3. Settings and operators
    // 4. Real shoe inventory
    
    console.log('Exporting clean production data...');
    // Implementation here
}
```

### **2.3 Import to Production**
```bash
# Import to MongoDB Atlas production cluster
mongorestore --uri="mongodb+srv://newsteps-prod-user:PASSWORD@cluster.mongodb.net/newsteps-production" \
  ./production-backup/newsteps
```

---

## **🎯 STEP 3: ENVIRONMENT CONFIGURATION**

### **3.1 Production Environment Variables**
```bash
# Add to .env.production:

# Production Database
MONGODB_URI=mongodb+srv://newsteps-prod-user:PASSWORD@cluster.mongodb.net/newsteps-production?retryWrites=true&w=majority

# Database Configuration
DB_NAME=newsteps-production
DB_MAX_POOL_SIZE=10
DB_TIMEOUT=30000
```

### **3.2 Connection String Format**
```bash
# Standard Format:
mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

# Example:
mongodb+srv://newsteps-prod-user:SecurePass123@newsteps-prod.abc123.mongodb.net/newsteps-production?retryWrites=true&w=majority
```

---

## **🎯 STEP 4: DATABASE INITIALIZATION**

### **4.1 Essential Collections Setup**
```javascript
// Collections that must exist in production:
- users (with admin@newsteps.fit)
- operators (project team info)
- settings (project configuration)
- shoes (inventory)
- donations (shoe donations)
- moneydonations (financial donations)
- requests (shoe requests)
- volunteers (volunteer applications)
```

### **4.2 Admin User Verification**
```javascript
// Ensure admin user exists in production
{
  email: "admin@newsteps.fit",
  firstName: "Admin",
  lastName: "User", 
  role: "admin",
  emailVerified: true,
  password: "[hashed]"
}
```

### **4.3 Default Settings**
```javascript
// Essential settings for production
{
  projectName: "New Steps Project",
  projectAddress: "348 Cardona Cir, San Ramon, CA 94583, USA",
  shippingFee: 5,
  paypalClientId: "[production-client-id]",
  // ... other settings
}
```

---

## **🎯 STEP 5: TESTING & VALIDATION**

### **5.1 Connection Test Script**
```javascript
// scripts/production/test-production-db.js
const mongoose = require('mongoose');

async function testProductionConnection() {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('Testing production database connection...');
        
        await mongoose.connect(uri);
        console.log('✅ Connected to production database');
        
        // Test basic operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections`);
        
        // Verify admin user exists
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const adminUser = await User.findOne({ email: 'admin@newsteps.fit' });
        
        if (adminUser) {
            console.log('✅ Admin user found in production database');
        } else {
            console.log('❌ Admin user NOT found - needs to be created');
        }
        
        await mongoose.disconnect();
        console.log('🎯 Production database test complete');
        
    } catch (error) {
        console.error('❌ Production database test failed:', error);
    }
}

testProductionConnection();
```

### **5.2 Data Integrity Checks**
```bash
# Run these checks after migration:
1. Verify user count matches expected
2. Check that admin user exists and can login
3. Verify settings are properly configured
4. Test basic CRUD operations
5. Ensure indexes are created properly
```

---

## **🎯 STEP 6: DEPLOYMENT CONFIGURATION**

### **6.1 PM2 Ecosystem Update**
```javascript
// ecosystem.config.js - add production database
module.exports = {
  apps: [{
    name: 'newsteps-production',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://...',  // Production URI
      // ... other production env vars
    }
  }]
};
```

### **6.2 Environment Separation**
```bash
# Development: mongodb://localhost:27017/newsteps
# Production: mongodb+srv://cluster.mongodb.net/newsteps-production

# Never mix environments!
# Development should never connect to production database
# Production should never connect to development database
```

---

## **🎯 STEP 7: BACKUP & MONITORING**

### **7.1 Automated Backups**
```bash
# MongoDB Atlas provides automatic backups
# Configure backup schedule:
- Continuous backup (point-in-time recovery)
- Snapshot schedule: Daily at 2:00 AM UTC
- Retention: 30 days
```

### **7.2 Monitoring Setup**
```bash
# Enable MongoDB Atlas monitoring:
- Performance monitoring
- Real-time alerts
- Slow query analysis
- Connection monitoring
```

---

## **🎯 STEP 8: SECURITY BEST PRACTICES**

### **8.1 Network Security**
```bash
# Restrict IP access:
1. Remove 0.0.0.0/0 after testing
2. Add only production server IP
3. Add your admin IP for management
4. Use VPN for additional security
```

### **8.2 User Permissions**
```bash
# Database user roles:
- Production app: readWrite@newsteps-production
- Admin access: dbAdmin@newsteps-production  
- Backup user: backup@newsteps-production
```

### **8.3 Connection Security**
```bash
# Always use:
- SSL/TLS encryption (enabled by default)
- Strong passwords (20+ characters)
- Connection string encryption
- Environment variable protection
```

---

## **📋 PRODUCTION DATABASE CHECKLIST**

- [ ] MongoDB Atlas M10 cluster created
- [ ] Production database user configured
- [ ] Network access properly restricted
- [ ] Clean data exported from development
- [ ] Data imported to production cluster
- [ ] Admin user verified in production
- [ ] Connection string updated in .env.production
- [ ] Database connection tested
- [ ] Backup schedule configured
- [ ] Monitoring alerts enabled
- [ ] Security settings reviewed

---

## **🚨 IMPORTANT NOTES**

1. **Never use development database in production**
2. **Always backup before major changes**
3. **Test database connection before deployment**
4. **Monitor database performance after launch**
5. **Keep connection strings secure**
6. **Regularly review access logs**

---

## **💰 ESTIMATED COSTS**

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| **MongoDB Atlas M10** | Dedicated cluster, 10GB | ~$57 |
| **Data Transfer** | Estimated usage | ~$5 |
| **Backup Storage** | 30-day retention | ~$3 |
| **Total** | | **~$65/month** |

---

**Next Steps**: Execute this setup process to create a robust, secure production database infrastructure.


