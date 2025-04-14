// src/api/routes/epic.routes.ts
import express, { Request, Response, NextFunction } from 'express';
import { EpicController } from '../controllers/epic.controller'; // Adjust the path if needed
import { EpicService } from '../../src/services/epic.service';
import { body, validationResult } from 'express-validator';
import { EpicCreateRequest, EpicUpdateRequest, ErrorResponse } from '../../src/types/epic';

const router = express.Router();

// Initialize EpicService and EpicController
const epicService = new EpicService();
const epicController = new EpicController(epicService);

// Validation middleware for creating an epic
const validateEpicCreate = [
  body('epicKey').notEmpty().withMessage('Epic key is required').isString().withMessage('Epic key must be a string'),
  body('name').notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string'),
  body('description').notEmpty().withMessage('Description is required').isString().withMessage('Description must be a string'),
  body('status').notEmpty().withMessage('Status is required').isString().withMessage('Status must be a string'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date string'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date string'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        errors: errors.array().map(error => ({
          msg: error.msg,
          param: error.param,
          location: error.location,
        })),
      };
      return res.status(400).json(errorResponse);
    }
    next();
  }
];

// Validation middleware for updating an epic
const validateEpicUpdate = [
  body('name').optional().isString().withMessage('Name must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('status').optional().isString().withMessage('Status must be a string'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date string'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date string'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       const errorResponse: ErrorResponse = {
        errors: errors.array().map(error => ({
          msg: error.msg,
          param: error.param,
          location: error.location,
        })),
      };
      return res.status(400).json(errorResponse);
    }
    next();
  }
];


router.get('/:epicKey', epicController.getEpic.bind(epicController));
router.get('/', epicController.listEpics.bind(epicController));

// POST route with validation
router.post('/', validateEpicCreate, async (req: Request, res: Response) => {
  try {
    const epicCreateRequest: EpicCreateRequest = req.body;
    await epicController.createEpic(req, res);
  } catch (error: any) {
    console.error("Error in POST /epics route:", error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

router.put('/:epicKey', validateEpicUpdate, async (req: Request, res: Response) => {
  try {
    const epicKey = req.params.epicKey;
    const epicUpdateRequest: EpicUpdateRequest = req.body;
    const updatedEpic = await epicController.updateEpic(epicKey, req.body);
    res.json(updatedEpic);
  } catch (error: any) {
    console.error("Error in PUT /epics/:epicKey route:", error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});
router.delete('/:epicKey', epicController.deleteEpic.bind(epicController));
router.get('/:epicKey/issues', epicController.getIssuesForEpic.bind(epicController));

export default router;
