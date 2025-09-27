import path from 'path';

export function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return path.basename(urlObj.pathname);
  } catch {
    throw new Error('Invalid URL format');
  }
}
