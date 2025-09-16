# Git-Based Production Deployment Workflow

## 🚀 **Standard Deployment Process**

### **Step 1: Local Development & Testing**
```bash
# 1. Develop and test locally
npm run dev
python3 tools/comprehensive_localhost_validator.py

# 2. Ensure 100% localhost validation
# Only proceed if all tests pass
```

### **Step 2: Git Commit & Push**
```bash
# 1. Stage changes
git add .

# 2. Commit with descriptive message
git commit -m "[Cursor] Feature description - brief summary"

# 3. Push to GitHub
git push origin main
```

### **Step 3: Production Deployment via Git**
```bash
# SSH to production server
ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59

# Navigate to project directory
cd /var/www/newsteps

# Pull latest changes from GitHub
git pull origin main

# Install any new dependencies
npm install

# Build application
NODE_OPTIONS='--max-old-space-size=1024' npm run build

# Restart PM2
pm2 restart newsteps-production

# Verify deployment
curl -s -I https://newsteps.fit | head -1
```

## 🔧 **Automated Deployment Script**

Create this script on the production server at `/var/www/newsteps/deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Starting Git-based deployment..."

# Pull latest changes
echo "📥 Pulling from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🏗️ Building application..."
NODE_OPTIONS='--max-old-space-size=1024' npm run build

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart newsteps-production

# Health check
echo "🌐 Health check..."
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://newsteps.fit)

if [ "$STATUS" = "200" ]; then
    echo "✅ Deployment successful! Website is online."
else
    echo "❌ Deployment issue detected. Status: $STATUS"
    echo "🔄 Rolling back..."
    git reset --hard HEAD~1
    npm run build
    pm2 restart newsteps-production
fi

echo "🎉 Deployment complete!"
```

## 🛡️ **Security Best Practices**

### **Never Commit Secrets**
- ✅ Use `.env` files (already in `.gitignore`)
- ✅ Use PM2 ecosystem config for production secrets
- ❌ Never commit AWS keys, API secrets, or passwords

### **Environment Variables Management**
```bash
# Production secrets go in ecosystem.config.js (not in Git)
# Development secrets go in .env.local (not in Git)
# Public config goes in .env.example (safe to commit)
```

## 🔄 **Rollback Procedure**

If deployment fails:
```bash
# SSH to production
ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59
cd /var/www/newsteps

# Rollback to previous commit
git reset --hard HEAD~1

# Rebuild and restart
npm run build
pm2 restart newsteps-production

# Verify rollback
curl -s -I https://newsteps.fit | head -1
```

## 📊 **Deployment Checklist**

### **Pre-Deployment**
- [ ] 100% localhost validation passed
- [ ] No secrets in commit
- [ ] Descriptive commit message
- [ ] Changes pushed to GitHub

### **Deployment**
- [ ] SSH to production server
- [ ] Git pull successful
- [ ] Dependencies installed
- [ ] Build successful
- [ ] PM2 restarted
- [ ] Health check passed

### **Post-Deployment**
- [ ] Website responding (200 OK)
- [ ] Key functionality tested
- [ ] No errors in PM2 logs
- [ ] Email system working (if changed)

## 🎯 **Benefits of Git-Based Deployment**

1. **Version Control**: All changes tracked in Git history
2. **Rollback Capability**: Easy to revert to previous versions
3. **Audit Trail**: Clear record of what was deployed when
4. **Collaboration**: Multiple developers can deploy safely
5. **Consistency**: Same code in development, staging, and production
6. **Security**: No direct file transfers, only Git operations

## 🚨 **Emergency Procedures**

### **If Git Pull Fails**
```bash
# Check for local changes
git status

# Stash local changes if needed
git stash

# Force pull
git reset --hard origin/main
```

### **If Build Fails**
```bash
# Check Node.js memory
NODE_OPTIONS='--max-old-space-size=2048' npm run build

# Clear cache if needed
rm -rf .next node_modules/.cache
npm install
npm run build
```

### **If PM2 Fails**
```bash
# Check PM2 status
pm2 status

# Restart all processes
pm2 restart all

# Check logs
pm2 logs --lines 50
```

This workflow ensures secure, reliable, and traceable deployments while maintaining the highest quality standards established by our comprehensive testing methodology.
