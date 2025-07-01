import multer from "multer";
import { storage } from "../configs/cloudinary";

const cloudinary_upload = multer({ storage: storage })

export default cloudinary_upload