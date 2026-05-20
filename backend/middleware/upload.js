const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'vibe-social',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
  cb(isValid ? null : new Error('Only image files are allowed'), isValid);
};

const upload = multer({ storage: cloudinaryStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = upload;
