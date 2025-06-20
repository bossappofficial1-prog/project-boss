import {
    createUser,
    deleteUser,
    getUserByEmail,
    updateUserService
} from "./user.service";
import { sendVerificationEmail } from "./email.service";
import { OAuth2Client } from "google-auth-library";
import { hashing, verifyHash } from "../utils/bcrypt";
import { generateOtp } from "../utils/otp.utils";
import { AppError } from "../errors/api_errors";
import { config } from "../configs/config";
import { generateToken } from "../utils/jwt";

export async function registerService(data: {
    email: string,
    name: string,
    password: string
}) {
    const hashedPassword = await hashing(data.password)
    const otp = generateOtp()
    const hashedOtp = await hashing(otp)
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000)

    const newUser = await createUser({
        ...data,
        password: hashedPassword!,
        verificationCode: hashedOtp!,
        verificationCodeExpires
    });

    try {
        await sendVerificationEmail(newUser.email, otp)
    } catch (error) {
        await deleteUser(newUser.id)
        throw new AppError('Gagal mengirim email verifikasi. Silakan coba lagi.', 500);
    }

    return { ...newUser, password: null, verificationCode: null }
}

export async function loginService(data: { email: string, password: string }) {
    // ambil data user berdasarkan email
    const user = await getUserByEmail(data.email)

    const genericError = new AppError('Email atau password salah.', 401);

    // check apakah user dengan email ini tersedia
    if (!user) throw new AppError('Email or password is incorrect', 400);

    const isPasswordCorrect = await verifyHash(data.password, user.password)
    // check apakah user sudah terverifikasi
    if (!isPasswordCorrect || !user.isVerified) throw genericError;

    // kembalikan data user
    return { ...user, password: null, verificationCode: null }
}

export async function resendOtpService(email: string) {
    // ambil data user berdasarkan email
    const user = await getUserByEmail(email)

    if (!user) throw new AppError(`User with email '${email} not found'`, 404);
    if (user.isVerified) throw new AppError('This account has already verified', 400)
    // generate kode OTP
    const otp = generateOtp()
    // hashed OTP untuk disimpan di database
    const hashedOtp = await hashing(otp)
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000)

    // kirim ulang verifikasi email otp
    await sendVerificationEmail(user?.email!, otp)

    // update data user
    const updateUser = await updateUserService(user?.id!, {
        verificationCode: hashedOtp!,
        verificationCodeExpires
    })

    return updateUser
}

export async function verifyOtpService(email: string, otp: string) {
    const user = await getUserByEmail(email)

    if (!user || !user.verificationCode || !user.verificationCodeExpires) {
        throw new AppError('Kode OTP tidak valid atau sudah kedaluwarsa.', 400);
    }
    // console.log(Date.now() > user.verificationCodeExpires.getTime());

    if (Date.now() > user.verificationCodeExpires.getTime()) {
        throw new AppError('Kode OTP sudah kedaluwarsa.', 400);
    }

    const isOtpCorrect = await verifyHash(otp, user.verificationCode);

    if (!isOtpCorrect) {
        throw new AppError('Kode OTP tidak valid.', 400);
    }

    await updateUserService(user?.id!, {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null
    })

    return user
}

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID)

export async function googleLoginService(token: string): Promise<string | null> {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: config.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload()
        if (!payload || !payload.email || !payload.name) throw new AppError('Invalid token payload');

        const { email, name } = payload

        let user = await getUserByEmail(email)

        if (!user) {
            user = await createUser({ email, name, password: `${email}-${name}` })
        }
        const accessToken = generateToken(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            })
        return accessToken
    } catch (error) {
        return null
    }
}