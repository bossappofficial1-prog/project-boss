import { Request, Response } from "express";
import { handlerAnyError } from "../errors/api_errors";
import {
    googleLoginService,
    loginService,
    registerService,
    resendOtpService,
    verifyOtpService
} from "../services/auth.service";
import { generateToken } from "../utils/jwt";
import { ResponseUtil } from "../utils/response.util";

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