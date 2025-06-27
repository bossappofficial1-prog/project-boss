import { Request, Response } from "express";
import { handlerAnyError } from "../errors/api_errors";
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
import { getUserByEmail } from "../services/user.service";
import { config } from "../configs/config";
import { hashing } from "../utils/bcrypt";

export async function registerController(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body
        const user = await registerService({ email, name, password })

        return ResponseUtil.success(res, null, 'Berhasil register', 201)
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function loginController(req: Request, res: Response) {
    try {
        const { email, password } = req.body
        const login = await loginService({ email, password })
        const token = await generateToken({ id: login.id, email: login.email, role: login.role, name: login.name })

        return ResponseUtil.success(res, { token }, 'Login successfully', 200)
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function verifyOtpController(req: Request, res: Response) {
    try {
        const { email, otp } = req.body
        console.log(`otp: ${otp}`);
        await verifyOtpService(email, otp)
        return ResponseUtil.success(res, null, 'Akun berhasil diverifikasi!')
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function resendOtpController(req: Request, res: Response) {
    try {
        const { email } = req.body
        await resendOtpService(email)

        return ResponseUtil.success(res, null, 'Berhasil mengirim ulang kode OTP')
    } catch (error) {
        return handlerAnyError(error, res)
    }
}


export async function googleLoginController(req: Request, res: Response) {
    const { token } = req.body

    if (!token) {
        return ResponseUtil.error(res, 'Token is required', 400)
    }
    try {
        const accessToken = await googleLoginService(token)

        return ResponseUtil.success(res, { token: accessToken })
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function getInfoUserLoginController(req: Request, res: Response) {
    try {
        let user = (req as any).user
        user = await getUserByEmail(user.email)
        return ResponseUtil.success(res, user, "Berhasil mendapatkan informasi user", 200)
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function updateProfileController(req: Request, res: Response) {
    try {
        const user = req.user
        const { name, password } = req.body
        const updated = await updateProfileService(user?.id!, { name, password })
        return ResponseUtil.success(res, updated, "Berhasil memperbarui profile")
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function updateAvatarController(req: Request, res: Response) {
    try {
        const file = req.file
        const user = req.user
        const updatedUser = await updateAvatarService(user?.id!, `${config.BASE_URL}/avatars/${file?.filename}`)

        return ResponseUtil.success(res, updatedUser, "Berhasil upload avatar")
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function businessRegisterController(req: Request, res: Response) {
    try {
        const file = req.file

        const { name, email, password, business, outlets } = req.body
        const newBusiness = await businessRegister({
            avatar: `${config.BASE_URL}/avatars/${file?.filename}`,
            business: business,
            email,
            name,
            outlets,
            password: (await hashing(password))!
        })

        return ResponseUtil.success(res, newBusiness, "Berhasil membuat bisnis baru", 201)
    } catch (error) {
        return handlerAnyError(error, res)
    }
}