import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, AWS_CONSTANTS } from './aws';

// Bucket name and CloudFront URL from AWS constants
const { bucketName, region } = AWS_CONSTANTS.s3;
const cloudFrontUrl = AWS_CONSTANTS.cloudFront.domain;

/**
 * Uploads an image to S3 and returns the URL
 * @param file The file buffer to upload
 * @param contentType The MIME type of the file
 * @param folder Optional folder path within the bucket
 * @returns Object containing the S3 URL and CloudFront URL
 */
export async function uploadImageToS3(
  file: Buffer,
  contentType: string,
  folder = 'shoes'
): Promise<{ s3Url: string; cloudFrontUrl: string }> {
  // Generate a unique file name
  const fileName = `${folder}/${uuidv4()}.${contentType.split('/')[1]}`;
  
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: file,
    ContentType: contentType,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    const cdnUrl = `${cloudFrontUrl}/${fileName}`;
    
    return {
      s3Url,
      cloudFrontUrl: cdnUrl,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
} 