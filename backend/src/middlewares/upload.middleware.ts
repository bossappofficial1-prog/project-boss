import { NextFunction, Request, Response } from 'express';
import formidable, { File } from 'formidable';

export function parseForm(
    subFolderProvider?: (req: Request) => string
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const form = formidable({
            multiples: false,
            uploadDir: './tmp',
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024, // max 5MB
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                return res.status(400).json({ statusCode: 400, message: err.message });
            }
            // Ambil hanya field yang dibutuhkan
            req.body = fields;
            // Jika ada file image, simpan di req.file_custom
            if (files.image) {
                const file = Array.isArray(files.image)
                    ? files.image[0] as File
                    : files.image as File;
                req.file_custom = {
                    originalFilename: file.originalFilename || '',
                    filepath: file.filepath,
                    mimetype: file.mimetype || 'application/octet-stream',
                };
            }

            if (subFolderProvider) {
                req.uploadSubFolder = subFolderProvider(req);
            }

            return next();
        });
    };
}
