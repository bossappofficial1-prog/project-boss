import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { config } from "./config"
import { AppError } from "../errors/api_errors"

cloudinary.config({
    cloud_name: config.cloudinary.CLOUD_NAME,
    api_key: config.cloudinary.API_KEY,
    api_secret: config.cloudinary.API_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: "images",
            allowed_formats: ['jpeg', 'png', 'jpg'],
        }
    }
})

export class Cloudinary {

    static async deleteImage(public_id: string): Promise<boolean> {
        const result = await cloudinary.uploader.destroy(public_id)

        if (result.result === `not found`) {
            throw new AppError(`Gambar tidak ditemukan`)
        }

        if (result.result !== `ok`) {
            throw new AppError(`Gagal menghapus gambar`)
        }

        return true
    }

    static async updateImage(public_id: string, path: string) {
        const result = await cloudinary.uploader.upload(path, {
            public_id,
            overwrite: true
        })

        return {
            url: result.secure_url,
            public_id: result.public_id
        }
    }
}

export { cloudinary, storage }