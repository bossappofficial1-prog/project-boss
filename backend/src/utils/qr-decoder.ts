import sharp from "sharp";
import jsQR from "jsqr";
import axios from "axios";

export async function decodeQRFromBuffer(buffer: Buffer): Promise<string | null> {
  try {
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const code = jsQR(
      new Uint8ClampedArray(data),
      info.width,
      info.height
    );

    return code ? code.data : null;
  } catch (error) {
    console.error("Failed to decode QR code:", error);
    return null;
  }
}

export async function decodeQRFromUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    return decodeQRFromBuffer(buffer);
  } catch (error) {
    console.error(`Failed to fetch and decode QR from URL: ${url}`, error);
    return null;
  }
}
