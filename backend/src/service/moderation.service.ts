import { BaseService } from "./base.service";
import { recognize } from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import axios from "axios";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

// Blacklist of toxic, vulgar, and offensive terms in both Indonesian and English
const BLACKLIST_WORDS = [
  "fuck", "vulgar", "kontol", "memek", "ngentot", "anjing", "bangsat", 
  "porn", "xxx", "nudity", "telanjang", "pornografi", "fulgar", "palkon", 
  "babi", "bajingan", "pantek", "brengsek", "pepek", "jembut", "tetek", 
  "ngewe", "silit", "lonthe", "lonte", "pelacur", "whore", "bitch", "cunt", 
  "asshole", "naked", "milf"
];

export class ModerationService extends BaseService {
  /**
   * Scans a given text string for toxic or blacklisted words.
   */
  static scanText(text: string): { isToxic: boolean; foundWords: string[] } {
    const normalized = text.toLowerCase();
    const foundWords: string[] = [];

    for (const word of BLACKLIST_WORDS) {
      // Use regex to find whole word matches or partial matches depending on sensitivity
      const regex = new RegExp(`\\b${word}\\b|${word}`, "g");
      if (regex.test(normalized)) {
        foundWords.push(word);
      }
    }

    return {
      isToxic: foundWords.length > 0,
      foundWords,
    };
  }

  /**
   * Extracts text from an image locally using Tesseract.js (OCR).
   */
  static async performOCR(imagePath: string): Promise<string> {
    try {
      const { data: { text } } = await recognize(imagePath, "eng");
      return text;
    } catch (error: any) {
      console.error("[Moderation] OCR failed:", error?.message || error);
      return ""; // Fallback to empty string if OCR fails
    }
  }

  /**
   * Analyzes an image for potential nudity or excessive skin exposure locally.
   * Resizes image to 100x100 for high performance, then applies an RGB Skin Color Heuristic.
   */
  static async analyzeSkinToneRatio(imagePath: string): Promise<number> {
    try {
      const { data, info } = await sharp(imagePath)
        .resize(100, 100, { fit: "cover" })
        .raw()
        .toBuffer({ resolveWithObject: true });

      let skinPixels = 0;
      const totalPixels = info.width * info.height;

      // Scan raw pixel buffers (R, G, B sequentially)
      for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Standard RGB skin color space boundaries
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        const isSkin =
          r > 95 &&
          g > 40 &&
          b > 20 &&
          max - min > 15 &&
          Math.abs(r - g) > 15 &&
          r > g &&
          r > b;

        if (isSkin) {
          skinPixels++;
        }
      }

      return skinPixels / totalPixels;
    } catch (error: any) {
      console.error("[Moderation] Skin tone analysis failed:", error?.message || error);
      return 0;
    }
  }

  /**
   * Validates image for safe search/vulgarity using Cloud Vision API if key is present,
   * or falls back to local OCR + Skin Tone heuristic.
   */
  static async checkGoogleVisionSafeSearch(imagePath: string, apiKey: string): Promise<{ isVulgar: boolean; reason?: string }> {
    try {
      const fileBuffer = await fs.promises.readFile(imagePath);
      const base64Image = fileBuffer.toString("base64");

      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: "SAFE_SEARCH_DETECTION" }]
            }
          ]
        },
        { timeout: 5000 }
      );

      const annotation = response.data?.responses?.[0]?.safeSearchAnnotation;
      if (annotation) {
        const { adult, violence, racy } = annotation;
        const isAdult = adult === "LIKELY" || adult === "VERY_LIKELY";
        const isRacy = racy === "LIKELY" || racy === "VERY_LIKELY";
        const isViolent = violence === "LIKELY" || violence === "VERY_LIKELY";

        if (isAdult || isRacy || isViolent) {
          return {
            isVulgar: true,
            reason: `Google Vision SafeSearch: Terdeteksi konten sensitif (${isAdult ? "Adult" : ""}${isRacy ? " Racy" : ""}${isViolent ? " Violence" : ""})`
          };
        }
      }
      return { isVulgar: false };
    } catch (error: any) {
      console.error("[Moderation] Google Vision API failed, falling back to local heuristics:", error?.message || error);
      return { isVulgar: false }; // fallback to local on API error
    }
  }

  /**
   * Complete, synchronous moderation gate for uploaded image files.
   * Must be called inside file controllers right after receiving standard files.
   */
  static async validateUploadedImage(file: Express.Multer.File): Promise<void> {
    const filename = file.originalname.toLowerCase();

    // 1. Scan original filename for toxic words
    const nameCheck = this.scanText(filename);
    if (nameCheck.isToxic) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError(
        `File ditolak karena nama file mengandung kata tidak pantas: "${nameCheck.foundWords.join(", ")}"`,
        HttpStatus.BAD_REQUEST
      );
    }

    // 2. Perform OCR scan to extract toxic text in image (using Tesseract)
    console.log(`[Moderation] Scanning text inside image: ${file.filename}`);
    const extractedText = await this.performOCR(file.path);
    if (extractedText.trim()) {
      const textCheck = this.scanText(extractedText);
      if (textCheck.isToxic) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new AppError(
          `File ditolak karena gambar mengandung tulisan tidak pantas: "${textCheck.foundWords.join(", ")}"`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // 3. Perform Vulgarity/Nudity analysis (Google Vision or Skin tone fallback)
    const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
    let vulgarCheck: { isVulgar: boolean; reason?: string } = { isVulgar: false, reason: "" };

    if (visionApiKey) {
      console.log(`[Moderation] Running Google Cloud Vision check on: ${file.filename}`);
      vulgarCheck = await this.checkGoogleVisionSafeSearch(file.path, visionApiKey);
    } else {
      console.log(`[Moderation] Running local smart skin-tone heuristic check on: ${file.filename}`);
      const skinRatio = await this.analyzeSkinToneRatio(file.path);
      console.log(`[Moderation] Image skin-tone ratio: ${(skinRatio * 100).toFixed(2)}%`);
      
      // If skin ratio exceeds 85%, flag as potentially vulgar
      if (skinRatio > 0.85) {
        vulgarCheck = {
          isVulgar: true,
          reason: `Heuristik Lokal: Terlalu banyak menampilkan area kulit terbuka (${(skinRatio * 100).toFixed(0)}%).`
        };
      }
    }

    if (vulgarCheck.isVulgar) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError(
        `File ditolak karena terdeteksi mengandung konten vulgar/sensitif. (${vulgarCheck.reason})`,
        HttpStatus.BAD_REQUEST
      );
    }

    console.log(`[Moderation] Moderation passed successfully for: ${file.filename}`);
  }
}
