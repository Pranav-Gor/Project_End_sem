const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcps01l2f', // Example placeholder or using what we configure
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a Base64 string directly to Cloudinary.
 * Used for migration and backwards-compatible JSON APIs.
 * @param {string} base64String Data URL (e.g. data:image/jpeg;base64,...)
 * @param {string} folder Optional folder to store the image in Cloudinary
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
const uploadBase64 = async (base64String, folder = 'auctus') => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary base64 upload error:', error);
    throw error;
  }
};

/**
 * Upload a standard buffer string/stream (used with multer later).
 */
const uploadBuffer = (buffer, folder = 'auctus') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  uploadBase64,
  uploadBuffer,
};
