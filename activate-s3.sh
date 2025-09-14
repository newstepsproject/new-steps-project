#!/usr/bin/env bash
set -euo pipefail
cd /var/www/newsteps
printf '📦 Backing up .env.production...\n'
cp .env.production .env.production.bak.$(date +%s) || true
printf '📝 Writing S3 env vars...\n'
TMP_FILE=$(mktemp)
grep -Ev '^(STORAGE_PROVIDER|S3_REGION|AWS_REGION|S3_BUCKET|S3_BUCKET_NAME|S3_PUBLIC_URL)=' .env.production > "$TMP_FILE" || true
cat >> "$TMP_FILE" << 'EOF2'
STORAGE_PROVIDER=s3
S3_REGION=us-west-2
AWS_REGION=us-west-2
S3_BUCKET=newsteps-images
S3_BUCKET_NAME=newsteps-images
S3_PUBLIC_URL=https://d38dol7vzd8qs4.cloudfront.net
EOF2
mv "$TMP_FILE" .env.production
printf '— Tail of .env.production —\n'
tail -n 20 .env.production | cat
printf '🔁 Restarting app with PM2...\n'
pm2 restart newsteps-production
sleep 2
printf '📋 PM2 status:\n'
pm2 status newsteps-production | cat
printf '✅ S3 activation completed.\n'
