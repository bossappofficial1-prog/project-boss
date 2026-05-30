import { apiClient } from "./base";

export interface UploadMediaResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  mediaType: "IMAGE" | "VIDEO";
}

export const uploadApi = {
  uploadImage: async (
    file: File,
    options?: { fieldName?: string; scope?: "product" | "outlet" | "user" },
  ): Promise<{
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    message?: string;
  }> => {
    try {
      const form = new FormData();
      const field = options?.fieldName || "image";
      form.append(field, file);

      let endpoint = "/upload/image";
      if (options?.scope === "product") endpoint = "/upload/product/image";
      if (options?.scope === "outlet") endpoint = "/upload/outlet/image";
      if (options?.scope === "user") endpoint = "/upload/user/avatar";

      const response = await apiClient.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  uploadMedia: async (file: File): Promise<UploadMediaResult> => {
    const form = new FormData();
    form.append("media", file);
    const response = await apiClient.post("/upload/product/media", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30 * 60 * 1000,
    });
    return response.data.data;
  },

  uploadMultipleMedia: async (
    files: File[],
  ): Promise<{ files: UploadMediaResult[] }> => {
    const form = new FormData();
    files.forEach((f) => form.append("media", f));
    const response = await apiClient.post("/upload/product/medias", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  deleteByUrl: async (url: string): Promise<void> => {
    const response = await apiClient.delete("/upload/image", {
      data: { url },
    });
    return response.data;
  },
};
