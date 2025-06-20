import { checkIfEmailExists } from "../services/user.service";
import { body } from "express-validator";

export const registerValidator = [
    body('email').notEmpty().withMessage('Email is required').bail()
        .isEmail().withMessage('Enter a valid email').bail()
        .custom(async (email) => {
            const check = await checkIfEmailExists(email)
            if (check) throw new Error('Email already exists');
            return true
        }),
    body('name').notEmpty().withMessage('Name is required'),
    body('password').notEmpty().withMessage('Password is required')
]

export const loginValidator = [
    body('email').notEmpty().withMessage("Email is required").bail()
        .isEmail().withMessage("Email not valid"),
    body("password").notEmpty().withMessage("Password is required")
]