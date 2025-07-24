import multer from "multer";
import path from "path";

// Set up storage for uploaded files
const storage = multer.memoryStorage(); // Store file in memory

// Create the multer instance
const upload = multer({
    storage: storage,
    // fileFilter: (req, file, cb) => {
    //     // Accept excel files only
    //     const filetypes = /xlsx|xls/;
    //     const mimetype = filetypes.test(file.mimetype);
    //     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    //     if (mimetype && extname) {
    //         return cb(null, true);
    //     }
    //     cb(new Error("Hanya file Excel yang diizinkan!"));
    // },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

export default upload;