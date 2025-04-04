import { Request, Response } from 'express';
import { EpicService } from '../services/epic.service';

// Define the controller class
export class EpicController {
  private readonly epicService: EpicService;

  constructor() {
    this.epicService = new EpicService();
  }

  // Implement GET /epics/:epicKey route handler
  async getEpicByKey(req: Request, res: Response) {
    try {
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
      const newEpic = await this.epicService.createEpic(req.body);
      res.status(201).json(newEpic);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  // Implement PUT /epics/:epicKey route handler
  async updateEpic(req: Request, res: Response) {
    try {
      const epicKey = req.params.epicKey;
      const updatedEpic = await this.epicService.updateEpic(epicKey, req.body);
      res.status(200).json(updatedEpic);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  // Implement DELETE /epics/:epicKey route handler
  async deleteEpic(req: Request, res: Response) {
    try {
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
      const epicKey = req.params.epicKey;
      const issues = await this.epicService.getIssuesByEpicKey(epicKey);
      res.status(200).json(issues);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}