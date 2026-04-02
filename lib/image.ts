import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { generateId } from './db';

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Image dimensions
const DIMENSIONS = {
  original: { width: 1920, height: 1080 }, // 16:9
  square: { width: 400, height: 400 },      // 1:1
  mobile: { width: 400, height: 711 },      // 9:16
};

export interface ImagePaths {
  original: string;
  square: string;
  mobile: string;
}

/**
 * Process an uploaded image and create all required crops
 * @param buffer - The image buffer from the upload
 * @param originalName - Original filename for extension detection
 * @returns Object with paths to all generated images
 */
export async function processImage(buffer: Buffer, originalName: string): Promise<ImagePaths> {
  ensureUploadDir();

  const id = generateId();
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const baseName = `${id}`;

  const originalPath = `/uploads/${baseName}-original${ext}`;
  const squarePath = `/uploads/${baseName}-square${ext}`;
  const mobilePath = `/uploads/${baseName}-mobile${ext}`;

  // Process original (resize to max dimensions, maintain aspect ratio)
  await sharp(buffer)
    .resize(DIMENSIONS.original.width, DIMENSIONS.original.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toFile(path.join(UPLOAD_DIR, `${baseName}-original${ext}`));

  // Process square crop (center crop)
  await sharp(buffer)
    .resize(DIMENSIONS.square.width, DIMENSIONS.square.height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toFile(path.join(UPLOAD_DIR, `${baseName}-square${ext}`));

  // Process mobile crop (9:16 vertical)
  await sharp(buffer)
    .resize(DIMENSIONS.mobile.width, DIMENSIONS.mobile.height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toFile(path.join(UPLOAD_DIR, `${baseName}-mobile${ext}`));

  return {
    original: originalPath,
    square: squarePath,
    mobile: mobilePath,
  };
}

/**
 * Delete all versions of an image
 * @param imagePaths - Object with paths to all image versions
 */
export function deleteImages(imagePaths: Partial<ImagePaths>) {
  const paths = [imagePaths.original, imagePaths.square, imagePaths.mobile].filter(Boolean);
  
  for (const imagePath of paths) {
    if (imagePath) {
      const fullPath = path.join(process.cwd(), 'public', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  }
}
