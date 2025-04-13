// src/api/routes/epic.routes.ts
import express, { Request, Response } from 'express';
import { EpicController } from '../controllers/epic.controller'; // Adjust the path if needed
import { EpicService } from '../../src/services/epic.service';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Initialize EpicService and EpicController
const epicService = new EpicService();
const epicController = new EpicController(epicService);

// Validation middleware for creating an epic
const validateEpic = [
  body('epicKey').notEmpty().withMessage('Epic key is required').isString().withMessage('Epic key must be a string'),
  body('name').notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string'),
  body('description').notEmpty().withMessage('Description is required').isString().withMessage('Description must be a string'),
  body('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid date'),
  (req: Request, res: Response, next: express.NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.get('/:epicKey', epicController.getEpic.bind(epicController));
router.get('/', epicController.listEpics.bind(epicController));

// POST route with validation
router.post('/', validateEpic, async (req: Request, res: Response) => {
  try {
    await epicController.createEpic(req, res);
  } catch (error: any) { 
    console.error("Error in POST /epics route:", error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

router.put('/:epicKey', epicController.updateEpic.bind(epicController));
router.delete('/:epicKey', epicController.deleteEpic.bind(epicController));
router.get('/:epicKey/issues', epicController.getIssuesForEpic.bind(epicController));

export default router;