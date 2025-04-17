import { Router } from 'express';
import { getCreateMetadata } from '../api/controllers/metadataController';

const router = Router();

router.get('/createmeta', getCreateMetadata);

export default router;
