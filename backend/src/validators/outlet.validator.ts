import { body } from "express-validator";

export const createOutletValidator = [
    body("name")
        .notEmpty().withMessage("Nama outlet tidak boleh kosong")
        .trim(),

    body("address")
        .notEmpty().withMessage("Alamat outlet tidak boleh kosong")
        .trim(),

    body("phone")
        .notEmpty().withMessage("Nomor hp tidak boleh kosong").bail()
        .isMobilePhone("id-ID").withMessage("Nomor hp tidak valid")
        .trim(),

    // validasi file avatar
    body("image").custom((_, { req }) => {
        const file = req.file;

        if (!file) {
            throw new Error("Harus sertakan gambar");
        }

        const allowedMimetypes = ["image/jpeg", "image/png", "image/webp"];
        const maxSize = 1 * 1024 * 1024; // 1MB

        if (!allowedMimetypes.includes(file.mimetype)) {
            throw new Error("Format gambar tidak diperbolehkan (hanya JPG, PNG, WEBP)");
        }

        if (file.size > maxSize) {
            throw new Error("Ukuran gambar tidak boleh lebih dari 1MB");
        }

        return true;
    })
];
