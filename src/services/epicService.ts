import { Epic } from '../types/epic';

export class EpicService {
  private epics: Epic[] = [
    // Sample data - replace with data from in-memory storage or database
    { id: '1', key: 'ATM-1', summary: 'Epic 1', status: 'Open' },
    { id: '2', key: 'ATM-2', summary: 'Epic 2', status: 'In Progress' },
  ];

  async getAllEpics(): Promise<Epic[]> {
    return this.epics;
  }
}
