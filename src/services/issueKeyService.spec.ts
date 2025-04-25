import { IssueKeyService } from './issueKeyService';
import { DatabaseService } from './databaseService';
import sqlite3 from 'sqlite3';

jest.mock('./databaseService');

/**
 * @group unit
 * @description Tests for the IssueKeyService, focusing on key generation and database interactions.
 */
describe('IssueKeyService', () => {
  let issueKeyService: IssueKeyService;
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    const MockDatabaseService = DatabaseService as jest.Mock<DatabaseService>;

    // Implement all the methods of DatabaseService in the mock
    class MockDatabaseServiceImpl implements DatabaseService {
      connect = jest.fn();
      disconnect = jest.fn();
      run = jest.fn();
      get = jest.fn();
      all = jest.fn();
      ensureTableExists = jest.fn();
      getSingleValue = jest.fn();
      setSingleValue = jest.fn();
      beginTransaction = jest.fn();
      commitTransaction = jest.fn();
      rollbackTransaction = jest.fn();
      private mockDb: sqlite3.Database | null = null;

      get db(): sqlite3.Database | null {
        return this.mockDb;
      }
      set db(value: sqlite3.Database | null) {
        this.mockDb = value;
      }
    }

    MockDatabaseService.mockImplementation(() => new MockDatabaseServiceImpl());

    mockDbService = new MockDatabaseService() as jest.Mocked<DatabaseService>;
    issueKeyService = new IssueKeyService(mockDbService);
  });

  /**
   * @description Tests the successful generation of the next issue key.
   */
  it('should generate the next issue key', async () => {
    (mockDbService.getSingleValue as jest.Mock).mockResolvedValue(0);
    (mockDbService.setSingleValue as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.beginTransaction as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.commitTransaction as jest.Mock).mockResolvedValue(undefined);

    const key = await issueKeyService.getNextIssueKey();
    expect(key).toBe('TASK-1');
    expect(mockDbService.ensureTableExists).toHaveBeenCalledWith('Metadata', [{ column: 'last_issue_index', type: 'INTEGER' }]);
    expect(mockDbService.beginTransaction).toHaveBeenCalled();
    expect(mockDbService.getSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index');
    expect(mockDbService.setSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index', 1);
    expect(mockDbService.commitTransaction).toHaveBeenCalled();
  });

  /**
   * @description Tests the handling of the initial case where the last_issue_index is not yet set in the database.
   */
  it('should handle the initial case where last_issue_index is not set', async () => {
    (mockDbService.getSingleValue as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.setSingleValue as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.beginTransaction as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.commitTransaction as jest.Mock).mockResolvedValue(undefined);

    const key = await issueKeyService.getNextIssueKey();
    expect(key).toBe('TASK-1');
    expect(mockDbService.ensureTableExists).toHaveBeenCalledWith('Metadata', [{ column: 'last_issue_index', type: 'INTEGER' }]);
    expect(mockDbService.beginTransaction).toHaveBeenCalled();
    expect(mockDbService.getSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index');
    expect(mockDbService.setSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index', 1);
    expect(mockDbService.commitTransaction).toHaveBeenCalled();
  });

  /**
   * @description Tests transaction rollback on error during data retrieval.
   */
  it('should rollback transaction on error during data retrieval', async () => {
    (mockDbService.getSingleValue as jest.Mock).mockRejectedValue(new Error('Database error'));
    (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.beginTransaction as jest.Mock).mockResolvedValue(undefined);

    await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Database error');
    expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  /**
   * @description Tests transaction rollback on error during data retrieval.
   */
  it('should rollback transaction on error during data update', async () => {
    (mockDbService.getSingleValue as jest.Mock).mockResolvedValue(0);
    (mockDbService.setSingleValue as jest.Mock).mockRejectedValue(new Error('Update error'));
    (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.beginTransaction as jest.Mock).mockResolvedValue(undefined);

    await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Update error');
    expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  /**
   * @description Tests transaction rollback on error during transaction begin.
   */
  it('should handle errors during transaction begin', async () => {
    (mockDbService.beginTransaction as jest.Mock).mockRejectedValue(new Error('Transaction error'));
    (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);

    await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Transaction error');
    expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  /**
   * @description Tests transaction rollback on error during commit.
   */
  it('should handle errors during commit', async () => {
    (mockDbService.commitTransaction as jest.Mock).mockRejectedValue(new Error('Commit error'));
    (mockDbService.getSingleValue as jest.Mock).mockResolvedValue(0);
    (mockDbService.setSingleValue as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.beginTransaction as jest.Mock).mockResolvedValue(undefined);


    await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Commit error');
    expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  /**
   * @description Tests transaction rollback on error during ensureTableExists.
   */
  it('should handle errors during ensureTableExists', async () => {
    (mockDbService.ensureTableExists as jest.Mock).mockRejectedValue(new Error('ensureTableExists error'));
    (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);

    await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('ensureTableExists error');
    expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  it('should rollback transaction when ensureTableExists fails', async () => {
    (mockDbService.ensureTableExists as jest.Mock).mockRejectedValue(new Error('Table creation failed'));
    (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);

    await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Table creation failed');
    expect(mockDbService.ensureTableExists).toHaveBeenCalledWith('Metadata', [{ column: 'last_issue_index', type: 'INTEGER' }]);
    expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
    expect(mockDbService.beginTransaction).not.toHaveBeenCalled();
  });

  it('should rollback transaction when beginTransaction fails', async () => {
      (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);
      (mockDbService.beginTransaction as jest.Mock).mockRejectedValue(new Error('Begin transaction failed'));
      (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);

      await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Begin transaction failed');
      expect(mockDbService.ensureTableExists).toHaveBeenCalledWith('Metadata', [{ column: 'last_issue_index', type: 'INTEGER' }]);
      expect(mockDbService.beginTransaction).toHaveBeenCalled();
      expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  it('should rollback transaction when getSingleValue fails', async () => {
      (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);
      (mockDbService.beginTransaction as jest.Mock).mockResolvedValue(undefined);
      (mockDbService.getSingleValue as jest.Mock).mockRejectedValue(new Error('Get value failed'));
      (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);

      await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Get value failed');
      expect(mockDbService.ensureTableExists).toHaveBeenCalledWith('Metadata', [{ column: 'last_issue_index', type: 'INTEGER' }]);
      expect(mockDbService.beginTransaction).toHaveBeenCalled();
      expect(mockDbService.getSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index');
      expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  it('should rollback transaction when setSingleValue fails', async () => {
      (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);
      (mockDbService.beginTransaction as jest.Mock).mockResolvedValue(undefined);
      (mockDbService.getSingleValue as jest.Mock).mockResolvedValue(0);
      (mockDbService.setSingleValue as jest.Mock).mockRejectedValue(new Error('Set value failed'));
      (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);

      await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Set value failed');
      expect(mockDbService.ensureTableExists).toHaveBeenCalledWith('Metadata', [{ column: 'last_issue_index', type: 'INTEGER' }]);
      expect(mockDbService.beginTransaction).toHaveBeenCalled();
      expect(mockDbService.getSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index');
      expect(mockDbService.setSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index', 1);
      expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  it('should not rollback if commitTransaction fails after successful update (unrealistic scenario, but good to check)', async () => {
        (mockDbService.ensureTableExists as jest.Mock).mockResolvedValue(undefined);
        (mockDbService.beginTransaction as jest.Mock).mockResolvedValue(undefined);
        (mockDbService.getSingleValue as jest.Mock).mockResolvedValue(0);
        (mockDbService.setSingleValue as jest.Mock).mockResolvedValue(undefined);
        (mockDbService.commitTransaction as jest.Mock).mockRejectedValue(new Error('Commit failed'));
        (mockDbService.rollbackTransaction as jest.Mock).mockResolvedValue(undefined);

        await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Commit failed');

        expect(mockDbService.ensureTableExists).toHaveBeenCalled();
        expect(mockDbService.beginTransaction).toHaveBeenCalled();
        expect(mockDbService.getSingleValue).toHaveBeenCalled();
        expect(mockDbService.setSingleValue).toHaveBeenCalled();
        expect(mockDbService.commitTransaction).toHaveBeenCalled();
        expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });
});