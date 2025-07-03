import { checkIfEmailExists } from "../services/user.service";
import { body } from "express-validator";

export const registerValidator = [
    body('email').notEmpty().withMessage('Email is required').bail()
        .isEmail().withMessage('Enter a valid email').bail()
        .custom(async (email) => {
            const check = await checkIfEmailExists(email)
            if (check) throw new Error('Email already exists');
            return true
        })
        .normalizeEmail(),
    body('name').notEmpty().withMessage('Name is required'),
    body('password').notEmpty().withMessage('Password is required')
]

export const loginValidator = [
    body('email').notEmpty().withMessage("Email is required").bail()
        .isEmail().withMessage("Email not valid"),
    body("password").notEmpty().withMessage("Password is required")
]

export const updateProfileValidator = [
    body('name').optional().bail()
        .notEmpty().withMessage("Name is required"),
    body("password").optional().bail()
        .notEmpty().withMessage("Password is required")
]

// Middleware untuk validasi input pendaftaran bisnis
export const validateBusinessRegister = [
    body('name')
        .notEmpty().withMessage('Nama wajib diisi').bail()
        .isString().withMessage('Nama pengguna harus berupa string')
        .trim(),

    body('email')
        .notEmpty().withMessage('Email tidak boleh kosong').bail()
        .isEmail().withMessage('Email tidak valid').bail()
        .custom(async (email) => {
            const check = await checkIfEmailExists(email)
            if (check) throw new Error('Email already exists');
            return true
        })
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password tidak boleh kosong')
        .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
        .isString().withMessage('Password harus berupa string'),
    body('avatar')
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error('Avatar wajib diunggah');
            }
            // Opsional: Periksa ukuran file (dalam bytes)
            const maxFileSize = 2 * 1024 * 1024; // 5 MB
            if (req.file.size > maxFileSize) {
                throw new Error('Ukuran avatar maksimal 2 MB');
            }
            return true;
        })
        .withMessage('Format atau ukuran avatar tidak valid'),
    // Validasi bisnis
    body('business')
        .exists().withMessage('Data bisnis wajib diisi') // Periksa keberadaan
        .isObject().withMessage('Data bisnis harus berupa objek'), // Periksa tipe data
    body('business.name')
        .notEmpty().withMessage('Nama bisnis tidak boleh kosong')
        .isString().withMessage('Nama bisnis harus berupa string'),
    body('business.description')
        .optional()
        .isString().withMessage('Deskripsi bisnis harus berupa string'),

    // Validasi outlets array
    // Pastikan 'outlets' itu ada, berupa array, dan tidak kosong
    body('outlets')
        .exists().withMessage('Daftar outlet wajib diisi') // Periksa keberadaan
        .isArray({ min: 1 }).withMessage('Setidaknya satu outlet harus dikirim'),

    // Gunakan withMessage() setelah setiap validator untuk pesan yang spesifik
    body('outlets.*.name')
        .notEmpty().withMessage('Nama outlet wajib diisi'),
    body('outlets.*.address')
        .notEmpty().withMessage('Alamat outlet wajib diisi'),
    body('outlets.*.phone')
        .notEmpty().withMessage('Nomor telepon outlet wajib diisi')
        .isMobilePhone('id-ID').withMessage('Nomor telepon tidak valid'),
];
