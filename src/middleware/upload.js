const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pothole-reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, or WEBP images are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 3 },
});

module.exports = upload;