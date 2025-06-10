import multer from 'multer';
import path from 'path';
import os from 'os';

const tempDir = os.tmpdir(); // Use a temporary directory

const uploadConfig = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tempDir); // Store in a temporary directory initially
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  // You can add file filter logic here if needed.
});

export default uploadConfig;
