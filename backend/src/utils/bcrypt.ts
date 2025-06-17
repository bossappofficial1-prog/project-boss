import { compare, hash } from "bcryptjs"

const saltAround = 10;

export async function hashing(text: string): Promise<string | null> {
    try {
        const hashed = hash(text, saltAround)
        return hashed;
    } catch (error: any) {
        console.log(`gagal hashing password: ${error.message}`);
        return null;
    }
}

export async function verifyHash(text: string, hashedText: string): Promise<boolean> {
    try {
        const match = await compare(text, hashedText);
        return match ? true : false;

    } catch (error: any) {
        console.log(`gagal verifikasi password: ${error.message}`);
        return false
    }
}