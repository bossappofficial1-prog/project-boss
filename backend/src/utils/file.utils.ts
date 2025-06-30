import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

// Base folder upload, absolute path ke project-root/public/uploads
const BASE_UPLOAD_DIR = path.resolve(__dirname, "../../public/uploads");

interface SaveFileOptions {
    subFolder?: string; // misal 'example' atau 'products/123'
}

export async function saveFile(
    file: { originalFilename: string; filepath: string },
    options: SaveFileOptions = {}
): Promise<string> {
    const { subFolder = "" } = options;

    // 1. Tentukan direktori tujuan sepenuhnya
    const targetDir = path.join(BASE_UPLOAD_DIR, subFolder);

    // 2. Jika belum ada, buat direktori secara rekursif
    await fs.promises.mkdir(targetDir, { recursive: true });

    // 3. Generate unik filename
    const ext = path.extname(file.originalFilename);
    const fileName = randomUUID() + ext;
    const dest = path.join(targetDir, fileName);

    // 4. Pindahkan file dari tmp ke public/uploads/…
    await fs.promises.rename(file.filepath, dest);

    // 5. Kembalikan path relatif untuk disimpan di DB / dikirim ke client
    //    misal "/uploads/example/xxx.png"
    const relativePath = path
        .join("/uploads", subFolder, fileName)
        .replace(/\\/g, "/");

    return relativePath;
}
