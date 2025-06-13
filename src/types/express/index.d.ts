import { Multer } from 'multer';
import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            fileValidationError?: string;
        }
    }
}
