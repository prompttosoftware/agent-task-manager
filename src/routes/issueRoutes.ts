// src/routes/issueRoutes.ts
import express from 'express';
import { getIssueCreateMeta } from '../controllers/issueCreateMetaController';

const router = express.Router();

router.get('/issue/createmeta', getIssueCreateMeta);

export default router;
