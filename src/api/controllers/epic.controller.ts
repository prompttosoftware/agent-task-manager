import { Request, Response } from 'express';
import { EpicService } from '../services/epic.service';
import { validationResult, body, param } from 'express-validator';
import { EpicCreateRequest, EpicUpdateRequest } from '../types/epic.d.ts';

// Define the controller class
export class EpicController {
  private readonly epicService: EpicService;

  constructor() {
    this.epicService = new EpicService();
  }

  // Implement GET /epics/:epicKey route handler
  async getEpicByKey(req: Request, res: Response) {
    try {
      await param('epicKey').isString().notEmpty().withMessage('Epic Key is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const epicKey = req.params.epicKey;
      const epic = await this.epicService.getEpicByKey(epicKey);
      if (!epic) {
        return res.status(404).json({ message: 'Epic not found' });
      }
      res.status(200).json(epic);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  // Implement GET /epics route handler
  async getAllEpics(req: Request, res: Response) {
    try {
      const epics = await this.epicService.getAllEpics();
      res.status(200).json(epics);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  // Implement POST /epics route handler
  async createEpic(req: Request, res: Response) {
    try {
      await body('key').isString().notEmpty().withMessage('Key is required').trim().escape().run(req);
      await body('name').isString().notEmpty().withMessage('Name is required').trim().escape().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const newEpic: EpicCreateRequest = req.body;
      const createdEpic = await this.epicService.createEpic(newEpic);
      res.status(201).json(createdEpic);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  // Implement PUT /epics/:epicKey route handler
  async updateEpic(req: Request, res: Response) {
    try {
      await param('epicKey').isString().notEmpty().withMessage('Epic Key is required').run(req);
      await body('name').optional().isString().trim().escape().run(req);
      await body('key').optional().isString().trim().escape().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const epicKey = req.params.epicKey;
      const updateData: EpicUpdateRequest = req.body;
      const updatedEpic = await this.epicService.updateEpic(epicKey, updateData);
      res.status(200).json(updatedEpic);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  // Implement DELETE /epics/:epicKey route handler
  async deleteEpic(req: Request, res: Response) {
    try {
      await param('epicKey').isString().notEmpty().withMessage('Epic Key is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const epicKey = req.params.epicKey;
      await this.epicService.deleteEpic(epicKey);
      res.status(204).send(); // No content on success
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  // Implement GET /epics/:epicKey/issues route handler
  async getIssuesByEpicKey(req: Request, res: Response) {
    try {
      await param('epicKey').isString().notEmpty().withMessage('Epic Key is required').run(req);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const epicKey = req.params.epicKey;
      const issues = await this.epicService.getIssuesByEpicKey(epicKey);
      res.status(200).json(issues);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}
