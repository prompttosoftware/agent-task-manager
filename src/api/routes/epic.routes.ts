import { Router } from 'express';
import { getEpics } from '../controllers/epic.controller';

const router = Router();

router.get('/epics', getEpics);

export default router;
