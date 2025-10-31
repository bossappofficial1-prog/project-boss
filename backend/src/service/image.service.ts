import { HttpStatus } from '../constants/http-status';
import { AppError } from '../errors/app-error';
import { deleteFile, fileExists, getFilePath, validateFilename } from '../utils/file.utils';
import Console from '../utils/logger';
import { extractFilenameFromUrl } from '../utils/url.utils';

export class ImageService {
    static deleteImageByUrl(url: string) {
        if (!url) {
            throw new AppError('Image URL is required', HttpStatus.BAD_REQUEST);
        }

        const filename = extractFilenameFromUrl(url);
        validateFilename(filename);

        const filePath = getFilePath(filename);

        if (!fileExists(filePath)) {
            Console.warn(`File not found, skipping delete file`)
            return;
        }

        try {
            deleteFile(filePath);
            return { filename, url };
        } catch {
            throw new AppError('Failed to delete file', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
