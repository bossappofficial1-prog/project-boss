import { Router } from "express";
import {
    uploadImageController,
    uploadMultipleImagesController,
    deleteImageController,
    deleteImageByUrlController,
    uploadMediaController,
    uploadMultipleMediaController
} from "../controller/upload.controller";
import { uploadSingleImage, uploadMultipleImages, uploadSingleMedia, uploadMultipleMedia, handleUploadError } from "../middleware/upload.middleware";

const uploadRouter = Router();

// Single image upload
uploadRouter.post("/image", uploadSingleImage('image'), handleUploadError, uploadImageController);

// Multiple images upload
uploadRouter.post("/images", uploadMultipleImages('images', 5), handleUploadError, uploadMultipleImagesController);

// Delete image by filename
uploadRouter.delete("/image/:filename", deleteImageController);

// Delete image by URL
uploadRouter.delete("/image", deleteImageByUrlController);

// Specific routes for different entities
uploadRouter.post("/product/image", uploadSingleImage('image'), handleUploadError, uploadImageController);
uploadRouter.post("/outlet/image", uploadSingleImage('image'), handleUploadError, uploadImageController);
uploadRouter.post("/user/avatar", uploadSingleImage('avatar'), handleUploadError, uploadImageController);

// Media upload (images + video) for product gallery
uploadRouter.post("/product/media", uploadSingleMedia('media'), handleUploadError, uploadMediaController);
uploadRouter.post("/product/medias", uploadMultipleMedia('media', 5), handleUploadError, uploadMultipleMediaController);

export default uploadRouter;
