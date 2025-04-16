// src/services/issueKeyService.ts
import { DatabaseService } from './databaseService';

export class IssueKeyService {
  private readonly databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async getNextIssueKey(): Promise<string> {
    try {
      await this.databaseService.connect();

      // Create Metadata table if it doesn't exist
      await this.databaseService.run(
        `CREATE TABLE IF NOT EXISTS Metadata (key TEXT PRIMARY KEY, last_issue_index INTEGER)`
      );

      // Get the current last_issue_index or initialize to 0
      let result = await this.databaseService.get<{ last_issue_index: number }>(
        'SELECT last_issue_index FROM Metadata WHERE key = ?', ['last_issue_index']
      );
      let lastIssueIndex = result?.last_issue_index ?? 0;

      // Increment the index
      const newIssueIndex = lastIssueIndex + 1;

      // Update the last_issue_index in the Metadata table
      await this.databaseService.run(
        'INSERT OR REPLACE INTO Metadata (key, last_issue_index) VALUES (?, ?)',
        ['last_issue_index', newIssueIndex]
      );

      // Format the new key
      const newKey = `TASK-${newIssueIndex}`;
      return newKey;
    } catch (error) {
      console.error('Error getting next issue key:', error);
      throw new Error(`Failed to generate issue key: ${error}`);
    } finally {
      await this.databaseService.disconnect();
    }
  }
}
