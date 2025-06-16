import { S3Client } from '@aws-sdk/client-s3';
import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { EC2Client } from '@aws-sdk/client-ec2';
import { Route53Client } from '@aws-sdk/client-route-53';

// AWS Configuration
const region = process.env.AWS_REGION || 'us-west-2';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
};

// S3 Client
export const s3Client = new S3Client({
  region,
  credentials,
});

// CloudFront Client
export const cloudFrontClient = new CloudFrontClient({
  region,
  credentials,
});

// EC2 Client
export const ec2Client = new EC2Client({
  region,
  credentials,
});

// Route53 Client
export const route53Client = new Route53Client({
  region,
  credentials,
});

// Constants
export const AWS_CONSTANTS = {
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || 'newsteps-images',
    region,
  },
  cloudFront: {
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || 'ED0ASQ8H0CK59',
    domain: process.env.CLOUDFRONT_URL || 'https://d38dol7vzd8qs4.cloudfront.net',
  },
  ec2: {
    instanceId: process.env.EC2_INSTANCE_ID || 'i-05486d2a225e8f305',
    securityGroupId: process.env.EC2_SECURITY_GROUP_ID || 'sg-026ad4184f2af36a1',
  },
  route53: {
    hostedZoneId: process.env.ROUTE53_HOSTED_ZONE_ID || 'Z08182023JKXSRPOWZGY2',
  },
  accountId: process.env.AWS_ACCOUNT_ID || '356677661999',
}; 