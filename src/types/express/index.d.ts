import { UploadedFile } from '../../middleware/upload.config';

declare global {
  namespace Express {
    interface Request {
      files: UploadedFile[];
    }
  }
}
