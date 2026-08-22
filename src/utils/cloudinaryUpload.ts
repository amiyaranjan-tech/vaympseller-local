import { request } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Mirrors the admin panel's utils/cloudinaryUpload.ts — same signed
// direct-to-Cloudinary flow (POST .../uploads/sign -> our backend hands
// back a short-lived signature, the file bytes never touch our server),
// just using RN's fetch/FormData instead of XHR since there's no upload
// progress UI here yet.
interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

export async function uploadImageToCloudinary(
  file: PickedFile,
  folder = 'products',
): Promise<UploadedImage> {
  const signature = await request<UploadSignature>({
    url: ENDPOINTS.sellerUploads.sign,
    method: 'POST',
    data: { folder },
  });

  const formData = new FormData();
  // RN's FormData accepts this {uri,name,type} shape directly — it is not
  // a real Blob/File, so it's intentionally not typed as one.
  formData.append('file', file as unknown as Blob);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('folder', signature.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: 'POST', body: formData },
  );

  const body = await response.json();

  if (!response.ok || !body.secure_url) {
    throw new Error(body?.error?.message || 'Image upload failed');
  }

  return { url: body.secure_url, publicId: body.public_id };
}
