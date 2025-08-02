import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for images
const imageStorage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        // All images go to single uploads folder
        cb(null, uploadsDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// File filter for images only with enhanced security
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allowed MIME types
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    // Allowed file extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    // Get file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Check MIME type
    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new AppError('Invalid file type. Only image files are allowed!', HttpStatus.BAD_REQUEST));
    }

    // Check file extension
    if (!allowedExtensions.includes(fileExtension)) {
        return cb(new AppError('Invalid file extension. Only jpg, jpeg, png, gif, webp are allowed!', HttpStatus.BAD_REQUEST));
    }

    // Additional security: Check for suspicious filename patterns
    const filename = file.originalname.toLowerCase();
    const suspiciousPatterns = [
        '.php', '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
        '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.htaccess'
    ];

    for (const pattern of suspiciousPatterns) {
        if (filename.includes(pattern)) {
            return cb(new AppError('Suspicious file detected. Upload rejected for security reasons.', HttpStatus.BAD_REQUEST));
        }
    }

    cb(null, true);
};

// Configure multer for images
const imageUpload = multer({
    storage: imageStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only 1 file at a time
    }
});

// Set up storage for uploaded files (existing functionality for Excel)
const storage = multer.memoryStorage(); // Store file in memory

// Create the multer instance for Excel files
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// Middleware for single image upload
export const uploadSingleImage = (fieldName: string = 'image') => {
    return imageUpload.single(fieldName);
};

// Middleware for multiple images upload
export const uploadMultipleImages = (fieldName: string = 'images', maxCount: number = 5) => {
    return imageUpload.array(fieldName, maxCount);
};

// Error handler for multer errors
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File too large. Maximum size is 5MB', HttpStatus.BAD_REQUEST));
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError('Too many files. Maximum is 5 files', HttpStatus.BAD_REQUEST));
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError('Unexpected field name for file upload', HttpStatus.BAD_REQUEST));
        }
    }
    next(error);
};

export default upload;