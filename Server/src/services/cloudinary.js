import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  }
});

class CloudinaryService {
  /**
   * Upload image to Cloudinary
   * @param {Buffer} buffer - Image buffer
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(buffer, options = {}) {
    try {
      const {
        folder = 'profile-images',
        transformation = {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 'auto',
          format: 'auto'
        },
        public_id,
        overwrite = true
      } = options;

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            transformation,
            public_id,
            overwrite,
            resource_type: 'image'
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        // Convert buffer to stream and pipe to Cloudinary
        const stream = Readable.from(buffer);
        stream.pipe(uploadStream);
      });
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload profile image for user
   * @param {String} userId - User ID
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<String>} Image URL
   */
  async uploadProfileImage(userId, buffer) {
    try {
      const result = await this.uploadImage(buffer, {
        folder: 'profile-images',
        public_id: `profile_${userId}`,
        transformation: {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
          gravity: 'face'
        }
      });

      return result.secure_url;
    } catch (error) {
      throw new Error(`Failed to upload profile image: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {String} publicId - Public ID of the image
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Delete profile image for user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteProfileImage(userId) {
    try {
      const publicId = `profile-images/profile_${userId}`;
      return await this.deleteImage(publicId);
    } catch (error) {
      throw new Error(`Failed to delete profile image: ${error.message}`);
    }
  }

  /**
   * Get optimized image URL
   * @param {String} publicId - Public ID of the image
   * @param {Object} transformation - Transformation options
   * @returns {String} Optimized image URL
   */
  getOptimizedUrl(publicId, transformation = {}) {
    const defaultTransformation = {
      quality: 'auto',
      format: 'auto'
    };

    return cloudinary.url(publicId, {
      ...defaultTransformation,
      ...transformation
    });
  }

  /**
   * Generate upload signature for client-side uploads
   * @param {Object} params - Upload parameters
   * @returns {Object} Signature and timestamp
   */
  generateUploadSignature(params = {}) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { ...params, timestamp },
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME
    };
  }
}

export default new CloudinaryService();
export { upload };