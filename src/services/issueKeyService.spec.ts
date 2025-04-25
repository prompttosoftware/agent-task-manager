import { IssueKeyService } from './issueKeyService';
import { DatabaseService } from './databaseService';

jest.mock('./databaseService');

describe('IssueKeyService', () => {
  let issueKeyService: IssueKeyService;
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    const MockDatabaseService = DatabaseService as jest.Mock<DatabaseService>;
    mockDbService = new MockDatabaseService() as jest.Mocked<DatabaseService>;
    issueKeyService = new IssueKeyService(mockDbService);
  });

  it('should generate the next issue key', async () => {
    (mockDbService.getSingleValue as jest.Mock).mockResolvedValue(0);
    (mockDbService.setSingleValue as jest.Mock).mockResolvedValue(undefined);

    const key = await issueKeyService.getNextIssueKey();
    expect(key).toBe('TASK-1');
    expect(mockDbService.ensureTableExists).toHaveBeenCalledWith('Metadata', [{ column: 'last_issue_index', type: 'INTEGER' }]);
    expect(mockDbService.beginTransaction).toHaveBeenCalled();
    expect(mockDbService.getSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index');
    expect(mockDbService.setSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index', 1);
    expect(mockDbService.commitTransaction).toHaveBeenCalled();
  });

  it('should handle the initial case where last_issue_index is not set', async () => {
    (mockDbService.getSingleValue as jest.Mock).mockResolvedValue(undefined);
    (mockDbService.setSingleValue as jest.Mock).mockResolvedValue(undefined);

    const key = await issueKeyService.getNextIssueKey();
    expect(key).toBe('TASK-1');
    expect(mockDbService.ensureTableExists).toHaveBeenCalledWith('Metadata', [{ column: 'last_issue_index', type: 'INTEGER' }]);
    expect(mockDbService.beginTransaction).toHaveBeenCalled();
    expect(mockDbService.getSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index');
    expect(mockDbService.setSingleValue).toHaveBeenCalledWith('Metadata', 'last_issue_index', 1);
    expect(mockDbService.commitTransaction).toHaveBeenCalled();
  });

  it('should rollback transaction on error', async () => {
    (mockDbService.getSingleValue as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Database error');
    expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  it('should handle errors during transaction', async () => {
    (mockDbService.beginTransaction as jest.Mock).mockRejectedValue(new Error('Transaction error'));

    await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Transaction error');
    expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });
  
  it('should handle errors during commit', async () => {
      (mockDbService.commitTransaction as jest.Mock).mockRejectedValue(new Error('Commit error'));
      (mockDbService.getSingleValue as jest.Mock).mockResolvedValue(0);
      (mockDbService.setSingleValue as jest.Mock).mockResolvedValue(undefined);

      await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('Commit error');
      expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });

  it('should handle errors during ensureTableExists', async () => {
      (mockDbService.ensureTableExists as jest.Mock).mockRejectedValue(new Error('ensureTableExists error'));

      await expect(issueKeyService.getNextIssueKey()).rejects.toThrow('ensureTableExists error');
      expect(mockDbService.rollbackTransaction).toHaveBeenCalled();
  });
});
