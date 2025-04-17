import express from 'express';
import { getEpics } from '../api/controllers/epicController';

const router = express.Router();

router.get('/', getEpics);

export default router;
