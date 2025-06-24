import { Router } from "express";
import {
    getInfoUserLoginController,
    googleLoginController,
    loginController,
    registerController,
    resendOtpController,
    updateAvatarController,
    updateProfileController,
    verifyOtpController
} from "../controllers/auth.controller";
import { loginValidator, registerValidator, updateProfileValidator } from "../validators/auth.validator";
import { handleValidationErrors } from "../middlewares/handle_validation_errors";
import { jwtCheckToken } from "../middlewares/jwt_check_token";
import { avatarUploader } from "../middlewares/avatar_upload";

const authRouter = Router()

authRouter.post('/register', registerValidator, handleValidationErrors, registerController)
authRouter.post('/login', loginValidator, handleValidationErrors, loginController)
authRouter.post('/login-google', googleLoginController)
authRouter.post('/resend-otp', resendOtpController)
authRouter.post('/verify-otp', verifyOtpController)
authRouter.get('/me', jwtCheckToken, getInfoUserLoginController)
authRouter.post('/avatar', jwtCheckToken, avatarUploader.single('avatar'), handleValidationErrors, updateAvatarController)
authRouter.patch('/me', jwtCheckToken, updateProfileValidator, handleValidationErrors, updateProfileController)

export default authRouter