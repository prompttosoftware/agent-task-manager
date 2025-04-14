// src/api/controllers/epic.controller.ts
import { Request, Response } from 'express';
import { EpicService } from '../../src/api/services/epic.service';
import { Epic } from '../../src/types/epic.d';

export class EpicController {
  private epicService: EpicService;

  constructor() {
    this.epicService = new EpicService();
  }

  getEpic(req: Request, res: Response) {
    const { epicKey } = req.params;
    const epic = this.epicService.getEpic(epicKey);
    if (!epic) {
      return res.status(404).json({ message: 'Epic not found' });
    }
    res.json(epic);
  }

  listEpics(req: Request, res: Response) {
    const epics = this.epicService.listEpics();
    res.json(epics);
  }

  createEpic(req: Request, res: Response) {
    try {
      const newEpic: Epic = this.epicService.createEpic(req.body);
      res.status(201).json(newEpic);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Invalid input' });
    }
  }

  updateEpic(req: Request, res: Response) {
    const { epicKey } = req.params;
    const updatedEpic = this.epicService.updateEpic(epicKey, req.body);
    if (!updatedEpic) {
      return res.status(404).json({ message: 'Epic not found' });
    }
    res.json(updatedEpic);
  }

  deleteEpic(req: Request, res: Response) {
    const { epicKey } = req.params;
    this.epicService.deleteEpic(epicKey);
    res.status(204).send();
  }
}
