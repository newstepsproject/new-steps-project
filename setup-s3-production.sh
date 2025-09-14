#!/bin/bash

# S3 Production Setup for New Steps Project
# This script creates S3 bucket, configures policies, and sets up CloudFront

set -e  # Exit on any error

echo "🗄️  **S3 PRODUCTION SETUP FOR NEW STEPS PROJECT**"
echo "=================================================="
echo ""

# Configuration
BUCKET_NAME="newsteps-production-images"
REGION="us-west-2"
CLOUDFRONT_COMMENT="New Steps Project Images CDN"

echo "📋 **Configuration:**"
echo "   Bucket Name: $BUCKET_NAME"
echo "   Region: $REGION"
echo "   CloudFront: $CLOUDFRONT_COMMENT"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   brew install awscli"
    echo "   aws configure"
    exit 1
fi

echo "🔧 **Step 1: Creating S3 Bucket**"
# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION
echo "   ✅ Bucket created: $BUCKET_NAME"

echo ""
echo "🔧 **Step 2: Configure Bucket for Public Read**"
# Create bucket policy for public read access
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
echo "   ✅ Public read policy applied"

# Enable public access
aws s3api delete-public-access-block --bucket $BUCKET_NAME
echo "   ✅ Public access enabled"

echo ""
echo "🔧 **Step 3: Create CloudFront Distribution**"
# Create CloudFront distribution config
cat > cloudfront-config.json << EOF
{
    "CallerReference": "newsteps-$(date +%s)",
    "Comment": "$CLOUDFRONT_COMMENT",
    "DefaultCacheBehavior": {
        "TargetOriginId": "$BUCKET_NAME-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "$BUCKET_NAME-origin",
                "DomainName": "$BUCKET_NAME.s3.$REGION.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF

# Create CloudFront distribution
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json)
DISTRIBUTION_ID=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.Id')
DISTRIBUTION_DOMAIN=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.DomainName')

echo "   ✅ CloudFront distribution created"
echo "   📋 Distribution ID: $DISTRIBUTION_ID"
echo "   🌐 Domain: $DISTRIBUTION_DOMAIN"

echo ""
echo "🔧 **Step 4: Create Folder Structure**"
# Create folder structure in S3
aws s3api put-object --bucket $BUCKET_NAME --key shoes/
aws s3api put-object --bucket $BUCKET_NAME --key team/
aws s3api put-object --bucket $BUCKET_NAME --key general/
echo "   ✅ Folder structure created (shoes/, team/, general/)"

echo ""
echo "🔧 **Step 5: Environment Configuration**"
cat > s3-environment-config.txt << EOF
# Add these to your .env.production file:

# S3 Configuration
AWS_S3_BUCKET_NAME=$BUCKET_NAME
AWS_S3_REGION=$REGION
AWS_S3_BUCKET_URL=https://$BUCKET_NAME.s3.$REGION.amazonaws.com
CLOUDFRONT_DISTRIBUTION_ID=$DISTRIBUTION_ID
CLOUDFRONT_DOMAIN_NAME=$DISTRIBUTION_DOMAIN
CLOUDFRONT_URL=https://$DISTRIBUTION_DOMAIN

# Image Storage Mode
IMAGE_STORAGE_MODE=s3
# Options: 'local' (current) or 's3' (new)

# AWS Credentials (if not using IAM roles)
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
EOF

echo "   ✅ Environment configuration created: s3-environment-config.txt"

echo ""
echo "🔧 **Step 6: Test Upload**"
# Create test image
echo "Test image for New Steps Project S3 setup" > test-image.txt
aws s3 cp test-image.txt s3://$BUCKET_NAME/test-image.txt
echo "   ✅ Test file uploaded"

# Test public access
TEST_URL="https://$BUCKET_NAME.s3.$REGION.amazonaws.com/test-image.txt"
echo "   🧪 Testing public access: $TEST_URL"
if curl -s --head "$TEST_URL" | grep "200 OK" > /dev/null; then
    echo "   ✅ Public access working"
else
    echo "   ⚠️  Public access may take a few minutes to propagate"
fi

echo ""
echo "🧹 **Cleanup**"
rm -f bucket-policy.json cloudfront-config.json test-image.txt
echo "   ✅ Temporary files cleaned up"

echo ""
echo "🎉 **S3 SETUP COMPLETE!**"
echo "========================"
echo "✅ S3 Bucket: $BUCKET_NAME"
echo "✅ CloudFront: $DISTRIBUTION_DOMAIN"
echo "✅ Public Access: Enabled"
echo "✅ Folder Structure: Created"
echo ""
echo "📋 **Next Steps:**"
echo "1. Add environment variables from s3-environment-config.txt to production"
echo "2. Deploy application with S3 storage enabled"
echo "3. Run image migration script to move existing images"
echo "4. Test image uploads through the application"
echo ""
echo "⚠️  **Important Notes:**"
echo "- CloudFront distribution takes 15-20 minutes to fully deploy"
echo "- Keep AWS credentials secure"
echo "- Monitor S3 costs in AWS console"
echo "- Test thoroughly before switching from local storage"


