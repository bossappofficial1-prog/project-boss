import fs from 'fs';
import { Express } from 'express';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import Console from '../utils/logger';
import { config } from '../config';
import { optimizeUploadedImage } from '../utils/image-optimizer';
import { getSupabaseClient } from '../utils/supabase-client';

export type MediaType = 'IMAGE' | 'VIDEO';

export interface MediaUploadResult {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    mediaType: MediaType;
    storageKey: string;
}

const IMAGE_MAGIC_NUMBERS = {
    'image/jpeg': ['FFD8FF'],
    'image/png': ['89504E47'],
    'image/gif': ['474946'],
    'image/webp': ['52494646']
};

const VIDEO_MAGIC_NUMBERS = {
    'video/mp4': ['00000018', '00000020', '0000001C', '66747970'],
    'video/webm': ['1A45DFA3'],
    'video/quicktime': ['00000014', '00000020', '6D6F6F76']
};

const MEDIA_MAGIC_NUMBERS = { ...IMAGE_MAGIC_NUMBERS, ...VIDEO_MAGIC_NUMBERS };

const MAX_ORIGINAL_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const isVideoMime = (mime: string) => mime.startsWith('video/');

const readMagicNumber = (filePath: string): string => {
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    try {
        fs.readSync(fd, buffer, 0, 4, 0);
    } finally {
        fs.closeSync(fd);
    }
    return buffer.toString('hex').toUpperCase();
};

const deleteLocalFile = (filePath?: string) => {
    if (!filePath) {
        return;
    }

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        Console.warn('Failed to cleanup temporary media file', error);
    }
};

const buildStorageKey = (filename: string) => `media/${filename}`;

const validateMediaFile = (file: Express.Multer.File): void => {
    const isVideo = isVideoMime(file.mimetype);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_ORIGINAL_IMAGE_SIZE;

    if (file.size > maxSize) {
        deleteLocalFile(file.path);
        throw new AppError(
            `Ukuran file terlalu besar. Maksimal ${isVideo ? '50MB' : '5MB'}.`,
            HttpStatus.BAD_REQUEST
        );
    }

    const magicNumber = readMagicNumber(file.path);
    const expectedMagicNumbers = MEDIA_MAGIC_NUMBERS[file.mimetype as keyof typeof MEDIA_MAGIC_NUMBERS];

    if (!expectedMagicNumbers) {
        deleteLocalFile(file.path);
        throw new AppError('Format file tidak didukung', HttpStatus.BAD_REQUEST);
    }

    if (!isVideo) {
        const isValid = expectedMagicNumbers.some(pattern => magicNumber.startsWith(pattern));
        if (!isValid) {
            deleteLocalFile(file.path);
            throw new AppError('Header file tidak sesuai format. Potensi ancaman keamanan.', HttpStatus.BAD_REQUEST);
        }
    }
};

export class MediaUploadService {
    static async uploadSingleMedia(file: Express.Multer.File): Promise<MediaUploadResult> {
        let finalFile: Express.Multer.File | undefined;

        try {
            validateMediaFile(file);
            finalFile = await this.prepareFile(file);
            const { url, storageKey } = await this.uploadToBucket(finalFile);

            const mediaType: MediaType = isVideoMime(file.mimetype) ? 'VIDEO' : 'IMAGE';

            return {
                url,
                filename: finalFile.filename,
                originalName: file.originalname,
                size: finalFile.size,
                mimetype: finalFile.mimetype,
                mediaType,
                storageKey
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Gagal mengupload media.', HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            if (finalFile) {
                deleteLocalFile(finalFile.path);
            } else {
                deleteLocalFile(file.path);
            }
        }
    }

    static async uploadMultipleMedia(files: Express.Multer.File[]): Promise<MediaUploadResult[]> {
        const uploaded: MediaUploadResult[] = [];
        const uploadedKeys: string[] = [];

        try {
            for (const file of files) {
                const result = await this.uploadSingleMedia(file);
                uploaded.push(result);
                uploadedKeys.push(result.storageKey);
            }
            return uploaded;
        } catch (error) {
            await this.cleanupUploadedObjects(uploadedKeys);
            throw error;
        }
    }

    private static async prepareFile(file: Express.Multer.File): Promise<Express.Multer.File> {
        if (isVideoMime(file.mimetype)) {
            return file;
        }

        try {
            return await optimizeUploadedImage(file);
        } catch (error) {
            deleteLocalFile(file.path);
            throw new AppError('Gagal mengoptimalkan gambar.', HttpStatus.BAD_REQUEST);
        }
    }

    private static async uploadToBucket(file: Express.Multer.File): Promise<{ url: string; storageKey: string }> {
        const bucket = config.SUPABASE_BUCKET_PUBLIC_MEDIA;
        if (!bucket) {
            throw new AppError('Bucket Supabase untuk media belum dikonfigurasi.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const objectPath = buildStorageKey(file.filename);
        let supabaseClient;
        try {
            supabaseClient = getSupabaseClient();
        } catch {
            throw new AppError('Supabase storage belum dikonfigurasi.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        let stream: fs.ReadStream | null = null;
        try {
            stream = fs.createReadStream(file.path);
            const { error } = await supabaseClient.storage.from(bucket).upload(objectPath, stream, { upsert: false });
            if (error) {
                Console.warn('Supabase storage upload failed', error.message);
                throw new AppError('Gagal menyimpan media ke Supabase.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Gagal menyimpan media ke Supabase.', HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            if (stream) {
                stream.destroy();
            }
        }

        const { data } = supabaseClient.storage.from(bucket).getPublicUrl(objectPath);
        const publicUrl = data?.publicUrl;

        if (!publicUrl) {
            throw new AppError('Gagal membangun URL media.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return { url: publicUrl, storageKey: objectPath };
    }

    private static async cleanupUploadedObjects(keys: string[]): Promise<void> {
        if (!keys.length) {
            return;
        }

        const bucket = config.SUPABASE_BUCKET_PUBLIC_MEDIA;
        if (!bucket) {
            return;
        }

        try {
            const supabaseClient = getSupabaseClient();
            const { error } = await supabaseClient.storage.from(bucket).remove(keys);
            if (error) {
                Console.warn('Cleanup Supabase media objects failed', error.message);
            }
        } catch (error) {
            Console.warn('Cleanup Supabase media objects encountered error', error);
        }
    }
}
