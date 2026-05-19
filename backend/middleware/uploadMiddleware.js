import multer from 'multer';

const allowedMimeTypes = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  if (allowedMimeTypes[file.mimetype]) {
    cb(null, true);
    return;
  }

  const error = new Error('Only JPG, PNG, and WEBP receipt images are allowed');
  error.statusCode = 400;
  cb(error);
};

export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});
