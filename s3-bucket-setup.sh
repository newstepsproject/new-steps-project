#!/bin/bash

# S3 Bucket Setup Script for NewSteps
echo "=== NEWSTEPS S3 BUCKET SETUP ==="

BUCKET_NAME="newsteps-images"
REGION="us-west-2"

echo "1. Creating S3 bucket: $BUCKET_NAME in region: $REGION"
aws s3 mb s3://$BUCKET_NAME --region $REGION

echo "2. Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

echo "3. Setting up public read policy for images..."
cat > bucket-policy.json << POLICY
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
POLICY

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

echo "4. Setting up CORS for web uploads..."
cat > cors.json << CORS
{
    "CORSRules": [
        {
            "AllowedOrigins": ["https://newsteps.fit"],
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "POST", "PUT"],
            "MaxAgeSeconds": 3000
        }
    ]
}
CORS

aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://cors.json

echo "5. Testing bucket access..."
aws s3 ls s3://$BUCKET_NAME

echo "✅ S3 bucket setup complete!"
echo "Bucket URL: https://$BUCKET_NAME.s3.$REGION.amazonaws.com/"
echo "CloudFront Distribution: https://d38dol7vzd8qs4.cloudfront.net"

# Clean up temp files
rm -f bucket-policy.json cors.json

