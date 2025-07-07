import { Router } from "express";
import {
    businessRegisterController,
    getInfoUserLoginController,
    loginController,
    registerController,
    resendOtpController,
    updateAvatarController,
    updateProfileController,
    verifyOtpController
} from "../controllers/auth.controller";
import { loginValidator, registerValidator, testSchema, updateProfileValidator, validateBusinessRegister } from "../validators/auth.validator";
import { handleValidationErrors, validate } from "../middlewares/handle_validation_errors";
import { jwtCheckToken } from "../middlewares/jwt_check_token";
import { avatarUploader } from "../middlewares/avatar_upload";

const authRouter = Router()

authRouter.post("/login", loginValidator, handleValidationErrors, loginController)

authRouter.post("/business-register",)
authRouter.post("/test",
    validate(testSchema),
)
// authRouter.post('/register', registerValidator, handleValidationErrors, registerController)
// authRouter.post(
//     '/register-business',
//     avatarUploader.single("avatar"),
//     validateBusinessRegister,
//     handleValidationErrors,
//     businessRegisterController
// )

// authRouter.post('/resend-otp', resendOtpController)
// authRouter.post('/verify-otp', verifyOtpController)
// authRouter.get('/me', jwtCheckToken, getInfoUserLoginController)
// authRouter.post('/avatar',
//     jwtCheckToken,
//     avatarUploader.single('avatar'),
//     handleValidationErrors,
//     updateAvatarController
// )

// authRouter.patch('/me',
//     jwtCheckToken,
//     updateProfileValidator,
//     handleValidationErrors,
//     updateProfileController
// )

export default authRouter