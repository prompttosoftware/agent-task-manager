// src/api/routes/epic.routes.ts
import express from 'express';
import { EpicController } from '../controllers/epic.controller'; // Adjust the path if needed
import { EpicService } from '../../src/services/epic.service';

const router = express.Router();

// Initialize EpicService and EpicController
const epicService = new EpicService();
const epicController = new EpicController(epicService);

router.get('/:epicKey', epicController.getEpic.bind(epicController));
router.get('/', epicController.listEpics.bind(epicController));
router.post('/', epicController.createEpic.bind(epicController));
router.put('/:epicKey', epicController.updateEpic.bind(epicController));
router.delete('/:epicKey', epicController.deleteEpic.bind(epicController));
router.get('/:epicKey/issues', epicController.getIssuesForEpic.bind(epicController));

export default router;
