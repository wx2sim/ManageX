import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file and uploads it to Cloudinary using an unsigned upload preset.
 * 
 * @param file The raw file selected by the user.
 * @returns The secure URL of the uploaded image on Cloudinary.
 */
export async function uploadProductImage(file: File): Promise<string> {
  // Compress the image file to under 200KB and maximum 800px width/height
  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);

    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', 'product_images');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dd0biipo9/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
    }

    const result = await response.json();
    return result.secure_url;
  } catch (error: any) {
    console.error('Error during image upload:', error);
    throw new Error(error.message || 'Image processing or upload failed');
  }
}
