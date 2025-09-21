import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import path from "path";
import fs from "fs";
import { config } from "../config";

// Magic numbers for image file validation
const IMAGE_MAGIC_NUMBERS = {
    'image/jpeg': ['FFD8FF'],
    'image/png': ['89504E47'],
    'image/gif': ['474946'],
    'image/webp': ['52494646'] // RIFF for WebP
};

// Function to get file magic number (optimized: read only first 4 bytes)
const getFileMagicNumber = (filePath: string): string => {
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    return buffer.toString('hex').toUpperCase();
};

// Enhanced file validation function
const validateImageFile = (file: Express.Multer.File): void => {
    // Check file size (additional check)
    if (file.size > 1 * 1024 * 1024) {
        throw new AppError('File size too large. Maximum 1MB allowed.', HttpStatus.BAD_REQUEST);
    }

    // Get magic number from uploaded file
    const magicNumber = getFileMagicNumber(file.path);

    // Validate magic number matches MIME type
    const expectedMagicNumbers = IMAGE_MAGIC_NUMBERS[file.mimetype as keyof typeof IMAGE_MAGIC_NUMBERS];

    if (!expectedMagicNumbers) {
        // Delete the uploaded file if validation fails
        fs.unlinkSync(file.path);
        throw new AppError('Unsupported image format', HttpStatus.BAD_REQUEST);
    }

    // Check if magic number matches any expected patterns
    const isValidMagicNumber = expectedMagicNumbers.some(pattern =>
        magicNumber.startsWith(pattern)
    );

    if (!isValidMagicNumber) {
        // Delete the uploaded file if validation fails
        fs.unlinkSync(file.path);
        throw new AppError('File header does not match the declared image format. Potential security threat detected.', HttpStatus.BAD_REQUEST);
    }
};

export const uploadImageController = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
        throw new AppError('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    // Enhanced security validation
    validateImageFile(file);

    // Generate URL for the uploaded file
    const baseUrl = config.BASE_URL;
    const relativePath = path.relative(process.cwd(), file.path);
    const imageUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

    return ResponseUtil.success(res, {
        message: 'Image uploaded successfully',
        url: imageUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
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
            validateImageFile(file);

            const relativePath = path.relative(process.cwd(), file.path);
            const imageUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

            uploadedFiles.push({
                url: imageUrl,
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            });
        } catch (error) {
            // If one file fails validation, clean up all uploaded files
            files.forEach(f => {
                if (fs.existsSync(f.path)) {
                    fs.unlinkSync(f.path);
                }
            });
            throw error;
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
    const filePath = path.join(uploadsDir, filename);

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

    if (!url) {
        throw new AppError('Image URL is required', HttpStatus.BAD_REQUEST);
    }

    // Extract filename from URL
    let filename: string;
    try {
        const urlObj = new URL(url);
        filename = path.basename(urlObj.pathname);
    } catch (error) {
        throw new AppError('Invalid URL format', HttpStatus.BAD_REQUEST);
    }

    // Validate filename to prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new AppError('Invalid filename in URL', HttpStatus.BAD_REQUEST);
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        throw new AppError('File not found', HttpStatus.NOT_FOUND);
    }

    try {
        // Delete the file
        fs.unlinkSync(filePath);

        return ResponseUtil.success(res, {
            message: 'Image deleted successfully',
            filename: filename,
            url: url
        }, HttpStatus.OK);
    } catch (error) {
        throw new AppError('Failed to delete file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
