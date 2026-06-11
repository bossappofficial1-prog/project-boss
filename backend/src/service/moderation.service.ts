import { BaseService } from "./base.service";
import { recognize } from "tesseract.js";
import fs from "fs";
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
   * Validates uploaded image for toxic text content via OCR.
   * Vulgar image detection has been removed.
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

    console.log(`[Moderation] Moderation passed successfully for: ${file.filename}`);
  }

  /**
   * Asynchronous background moderation processing.
   * Scans the file for toxic text content via OCR.
   * Vulgar image detection has been removed.
   */
  static async processBackgroundModeration(filePath: string, filename: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      console.warn(`[Moderation Background] File not found at path: ${filePath}, skipping moderation.`);
      return;
    }

    const lowerFilename = filename.toLowerCase();

    // 1. Scan filename
    const nameCheck = this.scanText(lowerFilename);
    if (nameCheck.isToxic) {
      console.warn(`[Moderation Background] File ${filename} rejected. Filename contains blacklisted words: ${nameCheck.foundWords.join(", ")}`);
      await this.handleFailedModeration(filePath, filename);
      return;
    }

    // 2. OCR scan
    console.log(`[Moderation Background] Running OCR scan on: ${filename}`);
    const extractedText = await this.performOCR(filePath);
    if (extractedText.trim()) {
      const textCheck = this.scanText(extractedText);
      if (textCheck.isToxic) {
        console.warn(`[Moderation Background] File ${filename} rejected. Image text contains blacklisted words: ${textCheck.foundWords.join(", ")}`);
        await this.handleFailedModeration(filePath, filename);
        return;
      }
    }

    console.log(`[Moderation Background] Moderation passed successfully for: ${filename}`);
  }

  private static async handleFailedModeration(filePath: string, filename: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Moderation Background] Successfully deleted toxic file from disk: ${filePath}`);
      }
      
      // Dynamic import to avoid circular dependencies
      const { cleanDbReferences } = await import("../utils/db-cleanup.js");
      await cleanDbReferences(filename);
    } catch (err: any) {
      console.error(`[Moderation Background] Error handling failed moderation for ${filename}:`, err?.message || err);
    }
  }
}
