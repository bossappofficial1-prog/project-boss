import { API_BASE_URL, getAuthToken } from './base';

export const uploadApi = {
  uploadImage: async (
    file: File,
    options?: { fieldName?: string; scope?: 'product' | 'outlet' | 'user'; }
  ): Promise<{ url: string; filename: string; originalName: string; size: number; mimetype: string; message?: string; }> => {
    const token = getAuthToken();
    const form = new FormData();
    const field = options?.fieldName || 'image';
    form.append(field, file);

    let endpoint = '/upload/image';
    if (options?.scope === 'product') endpoint = '/upload/product/image';
    if (options?.scope === 'outlet') endpoint = '/upload/outlet/image';
    if (options?.scope === 'user') endpoint = '/upload/user/avatar';

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      body: form,
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || `Upload failed (${res.status})`);
    }
    return json.data;
  },

  deleteByUrl: async (url: string): Promise<void> => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'DELETE',
      headers: { 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || (json && json.success === false)) {
      throw new Error(json?.message || `Delete failed (${res.status})`);
    }
  },
};
