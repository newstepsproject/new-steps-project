# AWS S3 Setup Guide for NewSteps

## Step 1: Create IAM User for S3 Access

### 1. Go to AWS Console → IAM → Users → Create User
- **User name**: `newsteps-s3-user`
- **Access type**: Programmatic access only

### 2. Create S3 Policy
Go to IAM → Policies → Create Policy → JSON, paste this:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::newsteps-images/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::newsteps-images"
        }
    ]
}
```

### 3. Attach Policy to User
- **Policy name**: `NewStepsS3Access`
- Attach this policy to `newsteps-s3-user`

### 4. Create Access Keys
- Select the user → Security credentials → Create access key
- **Use case**: Application running on AWS compute service
- Copy the **Access Key ID** and **Secret Access Key**

## Step 2: Create S3 Bucket

### Option A: AWS Console
- Go to S3 → Create Bucket
- **Name**: `newsteps-images` 
- **Region**: us-west-2
- **Block public access**: Uncheck (for public read access to images)
- **Versioning**: Enable
- **Default encryption**: Enable

### Option B: AWS CLI (I'll do this automatically)

