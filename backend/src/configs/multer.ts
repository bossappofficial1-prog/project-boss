import path from "node:path"
import fs from 'fs'
import multer from "multer"
import logger from "../utils/logger.util"

export const createMulterStorage = (folderName: string) => {
    const uploadPath = path.join(__dirname, `../../public/${folderName}`)

    // buat folder jika belum ada
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true })
    }

    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadPath)
        },
        filename: (req, file, cb) => {
            console.log(file);

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
            const ext = path.extname(file.originalname)
            cb(null, uniqueSuffix + ext)
        }
    })
}

export const createUploader = (folderName: string,
    allowedMimetypes: string | string[],
    fileSize: number) => {
    const storage = createMulterStorage(folderName);

    const mimetypes = Array.isArray(allowedMimetypes) ? allowedMimetypes : [allowedMimetypes]
    return multer({
        storage,
        fileFilter: (req, file, cb) => {
            if (mimetypes.includes(file.mimetype)) {
                cb(null, true)
            } else {
                cb(new
                    Error(`File type "${file.mimetype}" tidak diperbolehkan. Hanya diperbolehkan: ${mimetypes.join(', ')}`))
            }
        },
        limits: { fileSize }
    })
}

export const deleteFile = (folder: string, filename: string): Promise<boolean> => {
    const filePath = path.join(__dirname, `../../public/${folder}/${filename}`);

    return new Promise((resolve) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                logger.error(`Error hapus file: ${err.message}`);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};
