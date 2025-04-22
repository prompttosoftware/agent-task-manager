import { Router } from 'express';
import { getCreateMetadata } from '../controllers/metadataController';

const router = Router();

router.get('/createmeta', getCreateMetadata);

export default router;
