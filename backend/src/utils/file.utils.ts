import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validates a file's actual content via magic bytes / deep inspection.
 * Must be called AFTER the file is written to disk.
 * Throws AppError if the file content doesn't match the declared type.
 */
export async function validateFileMagicBytes(filePath: string, claimedMimeType: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();

    // PDF: check magic bytes %PDF-
    if (claimedMimeType === 'application/pdf' || ext === '.pdf') {
        const buffer = Buffer.alloc(5);
        const fd = fs.openSync(filePath, 'r');
        try {
            fs.readSync(fd, buffer, 0, 5, 0);
        } finally {
            fs.closeSync(fd);
        }
        if (buffer.toString('ascii') !== '%PDF-') {
            throw new Error('File bukan PDF yang valid (signature mismatch)');
        }
        return;
    }

    // Images: use sharp to deeply parse the file content
    if (ALLOWED_IMAGE_MIMES.includes(claimedMimeType) || ALLOWED_IMAGE_EXTS.includes(ext)) {
        try {
            const meta = await sharp(filePath).metadata();
            const validFormats = ['jpeg', 'png', 'webp'];
            if (!meta.format || !validFormats.includes(meta.format)) {
                throw new Error('Format gambar tidak valid');
            }
        } catch {
            throw new Error('File bukan gambar yang valid (content mismatch)');
        }
        return;
    }

    throw new Error('Tipe file tidak didukung untuk validasi');
}

export function validateFilename(filename: string): void {
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename in URL');
    }
}

export function getFilePath(filename: string): string {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    return path.join(uploadsDir, filename);
}

export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

export function deleteFile(filePath: string): void {
    fs.unlinkSync(filePath);
}
