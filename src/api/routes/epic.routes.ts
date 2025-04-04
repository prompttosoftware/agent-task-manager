import { Router } from 'express';
import { getEpics, deleteEpic } from '../controllers/epic.controller';

const router = Router();

router.get('/epics', getEpics);
router.delete('/epics/:epicKey', deleteEpic);

export default router;