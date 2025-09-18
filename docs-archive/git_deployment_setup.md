# Git-Based Deployment Setup

## Issue Resolution
GitHub push protection was blocking due to AWS credentials in commit history. This has been resolved by creating a clean commit history without the problematic credentials.

## Git-Based Deployment Workflow

### 1. Local Development
```bash
# Make changes locally
git add .
git commit -m "[Cursor] Description of changes"
```

### 2. Push to GitHub
```bash
git push origin main
```

### 3. Deploy to Production
```bash
# SSH to production server
ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59

# Navigate to project directory
cd /var/www/newsteps

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Build application
npm run build

# Restart PM2 process
pm2 restart newsteps-production

# Verify deployment
curl -s -o /dev/null -w "%{http_code}" https://newsteps.fit
```

## Production Server Setup

### Initial Setup (One-time)
```bash
# Clone repository on production server
cd /var/www
git clone https://github.com/newstepsproject/new-steps-project.git newsteps
cd newsteps

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

### Environment Variables
Production environment variables are managed via PM2 ecosystem.config.js:
- MONGODB_URI: Production MongoDB Atlas connection
- NEXTAUTH_SECRET: Authentication secret
- NEXTAUTH_URL: https://newsteps.fit
- GOOGLE_CLIENT_ID: Google OAuth client ID
- GOOGLE_CLIENT_SECRET: Google OAuth secret
- GMAIL_USER: Email service user
- GMAIL_PASS: Email service password

## Deployment Script (Optional)
Create automated deployment script on production server:

```bash
#!/bin/bash
# deploy.sh
echo "🚀 Deploying New Steps Project..."
cd /var/www/newsteps
git pull origin main
npm install
npm run build
pm2 restart newsteps-production
echo "✅ Deployment complete!"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://newsteps.fit
```

## Benefits of Git-Based Deployment
- ✅ Version control for all deployments
- ✅ Easy rollback capability
- ✅ Audit trail of all changes
- ✅ Consistent deployment process
- ✅ No manual file copying required

## Security Notes
- AWS credentials are managed via environment variables only
- No sensitive data in Git repository
- Production secrets managed via PM2 ecosystem configuration
- GitHub push protection ensures no accidental credential commits
