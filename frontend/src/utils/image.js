/**
 * Compresses an image file using Canvas
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = (file, { maxWidth = 800, maxHeight = 800, quality = 0.7 } = {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validates image file type and size
 * @param {File} file - The file to validate
 * @param {Array} allowedTypes - Allowed MIME types
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateImage = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'], maxSizeMB = 2) => {
  if (!file) return { isValid: false, message: 'File tidak ditemukan' };

  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      message: `Tipe file tidak didukung. Gunakan ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}` 
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      message: `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB` 
    };
  }

  return { isValid: true, message: 'File valid' };
};
