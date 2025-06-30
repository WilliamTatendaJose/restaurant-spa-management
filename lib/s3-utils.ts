import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client with environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

/**
 * Uploads a file to S3 bucket
 * @param fileBuffer The file buffer to upload
 * @param fileName The name to give the file in S3
 * @param contentType The MIME type of the file
 * @returns Object containing success status and file URL or error message
 */
export async function uploadFileToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!process.env.S3_BUCKET_NAME) {
      throw new Error('S3 bucket name not configured');
    }

    // Ensure file name is URL safe
    const safeName = encodeURIComponent(fileName).replace(/%20/g, '_');

    // Create a unique file path with timestamp to prevent overwriting
    const timestamp = new Date().getTime();
    const key = `receipts/${timestamp}-${safeName}`;

    // Create and send the upload command
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read', // Make the file publicly accessible (or use private and generate signed URLs)
    });

    await s3Client.send(command);

    // Generate the URL to the uploaded file
    let fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${
      process.env.AWS_REGION || 'us-east-1'
    }.amazonaws.com/${key}`;

    // If custom domain is configured for S3, use that instead
    if (process.env.S3_CUSTOM_DOMAIN) {
      fileUrl = `https://${process.env.S3_CUSTOM_DOMAIN}/${key}`;
    }

    return {
      success: true,
      url: fileUrl,
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Generates a pre-signed URL for a file in S3
 * @param key The key/path of the file in S3
 * @param expiresIn Time in seconds until URL expires (default: 1 hour)
 * @returns Signed URL string or error
 */
export async function generateSignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string | Error> {
  try {
    if (!process.env.S3_BUCKET_NAME) {
      throw new Error('S3 bucket name not configured');
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return error as Error;
  }
}
