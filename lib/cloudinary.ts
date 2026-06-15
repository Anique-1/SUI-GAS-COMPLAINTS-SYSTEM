/**
 * Cloudinary client-side upload helper
 */

interface UploadResult {
  url: string;
  publicId: string;
  name: string;
}

/**
 * Uploads a file (Image or PDF) via the secure server endpoint or falls back to a mock base64 reader.
 */
export async function uploadFileToCloudinary(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to upload via API');
    }

    const data = await response.json();
    return {
      url: data.url,
      publicId: data.publicId,
      name: data.name,
    };
  } catch (error) {
    console.warn('API upload failed, falling back to local file reader:', error);
    return mockLocalUpload(file);
  }
}

/**
 * Simulates an upload by converting the file to a local Data URL
 */
function mockLocalUpload(file: File): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const parts = dataUrl.split(';base64,');
        // Insert name parameter in the data URL:
        const dataUrlWithName = `${parts[0]};name=${encodeURIComponent(file.name)};base64,${parts[1]}`;
        resolve({
          url: dataUrlWithName,
          publicId: `mock-id-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
        });
      } else {
        resolve(mockLocalUpload(file)); // retry or reject
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
