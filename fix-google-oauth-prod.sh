#!/bin/bash

echo "🔧 Fixing Google OAuth in Production..."

# Check if we can connect to the server
if ! ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59 "echo 'SSH connection successful'" 2>/dev/null; then
    echo "❌ SSH connection failed. Please check:"
    echo "1. EC2 instance is running in AWS Console"
    echo "2. Security group allows SSH (port 22) from your IP"
    echo "3. Instance IP hasn't changed (current: 54.190.78.59)"
    exit 1
fi

echo "✅ SSH connection successful"

# Backup existing environment file
echo "📦 Backing up existing environment..."
ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59 "cd /var/www/newsteps && cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)"

# Update Google OAuth credentials
echo "🔑 Updating Google OAuth credentials..."
ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59 "cd /var/www/newsteps && cat > .env.production << 'EOF'
# Production Environment Variables
NEXTAUTH_URL=https://newsteps.fit
NEXTAUTH_SECRET=bQ/YbG8jW/yYTRiDEvZD8wsvULUlMU2nRMx77m6xuqw=
MONGODB_URI=mongodb+srv://walterzhang10:2wOi0rwKdS78NMWF@newsteps-db.q6powgg.mongodb.net/newsteps?retryWrites=true&w=majority&appName=newsteps-db
NEXT_PUBLIC_NEXTAUTH_URL=https://newsteps.fit

# Google OAuth Configuration (REAL CREDENTIALS)
GOOGLE_CLIENT_ID=196920789704-mpp72ggol9nkteq3lbvf5caq88masqja.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# AWS Configuration (placeholders for now)
AWS_ACCESS_KEY_ID=placeholder
AWS_SECRET_ACCESS_KEY=placeholder
S3_BUCKET_NAME=placeholder
CLOUDFRONT_URL=placeholder
CLOUDFRONT_DISTRIBUTION_ID=placeholder
AWS_ACCOUNT_ID=placeholder

# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=sandbox_client_id_placeholder

# Email Configuration
SMTP_HOST=email-smtp.us-west-2.amazonaws.com
SMTP_PORT=587
SMTP_USER=placeholder
SMTP_PASS=placeholder
EMAIL_FROM=newstepsfit@gmail.com
EOF"

# Update PM2 ecosystem configuration
echo "⚙️ Updating PM2 configuration..."
ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59 "cd /var/www/newsteps && cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'newsteps-production',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/newsteps',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXTAUTH_URL: 'https://newsteps.fit',
      NEXTAUTH_SECRET: 'bQ/YbG8jW/yYTRiDEvZD8wsvULUlMU2nRMx77m6xuqw=',
      MONGODB_URI: 'mongodb+srv://walterzhang10:2wOi0rwKdS78NMWF@newsteps-db.q6powgg.mongodb.net/newsteps?retryWrites=true&w=majority&appName=newsteps-db',
      NEXT_PUBLIC_NEXTAUTH_URL: 'https://newsteps.fit',
      GOOGLE_CLIENT_ID: '196920789704-mpp72ggol9nkteq3lbvf5caq88masqja.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: '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'
    }
  }]
};
EOF"

# Restart PM2 with new configuration
echo "🔄 Restarting PM2 with new configuration..."
ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59 "cd /var/www/newsteps && pm2 delete newsteps-production 2>/dev/null || true && pm2 start ecosystem.config.js --env production"

echo "✅ Google OAuth credentials updated!"
echo "🌐 Testing the fix..."

# Test the OAuth endpoint
sleep 5
if curl -s "https://newsteps.fit/api/auth/providers" | jq -r '.google.signinUrl' | grep -q "newsteps.fit"; then
    echo "✅ OAuth endpoints are working!"
    echo "🎉 Google OAuth should now work in production!"
    echo ""
    echo "🔍 Next steps:"
    echo "1. Make sure you've updated Google Console (see instructions above)"
    echo "2. Test Google login at: https://newsteps.fit/login"
else
    echo "❌ Something might still be wrong. Check PM2 logs:"
    ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59 "pm2 logs newsteps-production --lines 10"
fi 