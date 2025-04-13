// src/api/controllers/epic.controller.ts
import { Request, Response } from 'express';
import { EpicService } from '../../src/services/epic.service'; // Assuming you'll create this

export class EpicController {
  private epicService: EpicService;

  constructor(epicService: EpicService) {
    this.epicService = epicService;
  }

  async getEpic(req: Request, res: Response) {
    const { epicKey } = req.params;
    try {
      const epic = await this.epicService.getEpic(epicKey);
      if (!epic) {
        return res.status(404).json({ message: 'Epic not found' });
      }
      res.json(epic);
    } catch (error: any) {
      console.error("Error fetching epic:", error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  async listEpics(req: Request, res: Response) {
    try {
      const epics = await this.epicService.listEpics();
      res.json(epics);
    } catch (error: any) {
      console.error("Error listing epics:", error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  async createEpic(req: Request, res: Response) {
    try {
      const newEpic = await this.epicService.createEpic(req.body);
      res.status(201).json(newEpic);
    } catch (error: any) {
      console.error("Error creating epic:", error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  async updateEpic(req: Request, res: Response) {
    const { epicKey } = req.params;
    try {
      const updatedEpic = await this.epicService.updateEpic(epicKey, req.body);
      if (!updatedEpic) {
        return res.status(404).json({ message: 'Epic not found' });
      }
      res.json(updatedEpic);
    } catch (error: any) {
      console.error("Error updating epic:", error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  async deleteEpic(req: Request, res: Response) {
    const { epicKey } = req.params;
    try {
      await this.epicService.deleteEpic(epicKey);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting epic:", error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  async getIssuesForEpic(req: Request, res: Response) {
    const { epicKey } = req.params;
    try {
      const issues = await this.epicService.getIssuesForEpic(epicKey);
      res.json(issues);
    } catch (error: any) {
      console.error("Error getting issues for epic:", error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}
