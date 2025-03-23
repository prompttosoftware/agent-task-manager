import { Request, Response } from 'express';
import { EpicService } from '../services/epicService';

export class EpicController {
  private epicService: EpicService;

  constructor(epicService: EpicService) {
    this.epicService = epicService;
  }

  async getEpics(req: Request, res: Response) {
    try {
      const epics = await this.epicService.getAllEpics();
      const response = {
        epics: epics.map(epic => ({
          id: epic.id,
          name: epic.name,
          // Add other epic properties here to match Jira API
        })),
      };
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error getting epics:', error);
      res.status(500).json({ error: 'Failed to retrieve epics' });
    }
  }
}
