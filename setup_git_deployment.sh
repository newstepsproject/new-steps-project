#!/bin/bash

echo "🔧 Setting up Git-based deployment workflow"
echo "=========================================="

# Create deployment script on production server
echo "📝 Creating deployment script on production server..."

ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59 << 'EOF'
cd /var/www/newsteps

# Create deployment script
cat > deploy.sh << 'DEPLOY_SCRIPT'
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
    echo "📊 PM2 Status:"
    pm2 status
else
    echo "❌ Deployment issue detected. Status: $STATUS"
    echo "🔄 Rolling back..."
    git reset --hard HEAD~1
    NODE_OPTIONS='--max-old-space-size=1024' npm run build
    pm2 restart newsteps-production
    echo "⚠️ Rollback completed. Please check the issues."
fi

echo "🎉 Deployment complete!"
DEPLOY_SCRIPT

# Make script executable
chmod +x deploy.sh

echo "✅ Deployment script created at /var/www/newsteps/deploy.sh"
echo "📋 Usage: ./deploy.sh"
EOF

echo ""
echo "🎯 Git-based deployment workflow setup complete!"
echo ""
echo "📚 How to use:"
echo "1. Develop and test locally (100% validation required)"
echo "2. Commit and push to GitHub: git push origin main"
echo "3. Deploy to production:"
echo "   ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59"
echo "   cd /var/www/newsteps"
echo "   ./deploy.sh"
echo ""
echo "🛡️ Security: No more direct file transfers - only Git operations!"
echo "🔄 Rollback: Built-in automatic rollback on deployment failure"
echo "📊 Monitoring: Health checks and PM2 status included"
echo ""
