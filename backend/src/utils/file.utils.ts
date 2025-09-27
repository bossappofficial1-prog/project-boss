import fs from 'fs';
import path from 'path';

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
