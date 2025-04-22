import express from 'express';
import { getEpics } from '../controllers/epicController';

const router = express.Router();

router.get('/', getEpics);

export default router;
