/*
    How to use createMockDbConnection in tests (e.g., databaseService.spec.ts):

    import { jest } from '@jest/globals';
    import { DatabaseService } from '../services/databaseService';
    import { getDBConnection, IDatabaseConnection } from '../config/db';
    import { createMockDbConnection } from '../mocks/dbconnection.mock'; // Import the mock creator

    // Mock the module that provides the connection
    jest.mock('../config/db', () => ({
        ...jest.requireActual('../config/db'), // Keep actual parts if needed
        getDBConnection: jest.fn(), // Mock the function that returns the connection
        closeDBConnection: jest.fn().mockResolvedValue(undefined),
    }));

    // Type assertion for the mocked function
    const mockGetDBConnection = getDBConnection as jest.Mock;

    describe('DatabaseService (using IDatabaseConnection Mock)', () => {
        let databaseService: DatabaseService;
        let mockDb: jest.Mocked<IDatabaseConnection>;

        beforeEach(async () => {
            // Create a fresh mock for IDatabaseConnection
            mockDb = createMockDbConnection();

            // Configure getDBConnection to return this mock
            // THIS ASSUMES DatabaseService IS REFACTORED TO USE IDatabaseConnection
            mockGetDBConnection.mockResolvedValue(mockDb);

            databaseService = new DatabaseService();

            // Reset mocks before test
            jest.clearAllMocks();
            // Reconfigure getDBConnection for the connect call
            mockGetDBConnection.mockResolvedValue(mockDb);

            // Connect the service (which should now use the mockDb)
            await databaseService.connect();

            // Clear mocks called during connect if necessary
            mockDb.run.mockClear(); // e.g., if connect runs PRAGMAs
        });

        it('setSingleValue should call run (example assuming UPSERT refactor)', async () => {
            const tableName = 'settings';
            const key = 'theme';
            const value = 'dark';

            // Configure the mock run method for this test if needed
            mockDb.run.mockResolvedValue(undefined); // Default is usually fine

            await databaseService.setSingleValue(tableName, key, value);

            expect(mockDb.run).toHaveBeenCalledTimes(1);
            // Add specific checks for SQL and params based on the expected implementation
            // e.g., expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('INSERT'), [key, value]);
        });

        it('getSingleValue should call get', async () => {
            const tableName = 'settings';
            const key = 'theme';
            const mockResult = { value: 'light' };

            // Configure the mock get method
            // Since mockDb.get is a generic function mock, specify the type for this call
            // The mock implementation itself doesn't need to be generic here because mockResolvedValue handles it.
            // When calling mockResolvedValue, provide the specific type for this test scenario.
             mockDb.get.mockResolvedValue(mockResult);


            const result = await databaseService.getSingleValue<{ value: string }>(tableName, key); // Assume service method is generic too

            expect(mockDb.get).toHaveBeenCalledTimes(1);
            // If the service passes the generic type down, the mock call will implicitly use it.
            // You can assert the call signature without generics usually:
            expect(mockDb.get).toHaveBeenCalledWith(`SELECT value FROM ${tableName} WHERE key = ?`, [key]);
            expect(result).toBe(mockResult.value);
        });

         it('getSingleValue should return undefined if get finds nothing', async () => {
            const tableName = 'settings';
            const key = 'theme';

            // Configure the mock get method to return undefined (its default setup via mockResolvedValue(undefined))
            mockDb.get.mockResolvedValue(undefined);

            const result = await databaseService.getSingleValue(tableName, key);

            expect(mockDb.get).toHaveBeenCalledTimes(1);
            expect(mockDb.get).toHaveBeenCalledWith(`SELECT value FROM ${tableName} WHERE key = ?`, [key]);
            expect(result).toBeUndefined();
        });

        it('getAllValues should call all', async () => {
             const tableName = 'settings';
             const mockResults = [{ key: 'theme', value: 'dark' }, { key: 'fontSize', value: '12' }];

             // Configure the mock all method
             // When calling mockResolvedValue, provide the specific type for this test scenario.
             mockDb.all.mockResolvedValue(mockResults);


             const results = await databaseService.getAllValues<{ key: string, value: any }>(tableName); // Assuming a generic service method

             expect(mockDb.all).toHaveBeenCalledTimes(1);
             expect(mockDb.all).toHaveBeenCalledWith(`SELECT key, value FROM ${tableName}`, []); // Assuming no params
             expect(results).toEqual(mockResults);
         });

          it('getAllValues should return empty array if all finds nothing', async () => {
             const tableName = 'settings';

             // Configure the mock all method to return empty array (its default setup via mockResolvedValue([]))
             mockDb.all.mockResolvedValue([]);

             const results = await databaseService.getAllValues(tableName);

             expect(mockDb.all).toHaveBeenCalledTimes(1);
             expect(mockDb.all).toHaveBeenCalledWith(`SELECT key, value FROM ${tableName}`, []); // Assuming no params
             expect(results).toEqual([]);
         });
    });

    NOTE: To test the *current* DatabaseService.setSingleValue which incorrectly uses the native
    sqlite3 'run' callback with `this.changes`, you would need to mock getDBConnection to return
    a mock *native* database object (like MockNativeDatabase or a custom jest.fn object with the
    native mock functions assigned), not the IDatabaseConnection mock. See thoughts for details.
*/