import { IssueKeyService } from './issueKeyService';
import { DatabaseService } from './databaseService';

// Mock the DatabaseService
class MockDatabaseServiceImpl extends DatabaseService {
    constructor() {
      super();
     }

    async run(sql: string, params: any[] = []): Promise<void> {
        return Promise.resolve();
    }
    async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
        return Promise.resolve(undefined);
    }
    async all<T>(sql: string, params: any[] = []): Promise<T[]> {
        return Promise.resolve([]);
    }

    async getSingleValue<T>(tableName: string, key: string): Promise<T | undefined> {
        return Promise.resolve(1 as T);
    }
    async setSingleValue<T>(tableName: string, key: string, value: T): Promise<void> {
        return Promise.resolve();
    }

    async beginTransaction(): Promise<void> {
        return Promise.resolve();
    }
    async commitTransaction(): Promise<void> {
        return Promise.resolve();
    }
    async rollbackTransaction(): Promise<void> {
        return Promise.resolve();
    }
    async ensureTableExists(tableName: string, columns: { column: string; type: string }[]): Promise<void> {
        return Promise.resolve();
    }

    async connect(): Promise<void> {
        return Promise.resolve();
    }
    async disconnect(): Promise<void> {
        return Promise.resolve();
    }


}



describe('IssueKeyService', () => {
    let issueKeyService: IssueKeyService;
    let mockDbService: MockDatabaseServiceImpl;

    beforeEach(() => {
        mockDbService = new MockDatabaseServiceImpl();
        issueKeyService = new IssueKeyService(mockDbService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should generate a new issue key', async () => {
        const mockNextId = 1;
        jest.spyOn(mockDbService, 'getSingleValue').mockResolvedValue(mockNextId);
        jest.spyOn(mockDbService, 'setSingleValue').mockResolvedValue();

        const newKey = await issueKeyService.getNextIssueKey();

        expect(newKey).toBe(`TASK-2`);
        expect(mockDbService.setSingleValue).toHaveBeenCalledWith(
            'Metadata',
            'last_issue_index',
            2
        );
    });
});
