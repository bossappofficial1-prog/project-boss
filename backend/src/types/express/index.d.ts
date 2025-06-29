// src/types/express/index.d.ts
import { File as FormidableFile } from "formidable";

declare global {
    namespace Express {
        interface Request {
            /**
             * Hasil parsing formidable, hanya berisi
             * properti yang kita pakai (originalFilename, filepath, mimetype).
             */
            file_custom?: {
                originalFilename: string;
                filepath: string;
                mimetype: string;
            };
            /**
             * (opsional) subfolder untuk penyimpanan dinamis
             */
            uploadSubFolder?: string;
        }
    }
}

// Ini agar file ini dianggap modul
export { };
