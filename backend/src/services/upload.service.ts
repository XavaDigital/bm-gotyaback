import { uploadToS3 } from "../utils/s3Upload";
import sharp from "sharp";

/**
 * Validate logo file type
 */
const validateLogoFileType = (mimeType: string): boolean => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
  return allowedTypes.includes(mimeType);
};

/**
 * Validate logo file size (max 2MB)
 */
const validateLogoFileSize = (fileSize: number): boolean => {
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  return fileSize <= maxSize;
};

/**
 * Validate logo dimensions (min 200x200px)
 * Returns { valid: boolean, width: number, height: number }
 */
const validateLogoDimensions = async (
  fileBuffer: Buffer
): Promise<{ valid: boolean; width: number; height: number }> => {
  try {
    const metadata = await sharp(fileBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    const minDimension = 200;
    const valid = width >= minDimension && height >= minDimension;

    return { valid, width, height };
  } catch (error) {
    throw new Error("Failed to read image dimensions");
  }
};

/**
 * Upload logo to S3 with validation
 * @param fileBuffer - The file buffer
 * @param originalName - Original filename
 * @param mimeType - File MIME type
 * @param sponsorshipId - Sponsorship ID for unique folder structure
 * @returns The public URL of the uploaded logo
 */
export const uploadLogoToS3 = async (
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  sponsorshipId: string
): Promise<string> => {
  // Validate file type
  if (!validateLogoFileType(mimeType)) {
    throw new Error(
      "Invalid file type. Only PNG, JPG, and SVG files are allowed."
    );
  }

  // Validate file size
  if (!validateLogoFileSize(fileBuffer.length)) {
    throw new Error("File size exceeds 2MB limit.");
  }

  // Validate dimensions (skip for SVG files)
  if (mimeType !== "image/svg+xml") {
    const { valid, width, height } = await validateLogoDimensions(fileBuffer);
    if (!valid) {
      throw new Error(
        `Image dimensions (${width}x${height}px) are too small. Minimum required: 200x200px.`
      );
    }
  }

  // Upload to S3 in sponsors/logos/ folder
  const folder = `sponsors/logos/${sponsorshipId}/`;
  const url = await uploadToS3(fileBuffer, originalName, mimeType, folder);

  return url;
};

/**
 * Validate logo file before upload (without uploading)
 * Useful for client-side validation feedback
 */
export const validateLogoFile = async (
  fileBuffer: Buffer,
  mimeType: string
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!validateLogoFileType(mimeType)) {
    errors.push("Invalid file type. Only PNG, JPG, and SVG files are allowed.");
  }

  // Check file size
  if (!validateLogoFileSize(fileBuffer.length)) {
    errors.push("File size exceeds 2MB limit.");
  }

  // Check dimensions (skip for SVG)
  if (mimeType !== "image/svg+xml") {
    try {
      const { valid, width, height } = await validateLogoDimensions(fileBuffer);
      if (!valid) {
        errors.push(
          `Image dimensions (${width}x${height}px) are too small. Minimum required: 200x200px.`
        );
      }

      // Warn if not square
      if (width !== height) {
        warnings.push(
          `Image is not square (${width}x${height}px). Square images (1:1 aspect ratio) are recommended for best display.`
        );
      }
    } catch (error) {
      errors.push("Failed to read image dimensions.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

