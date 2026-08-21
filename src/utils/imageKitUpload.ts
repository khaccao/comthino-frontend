import { adminApi } from '../services/api';

type ImageKitAuth = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
};

export const uploadToImageKit = async (file: Blob, fileName: string, folder: string) => {
  const auth = await adminApi.getImageKitAuth() as ImageKitAuth;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);
  formData.append('folder', folder);
  formData.append('publicKey', auth.publicKey);
  formData.append('token', auth.token);
  formData.append('expire', String(auth.expire));
  formData.append('signature', auth.signature);
  formData.append('useUniqueFileName', 'true');

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Không upload được ảnh lên ImageKit.');
  }

  const data = await response.json();
  return {
    url: data.url as string,
    fileId: data.fileId as string,
    thumbnailUrl: data.thumbnailUrl as string | undefined,
  };
};

export const canvasToJpegBlob = (canvas: HTMLCanvasElement, quality = 0.9) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Không tạo được ảnh từ camera.'));
    }, 'image/jpeg', quality);
  });
