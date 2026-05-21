import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
    },
});

/**
 * Upload a file to S3
 * @param fileBuffer - The file buffer
 * @param originalName - Original filename
 * @param mimeType - File MIME type
 * @param folder - S3 folder path (e.g., 'organizers/')
 * @returns The public URL of the uploaded file
 */
export async function uploadToS3(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'organizers/'
): Promise<string> {
    const bucket = process.env.AWS_S3_BUCKET as string;
    const serverUrl = process.env.AWS_S3_SERVER_URL as string;

    // Derive extension from MIME type to avoid path traversal via user-supplied filename
    const mimeToExt: Record<string, string> = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/svg+xml': '.svg',
    };
    const timestamp = Date.now();
    const ext = mimeToExt[mimeType] ?? '.bin';
    const fileName = `upload-${timestamp}${ext}`;
    const key = `${folder}${fileName}`;

    const params = {
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        // Return the public URL
        const url = `${serverUrl}${key}`;
        return url;
    } catch (error: any) {
        console.error('S3 upload error:', error);
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
}

