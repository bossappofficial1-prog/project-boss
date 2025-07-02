import { Request, Response } from "express";
import {
    businessRegister,
    googleLoginService,
    loginService,
    registerService,
    resendOtpService,
    updateAvatarService,
    updateProfileService,
    verifyOtpService
} from "../services/auth.service";
import { generateToken } from "../utils/jwt";
import { ResponseUtil } from "../utils/response.util";
import { getUserById } from "../services/user.service";
import { config } from "../configs/config";
import { hashing } from "../utils/bcrypt";
import { asyncHandler } from "../middlewares/error.middleware";

export const registerController = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body
    const user = await registerService({ email, name, password })

    return ResponseUtil.success(res, { ...user, password: "_" }, 'Berhasil register', 201)
})

// LOGIN
export const loginController = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body
    const login = await loginService({ email, password })
    const token = await generateToken({ id: login.id, email: login.email, role: login.role, name: login.name })

    return ResponseUtil.success(res, { token }, 'Login successfully', 200)
})

// VERIFY OTP
export const verifyOtpController = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body
    console.log(`otp: ${otp}`)
    await verifyOtpService(email, otp)
    return ResponseUtil.success(res, null, 'Akun berhasil diverifikasi!')
})

// RESEND OTP
export const resendOtpController = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body
    await resendOtpService(email)

    return ResponseUtil.success(res, null, 'Berhasil mengirim ulang kode OTP')
})

// GET INFO USER
export const getInfoUserLoginController = asyncHandler(async (req: Request, res: Response) => {
    let user = (req as any).user
    user = await getUserById(user.id)
    return ResponseUtil.success(res, user, "Berhasil mendapatkan informasi user", 200)
})

// UPDATE PROFILE
export const updateProfileController = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user
    const { name, password } = req.body
    const updated = await updateProfileService(user?.id!, { name, password })
    return ResponseUtil.success(res, updated, "Berhasil memperbarui profile")
})

// UPDATE AVATAR
export const updateAvatarController = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file
    const user = req.user
    const updatedUser = await updateAvatarService(user?.id!, `${config.BASE_URL}/avatars/${file?.filename}`)

    return ResponseUtil.success(res, updatedUser, "Berhasil upload avatar")
})

// REGISTER BUSINESS
export const businessRegisterController = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file
    const { name, email, password, business, outlets } = req.body
    const newBusiness = await businessRegister({
        avatar: `${config.BASE_URL}/avatars/${file?.filename}`,
        business,
        email,
        name,
        outlets,
        password: (await hashing(password))!
    })

    return ResponseUtil.success(res, newBusiness, "Berhasil membuat bisnis baru", 201)
})