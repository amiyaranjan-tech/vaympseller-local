import { request } from './client';
import { ENDPOINTS } from './endpoints';

export interface UploadedImage {
  url: string;
  publicId: string;
}

export function uploadSellerImage(file: { uri: string; type: string; name: string }) {
  const form = new FormData();
  // React Native's FormData wants this file-part shape, not a real Blob.
  form.append('file', file as unknown as Blob);

  return request<UploadedImage>({
    url: ENDPOINTS.sellerUploads.create,
    method: 'POST',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
