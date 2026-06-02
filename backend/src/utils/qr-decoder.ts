import sharp from "sharp";
import jsQR from "jsqr";
import axios from "axios";
import fs from "fs";
import path from "path";

export async function decodeQRFromBuffer(buffer: Buffer): Promise<string | null> {
  // Helper to extract RGBA pixels safely from any sharp pipeline
  const getRgba = async (pipeline: sharp.Sharp) => {
    const pngBuf = await pipeline.png().toBuffer();
    const { data, info } = await sharp(pngBuf)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, info };
  };

  // Test 1: Direct decoding
  try {
    const { data, info } = await getRgba(sharp(buffer));
    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (code && code.data) return code.data;
  } catch (error: any) {
    console.warn("Direct QR decoding failed:", error.message);
  }

  // Test 2: Resize to max 800px (Helps with modern high-res mobile photos/screenshots)
  try {
    const pipeline = sharp(buffer).resize(800, 800, { fit: "inside" });
    const { data, info } = await getRgba(pipeline);
    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (code && code.data) return code.data;
  } catch (error: any) {
    console.warn("QR decoding with resize-800 failed:", error.message);
  }

  // Test 3: Greyscale + normalization + resize 600px (Helps with low contrast/blurry images)
  try {
    const pipeline = sharp(buffer)
      .greyscale()
      .normalize()
      .resize(600, 600, { fit: "inside" });
    const { data, info } = await getRgba(pipeline);
    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (code && code.data) return code.data;
  } catch (error: any) {
    console.warn("QR decoding with greyscale-resize-600 failed:", error.message);
  }

  return null;
}

export async function decodeQRFromUrl(url: string): Promise<string | null> {
  try {
    // Check if the URL points to a local upload file to avoid network requests
    let localPath: string | null = null;
    if (url.includes("/uploads/")) {
      const idx = url.indexOf("/uploads/");
      localPath = path.join(process.cwd(), url.slice(idx + 1));
    } else if (url.startsWith("uploads/")) {
      localPath = path.join(process.cwd(), url);
    } else if (url.startsWith("/uploads/")) {
      localPath = path.join(process.cwd(), url.slice(1));
    }

    if (localPath && fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const decoded = await decodeQRFromBuffer(buffer);
      if (decoded) return decoded;
    }

    // Fallback to HTTP request if not a local file or local decoding failed
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    return decodeQRFromBuffer(buffer);
  } catch (error) {
    console.error(`Failed to fetch and decode QR from URL: ${url}`, error);
    return null;
  }
}

