import { Router } from "express"
import authRouter from "./auth.routes"
import businessRouter from "./business.routes"
import outletRouter from "./outlet.routes"
import { MidtransNotifikasiController } from "../controllers/midtrans.controller"
import cloudinary_upload from "../middlewares/cloudinary_uploads"

const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/businesses', businessRouter)
apiRouter.use('/outlets', outletRouter)
apiRouter.post("/midtrans-notification", MidtransNotifikasiController)
apiRouter.post('/upload', cloudinary_upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // The file has been uploaded to Cloudinary by the middleware.
        // req.file.path contains the Cloudinary URL.
        // req.file.filename contains the public_id.
        return res.status(200).json({
            message: 'File uploaded successfully!',
            url: req.file.path,
            public_id: req.file.filename,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});
export default apiRouter