import fs from "fs";
import path from "path";
import sharp, { ResizeOptions } from "sharp";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const DEFAULT_WEBP_QUALITY = 80;
const MIN_WEBP_QUALITY = 50;
const QUALITY_STEP = 10;
const MAX_OUTPUT_SIZE = 1 * 1024 * 1024;
const COMPRESSION_THRESHOLD = 300 * 1024; // 300KB

type MutableMulterFile = Express.Multer.File & {
    path: string;
    filename: string;
    mimetype: string;
    size: number;
};

export const optimizeUploadedImage = async (file: Express.Multer.File): Promise<MutableMulterFile> => {
    const mutableFile = file as MutableMulterFile;
    const originalPath = mutableFile.path;

    if (mutableFile.size <= COMPRESSION_THRESHOLD) {
        return mutableFile;
    }

    const parsedPath = path.parse(originalPath);
    const outputFilename = `${parsedPath.name}.webp`;
    const outputPath = path.join(parsedPath.dir, outputFilename);

    const metadata = await sharp(originalPath).metadata();

    const resizeOptions: ResizeOptions = {
        withoutEnlargement: true,
    };

    if (metadata.width && metadata.width > MAX_WIDTH) {
        resizeOptions.width = MAX_WIDTH;
    }

    if (metadata.height && metadata.height > MAX_HEIGHT) {
        resizeOptions.height = MAX_HEIGHT;
    }

    const buildPipeline = () => {
        let pipeline = sharp(originalPath).rotate();

        if (resizeOptions.width || resizeOptions.height) {
            pipeline = pipeline.resize(resizeOptions);
        }

        return pipeline;
    };

    let quality = DEFAULT_WEBP_QUALITY;
    let optimizedBuffer = await buildPipeline().webp({ quality }).toBuffer();

    while (optimizedBuffer.length > MAX_OUTPUT_SIZE && quality > MIN_WEBP_QUALITY) {
        quality = Math.max(MIN_WEBP_QUALITY, quality - QUALITY_STEP);
        optimizedBuffer = await buildPipeline().webp({ quality }).toBuffer();
        if (quality === MIN_WEBP_QUALITY) {
            break;
        }
    }

    fs.writeFileSync(outputPath, optimizedBuffer);

    const stats = fs.statSync(outputPath);

    if (stats.size > MAX_OUTPUT_SIZE) {
        fs.unlinkSync(outputPath);
        fs.unlinkSync(originalPath);
        throw new Error('OPTIMIZED_IMAGE_TOO_LARGE');
    }

    fs.unlinkSync(originalPath);

    mutableFile.path = outputPath;
    mutableFile.filename = outputFilename;
    mutableFile.mimetype = "image/webp";
    mutableFile.size = stats.size;

    return mutableFile;
};
