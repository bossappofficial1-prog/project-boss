import { apiClient } from './base';

export const uploadApi = {
  uploadImage: async (
    file: File,
    options?: { fieldName?: string; scope?: 'product' | 'outlet' | 'user'; }
  ): Promise<{ url: string; filename: string; originalName: string; size: number; mimetype: string; message?: string; }> => {
    const form = new FormData();
    const field = options?.fieldName || 'image';
    form.append(field, file);

    let endpoint = '/upload/image';
    if (options?.scope === 'product') endpoint = '/upload/product/image';
    if (options?.scope === 'outlet') endpoint = '/upload/outlet/image';
    if (options?.scope === 'user') endpoint = '/upload/user/avatar';

    const response = await apiClient.post(endpoint, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  deleteByUrl: async (url: string): Promise<void> => {
    const response = await apiClient.delete('/upload/image', {
      data: { url },
    });
    return response.data;
  },
};
