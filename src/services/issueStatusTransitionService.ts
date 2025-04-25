import { DatabaseService } from './databaseService';

export interface StatusTransition {
  current_status_id: number;
  target_status_id: number;
}

export class IssueStatusTransitionService {
  private readonly databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async isValidTransition(currentStatusId: number, targetStatusId: number): Promise<boolean> {
    try {
      const result = await this.databaseService.get<{ current_status_id: number; target_status_id: number }>( 
        'SELECT current_status_id, target_status_id FROM status_transitions WHERE current_status_id = ? AND target_status_id = ?', 
        [currentStatusId, targetStatusId]
      );
      return !!result;
    } catch (error) {
      console.error('Error fetching status transitions:', error);
      return false; // Consider more sophisticated error handling
    }
  }

  async getStatusId(statusName: string): Promise<number | undefined> {
    try {
      const result = await this.databaseService.get<{ id: number }>('SELECT id FROM statuses WHERE name = ?', [statusName]);
      return result?.id;
    } catch (error) {
      console.error('Error fetching status ID:', error);
      return undefined;
    }
  }

  async getStatusName(statusId: number): Promise<string | undefined> {
    try {
      const result = await this.databaseService.get<{ name: string }>('SELECT name FROM statuses WHERE id = ?', [statusId]);
      return result?.name;
    } catch (error) {
      console.error('Error fetching status name:', error);
      return undefined;
    }
  }
}