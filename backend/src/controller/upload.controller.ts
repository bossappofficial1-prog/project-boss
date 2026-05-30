import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import path from "path";
import fs from "fs";
import { config } from "../config";
import { ImageService } from "../service/image.service";
import { optimizeUploadedImage } from "../utils/image-optimizer";
import { ModerationService } from "../service/moderation.service";
import sharp from "sharp";

// Magic numbers for image file validation
const IMAGE_MAGIC_NUMBERS = {
    'image/jpeg': ['FFD8FF'],
    'image/png': ['89504E47'],
    'image/gif': ['474946'],
    'image/webp': ['52494646'] // RIFF for WebP
};

// Magic numbers for video file validation
const VIDEO_MAGIC_NUMBERS = {
    'video/mp4': ['00000018', '00000020', '0000001C', '66747970'],
    'video/webm': ['1A45DFA3'],
    'video/quicktime': ['00000014', '00000020', '6D6F6F76']
};

const MEDIA_MAGIC_NUMBERS = { ...IMAGE_MAGIC_NUMBERS, ...VIDEO_MAGIC_NUMBERS };

const MAX_ORIGINAL_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB before optimization

// Function to get file magic number (optimized: read only first 4 bytes)
const getFileMagicNumber = (filePath: string): string => {
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    return buffer.toString('hex').toUpperCase();
};

// Enhanced file validation function
const validateImageFile = async (file: Express.Multer.File): Promise<void> => {
    // Check file size (additional check)
    if (file.size > MAX_ORIGINAL_IMAGE_SIZE) {
        throw new AppError('Ukuran file mentah terlalu besar. Maksimal 5MB sebelum kompresi.', HttpStatus.BAD_REQUEST);
    }

    // Get magic number from uploaded file
    const magicNumber = getFileMagicNumber(file.path);

    // Validate magic number matches MIME type
    const expectedMagicNumbers = IMAGE_MAGIC_NUMBERS[file.mimetype as keyof typeof IMAGE_MAGIC_NUMBERS];

    if (!expectedMagicNumbers) {
        // Delete the uploaded file if validation fails
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new AppError('Unsupported image format', HttpStatus.BAD_REQUEST);
    }

    // Check if magic number matches any expected patterns
    const isValidMagicNumber = expectedMagicNumbers.some(pattern =>
        magicNumber.startsWith(pattern)
    );

    if (!isValidMagicNumber) {
        // Soft fallback: Check if sharp can successfully read the image metadata.
        // If sharp can parse it, it's a valid image, not an exploit payload!
        try {
            await sharp(file.path).metadata();
            // If it succeeds, we pass!
        } catch (error) {
            // Delete the uploaded file if validation fails
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            throw new AppError('File header does not match the declared image format. Potential security threat detected.', HttpStatus.BAD_REQUEST);
        }
    }
};

export const uploadImageController = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
        throw new AppError('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    // Enhanced security validation
    await validateImageFile(file);

    // Run Content Moderation (OCR & Vulgarity Checks)
    await ModerationService.validateUploadedImage(file);

    let optimizedFile: Express.Multer.File;

    try {
        optimizedFile = await optimizeUploadedImage(file);
    } catch (error) {
        throw new AppError(
            'Gagal mengoptimalkan gambar. Pastikan file tidak melebihi 5MB dan berformat gambar yang valid.',
            HttpStatus.BAD_REQUEST
        );
    }

    // Generate URL for the uploaded file
    const baseUrl = config.BASE_URL;
    const relativePath = path.relative(process.cwd(), optimizedFile.path);
    const imageUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

    return ResponseUtil.success(res, {
        message: 'Image uploaded successfully',
        url: imageUrl,
        filename: optimizedFile.filename,
        originalName: optimizedFile.originalname,
        size: optimizedFile.size,
        mimetype: optimizedFile.mimetype
    }, HttpStatus.CREATED);
});

export const uploadMultipleImagesController = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        throw new AppError('No files uploaded', HttpStatus.BAD_REQUEST);
    }

    const baseUrl = config.BASE_URL;
    const uploadedFiles: any[] = [];

    // Validate each file
    for (const file of files) {
        try {
            await validateImageFile(file);
            await ModerationService.validateUploadedImage(file);

            const optimizedFile = await optimizeUploadedImage(file);

            const relativePath = path.relative(process.cwd(), optimizedFile.path);
            const imageUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

            uploadedFiles.push({
                url: imageUrl,
                filename: optimizedFile.filename,
                originalName: optimizedFile.originalname,
                size: optimizedFile.size,
                mimetype: optimizedFile.mimetype
            });
        } catch (error) {
            // If one file fails validation, clean up all uploaded files
            files.forEach(f => {
                if (fs.existsSync(f.path)) {
                    fs.unlinkSync(f.path);
                }
            });

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                'Gagal mengoptimalkan salah satu gambar. Pastikan file tidak melebihi 5MB dan berformat gambar yang valid.',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    return ResponseUtil.success(res, {
        message: `${files.length} images uploaded successfully`,
        files: uploadedFiles
    }, HttpStatus.CREATED);
});

export const deleteImageController = asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;

    if (!filename) {
        throw new AppError('Filename is required', HttpStatus.BAD_REQUEST);
    }

    // Validate filename to prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new AppError('Invalid filename', HttpStatus.BAD_REQUEST);
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename as string);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        throw new AppError('File not found', HttpStatus.NOT_FOUND);
    }

    try {
        // Delete the file
        fs.unlinkSync(filePath);

        return ResponseUtil.success(res, {
            message: 'Image deleted successfully',
            filename: filename
        }, HttpStatus.OK);
    } catch (error) {
        throw new AppError('Failed to delete file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});

export const deleteImageByUrlController = asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body;
    const result = ImageService.deleteImageByUrl(url);

    return ResponseUtil.success(
        res,
        {
            message: 'Image deleted successfully',
            ...result,
        },
        HttpStatus.OK
    );
});

// --- Media Upload (Image + Video) ---

const isVideoMime = (mime: string) => mime.startsWith('video/');

const validateMediaFile = async (file: Express.Multer.File): Promise<void> => {
    const isVideo = isVideoMime(file.mimetype);
    const maxSize = isVideo ? 50 * 1024 * 1024 : MAX_ORIGINAL_IMAGE_SIZE;

    if (file.size > maxSize) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new AppError(
            `Ukuran file terlalu besar. Maksimal ${isVideo ? '50MB' : '5MB'}.`,
            HttpStatus.BAD_REQUEST
        );
    }

    const magicNumber = getFileMagicNumber(file.path);
    const expectedMagicNumbers = MEDIA_MAGIC_NUMBERS[file.mimetype as keyof typeof MEDIA_MAGIC_NUMBERS];

    if (!expectedMagicNumbers) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new AppError('Format file tidak didukung', HttpStatus.BAD_REQUEST);
    }

    // For video, skip strict magic number check for MP4/MOV (variable headers)
    if (!isVideo) {
        const isValid = expectedMagicNumbers.some(pattern => magicNumber.startsWith(pattern));
        if (!isValid) {
            // Soft fallback: Check if sharp can successfully read the image metadata.
            try {
                await sharp(file.path).metadata();
            } catch (error) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                throw new AppError('Header file tidak sesuai format. Potensi ancaman keamanan.', HttpStatus.BAD_REQUEST);
            }
        }
    }
};

export const uploadMediaController = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        throw new AppError('Tidak ada file yang diupload', HttpStatus.BAD_REQUEST);
    }

    await validateMediaFile(file);

    const isVideo = isVideoMime(file.mimetype);
    
    // Only moderate images, skip videos
    if (!isVideo) {
        await ModerationService.validateUploadedImage(file);
    }

    let finalFile = file;

    // Only optimize images, not videos
    if (!isVideo) {
        try {
            finalFile = await optimizeUploadedImage(file);
        } catch {
            throw new AppError('Gagal mengoptimalkan gambar.', HttpStatus.BAD_REQUEST);
        }
    }

    const baseUrl = config.BASE_URL;
    const relativePath = path.relative(process.cwd(), finalFile.path);
    const url = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

    return ResponseUtil.success(res, {
        message: 'Media uploaded successfully',
        url,
        filename: finalFile.filename,
        originalName: finalFile.originalname,
        size: finalFile.size,
        mimetype: finalFile.mimetype,
        mediaType: isVideo ? 'VIDEO' : 'IMAGE',
    }, HttpStatus.CREATED);
});

export const uploadMultipleMediaController = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
        throw new AppError('Tidak ada file yang diupload', HttpStatus.BAD_REQUEST);
    }

    if (files.length > 5) {
        files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        throw new AppError('Maksimal 5 file per upload', HttpStatus.BAD_REQUEST);
    }

    const baseUrl = config.BASE_URL;
    const uploadedFiles: any[] = [];

    for (const file of files) {
        try {
            await validateMediaFile(file);

            const isVideo = isVideoMime(file.mimetype);
            if (!isVideo) {
                await ModerationService.validateUploadedImage(file);
            }

            let finalFile = file;

            if (!isVideo) {
                finalFile = await optimizeUploadedImage(file);
            }

            const relativePath = path.relative(process.cwd(), finalFile.path);
            const url = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

            uploadedFiles.push({
                url,
                filename: finalFile.filename,
                originalName: finalFile.originalname,
                size: finalFile.size,
                mimetype: finalFile.mimetype,
                mediaType: isVideo ? 'VIDEO' : 'IMAGE',
            });
        } catch (error) {
            // Cleanup all files on failure
            files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
            if (error instanceof AppError) throw error;
            throw new AppError('Gagal memproses salah satu file media.', HttpStatus.BAD_REQUEST);
        }
    }

    return ResponseUtil.success(res, {
        message: `${uploadedFiles.length} media uploaded successfully`,
        files: uploadedFiles,
    }, HttpStatus.CREATED);
});
