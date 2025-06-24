import { createUploader } from "../configs/multer";

export const avatarUploader = createUploader(
    'avatars',
    ['image/png', 'image/jpeg', 'image/jpg'],
    2 * 1024 * 1024
)