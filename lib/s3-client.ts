import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'restaurant-spa-receipts';

/**
 * Upload a file to S3
 * @param fileBuffer The file buffer to upload
 * @param fileName The name to give the file in S3
 * @param contentType The MIME type of the file
 * @returns The URL of the uploaded file
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `receipts/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: 'public-read', // Make the file publicly accessible
  });

  await s3Client.send(command);

  // Return the S3 URL
  return `https://${bucketName}.s3.amazonaws.com/${key}`;
}

/**
 * Generate a signed URL for temporary access to a private S3 object
 * @param key The S3 object key
 * @param expirationSeconds How long the URL is valid for (default 3600 seconds = 1 hour)
 * @returns A signed URL that can be used to access the file
 */
export async function getSignedFileUrl(
  key: string,
  expirationSeconds: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, {
    expiresIn: expirationSeconds,
  });
}
