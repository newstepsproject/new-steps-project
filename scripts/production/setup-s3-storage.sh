#!/bin/bash

# New Steps Project - S3 Storage Setup Script
# This script sets up S3 bucket and CloudFront distribution for production image storage

set -e

echo "🚀 **NEW STEPS PROJECT - S3 STORAGE SETUP**"
echo "============================================="

# Configuration
BUCKET_NAME="newsteps-images-prod"
REGION="us-west-2"
CLOUDFRONT_COMMENT="New Steps Project Images CDN"

echo "📋 Configuration:"
echo "   Bucket Name: $BUCKET_NAME"
echo "   Region: $REGION"
echo "   CloudFront: $CLOUDFRONT_COMMENT"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    echo "   Installation: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured and ready"
echo ""

# Step 1: Create S3 Bucket
echo "📦 **STEP 1: Creating S3 Bucket**"
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "   ℹ️  Bucket $BUCKET_NAME already exists"
else
    echo "   🔨 Creating bucket: $BUCKET_NAME"
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION"
    echo "   ✅ Bucket created successfully"
fi

# Step 2: Configure Bucket Policy
echo ""
echo "🔒 **STEP 2: Configuring Bucket Policy**"
cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        },
        {
            "Sid": "AllowCloudFrontAccess",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/bucket-policy.json

echo "   ✅ Bucket policy configured for public read access"

# Step 3: Enable CORS
echo ""
echo "🌐 **STEP 3: Configuring CORS**"
cat > /tmp/cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["https://newsteps.fit", "https://www.newsteps.fit"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file:///tmp/cors-config.json

echo "   ✅ CORS configured for newsteps.fit domain"

# Step 4: Create folder structure
echo ""
echo "📁 **STEP 4: Creating Folder Structure**"
folders=("shoes/" "team/" "general/" "temp/")

for folder in "${folders[@]}"; do
    echo "   📂 Creating folder: $folder"
    aws s3api put-object \
        --bucket "$BUCKET_NAME" \
        --key "$folder" \
        --content-length 0
done

echo "   ✅ Folder structure created"

# Step 5: Create CloudFront Distribution
echo ""
echo "☁️ **STEP 5: Creating CloudFront Distribution**"

# Check if distribution already exists
EXISTING_DIST=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='$CLOUDFRONT_COMMENT'].Id" --output text)

if [ -n "$EXISTING_DIST" ]; then
    echo "   ℹ️  CloudFront distribution already exists: $EXISTING_DIST"
    DISTRIBUTION_ID="$EXISTING_DIST"
else
    echo "   🔨 Creating CloudFront distribution..."
    
    cat > /tmp/cloudfront-config.json << EOF
{
    "CallerReference": "newsteps-$(date +%s)",
    "Comment": "$CLOUDFRONT_COMMENT",
    "DefaultRootObject": "",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-${BUCKET_NAME}",
                "DomainName": "${BUCKET_NAME}.s3.${REGION}.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-${BUCKET_NAME}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        }
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF

    DISTRIBUTION_RESULT=$(aws cloudfront create-distribution \
        --distribution-config file:///tmp/cloudfront-config.json \
        --output json)
    
    DISTRIBUTION_ID=$(echo "$DISTRIBUTION_RESULT" | jq -r '.Distribution.Id')
    CLOUDFRONT_DOMAIN=$(echo "$DISTRIBUTION_RESULT" | jq -r '.Distribution.DomainName')
    
    echo "   ✅ CloudFront distribution created: $DISTRIBUTION_ID"
    echo "   🌐 CloudFront domain: $CLOUDFRONT_DOMAIN"
fi

# Step 6: Generate Environment Variables
echo ""
echo "⚙️ **STEP 6: Environment Configuration**"

# Get CloudFront domain if we didn't just create it
if [ -z "$CLOUDFRONT_DOMAIN" ]; then
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
        --id "$DISTRIBUTION_ID" \
        --query 'Distribution.DomainName' \
        --output text)
fi

cat > /tmp/s3-env-vars.txt << EOF
# Add these to your .env.production file:

# S3 Configuration
AWS_S3_BUCKET_NAME=$BUCKET_NAME
AWS_S3_REGION=$REGION
AWS_S3_ACCESS_KEY_ID=your_access_key_here
AWS_S3_SECRET_ACCESS_KEY=your_secret_key_here

# CloudFront Configuration  
CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN
CLOUDFRONT_DISTRIBUTION_ID=$DISTRIBUTION_ID

# Image Storage Configuration
IMAGE_STORAGE_TYPE=s3
IMAGE_BASE_URL=https://$CLOUDFRONT_DOMAIN
EOF

echo "📄 Environment variables saved to: /tmp/s3-env-vars.txt"
echo ""
echo "📋 **NEXT STEPS:**"
echo "1. Add the environment variables to your .env.production file"
echo "2. Create IAM user with S3 permissions and add credentials"
echo "3. Update your application to use S3 storage"
echo "4. Test image upload and access"
echo ""
echo "🎯 **S3 STORAGE SETUP COMPLETE!**"

# Cleanup
rm -f /tmp/bucket-policy.json /tmp/cors-config.json /tmp/cloudfront-config.json

echo ""
echo "📊 **SUMMARY:**"
echo "   S3 Bucket: $BUCKET_NAME"
echo "   CloudFront: $DISTRIBUTION_ID"
echo "   Domain: $CLOUDFRONT_DOMAIN"
echo "   Status: ✅ Ready for production use"


