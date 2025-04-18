import { DatabaseService } from './databaseService';

export class IssueKeyService {
  private static readonly METADATA_TABLE = 'Metadata';
  private static readonly LAST_ISSUE_INDEX_KEY = 'last_issue_index';
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  async getNextIssueKey(): Promise<string> {
    try {
      await this.dbService.ensureTableExists(IssueKeyService.METADATA_TABLE, [
        { column: IssueKeyService.LAST_ISSUE_INDEX_KEY, type: 'INTEGER' },
      ]);

      // Begin a transaction to ensure atomicity
      await this.dbService.beginTransaction();

      // Retrieve the current index
      let lastIndex = (await this.dbService.getSingleValue(
        IssueKeyService.METADATA_TABLE,
        IssueKeyService.LAST_ISSUE_INDEX_KEY
      )) as number | undefined;

      lastIndex = lastIndex === undefined ? 0 : lastIndex;

      // Increment the index
      const newIndex = lastIndex + 1;

      // Update the index in the database
      await this.dbService.setSingleValue(
        IssueKeyService.METADATA_TABLE,
        IssueKeyService.LAST_ISSUE_INDEX_KEY,
        newIndex
      );

      // Commit the transaction
      await this.dbService.commitTransaction();

      // Format and return the new key
      return `TASK-${newIndex}`;
    } catch (error) {
      // Rollback the transaction on error
      await this.dbService.rollbackTransaction();
      throw error;
    }
  }
}
