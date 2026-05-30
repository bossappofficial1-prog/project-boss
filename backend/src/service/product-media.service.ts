import { MediaSource, MediaType } from "@prisma/client";
import {
  ProductMediaRepository,
  CreateMediaInput,
} from "../repositories/product-media.repository";
import { ImageService } from "./image.service";

export interface MediaItemInput {
  url: string;
  type: MediaType;
  source: MediaSource;
  alt?: string;
  order: number;
  thumbnailUrl?: string;
}

export class ProductMediaService {
  /**
   * Sync media for a product: delete all existing, then create new ones.
   * Also deletes physical files for removed uploaded media.
   */
  static async syncMedia(
    productId: string,
    mediaItems: MediaItemInput[],
  ): Promise<void> {
    // Get existing media to know which files to clean up
    const existing = await ProductMediaRepository.findByProductId(productId);

    // Find uploaded media URLs that are being removed
    const newUrls = new Set(mediaItems.map((m) => m.url));
    const removedUploads = existing.filter(
      (m) => m.source === "UPLOAD" && !newUrls.has(m.url),
    );

    // Delete all existing media records
    if (existing.length > 0) {
      await ProductMediaRepository.deleteByProductId(productId);
    }

    // Create new media records
    if (mediaItems.length > 0) {
      const items: CreateMediaInput[] = mediaItems.map((m, index) => ({
        url: m.url,
        type: m.type,
        source: m.source,
        alt: m.alt,
        order: m.order ?? index,
        thumbnailUrl: m.thumbnailUrl,
      }));
      await ProductMediaRepository.createMany(productId, items);
    }

    // Clean up physical files for removed uploaded media
    for (const media of removedUploads) {
      try {
        ImageService.deleteImageByUrl(media.url);
      } catch {
        // Ignore file deletion errors
      }
      if (media.thumbnailUrl) {
        try {
          ImageService.deleteImageByUrl(media.thumbnailUrl);
        } catch {
          // Ignore
        }
      }
    }
  }

  /**
   * Delete all media for a product and clean up files.
   */
  static async deleteAllMedia(productId: string): Promise<void> {
    const existing = await ProductMediaRepository.findByProductId(productId);

    if (existing.length > 0) {
      await ProductMediaRepository.deleteByProductId(productId);

      // Clean up uploaded files
      for (const media of existing) {
        if (media.source === "UPLOAD") {
          try {
            ImageService.deleteImageByUrl(media.url);
          } catch {
            // Ignore
          }
        }
      }
    }
  }

  /**
   * Validate embed URL (YouTube/Instagram) and return normalized embed URL.
   */
  static validateEmbedUrl(url: string): {
    valid: boolean;
    embedUrl: string;
    thumbnailUrl?: string;
  } {
    // YouTube
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (ytMatch) {
      const videoId = ytMatch[1];
      return {
        valid: true,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    // Instagram
    const igMatch = url.match(/instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/);
    if (igMatch) {
      const contentType = igMatch[1];
      const mediaId = igMatch[2];
      return {
        valid: true,
        embedUrl: `https://www.instagram.com/${contentType}/${mediaId}/embed`,
      };
    }

    return { valid: false, embedUrl: url };
  }
}
