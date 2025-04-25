import { DatabaseService } from './databaseService';
import { Pool, PoolClient } from 'pg';

jest.mock('pg', () => {
    const mPool = {
        connect: jest.fn(),
        end: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('DatabaseService', () => {
    let databaseService: DatabaseService;
    let mockPool: jest.Mocked<Pool>;

    beforeEach(() => {
        databaseService = new DatabaseService();
        mockPool = new Pool() as jest.Mocked<Pool>; // Type assertion to Mocked<Pool>

        process.env.DB_USER = 'test_user';
        process.env.DB_HOST = 'test_host';
        process.env.DB_NAME = 'test_db';
        process.env.DB_PASSWORD = 'test_password';
        process.env.DB_PORT = '5432';
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.DB_USER;
        delete process.env.DB_HOST;
        delete process.env.DB_NAME;
        delete process.env.DB_PASSWORD;
        delete process.env.DB_PORT;
    });

    describe('connect', () => {
        it('should connect to the database', async () => {
            await databaseService.connect();
            expect(Pool).toHaveBeenCalledTimes(1);
        });

        it('should handle connection errors', async () => {
            (Pool as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Connection failed');
            });

            await expect(databaseService.connect()).rejects.toThrow('Connection failed');
        });
    });

    describe('disconnect', () => {
        it('should disconnect from the database', async () => {
            databaseService['pool'] = mockPool;
            await databaseService.disconnect();
            expect(mockPool.end).toHaveBeenCalled();
            expect(databaseService['pool']).toBeNull();
        });

        it('should not attempt to disconnect if not connected', async () => {
            await databaseService.disconnect();
            expect(mockPool.end).not.toHaveBeenCalled();
        });
    });

    describe('run', () => {
        it('should execute an SQL query', async () => {
            const mockClient = { query: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const sql = 'SELECT * FROM test_table';
            const params = [1, 'test'];
            await databaseService.run(sql, params);
            expect(mockPool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith(sql, params);
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should handle errors during query execution', async () => {
            const mockClient = { query: jest.fn().mockRejectedValue(new Error('Query failed')), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const sql = 'SELECT * FROM test_table';
            await expect(databaseService.run(sql)).rejects.toThrow('Query failed');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should throw an error if not connected', async () => {
            const sql = 'SELECT * FROM test_table';
            await expect(databaseService.run(sql)).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('get', () => {
        it('should retrieve a single row', async () => {
            const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ id: 1, name: 'test' }] }), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const sql = 'SELECT * FROM test_table WHERE id = $1';
            const params = [1];
            const result = await databaseService.get(sql, params);
            expect(mockPool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith(sql, params);
            expect(result).toEqual({ id: 1, name: 'test' });
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should return undefined if no row is found', async () => {
            const mockClient = { query: jest.fn().mockResolvedValue({ rows: [] }), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const sql = 'SELECT * FROM test_table WHERE id = $1';
            const params = [1];
            const result = await databaseService.get(sql, params);
            expect(result).toBeUndefined();
        });

        it('should handle errors during query execution', async () => {
            const mockClient = { query: jest.fn().mockRejectedValue(new Error('Query failed')), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const sql = 'SELECT * FROM test_table WHERE id = $1';
            const params = [1];
            await expect(databaseService.get(sql, params)).rejects.toThrow('Query failed');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should throw an error if not connected', async () => {
            const sql = 'SELECT * FROM test_table WHERE id = $1';
            const params = [1];
            await expect(databaseService.get(sql, params)).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('all', () => {
        it('should retrieve all rows', async () => {
            const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }] }), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const sql = 'SELECT * FROM test_table';
            const result = await databaseService.all(sql);
            expect(mockPool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith(sql, []);
            expect(result).toEqual([{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]);
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should return an empty array if no rows are found', async () => {
            const mockClient = { query: jest.fn().mockResolvedValue({ rows: [] }), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const sql = 'SELECT * FROM test_table';
            const result = await databaseService.all(sql);
            expect(result).toEqual([]);
        });

        it('should handle errors during query execution', async () => {
            const mockClient = { query: jest.fn().mockRejectedValue(new Error('Query failed')), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const sql = 'SELECT * FROM test_table';
            await expect(databaseService.all(sql)).rejects.toThrow('Query failed');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should throw an error if not connected', async () => {
            const sql = 'SELECT * FROM test_table';
            await expect(databaseService.all(sql)).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('ensureTableExists', () => {
        it('should create a table if it does not exist', async () => {
            const mockRun = jest.fn().mockResolvedValue(undefined);
            databaseService.run = mockRun;
            databaseService['pool'] = mockPool;
            const tableName = 'test_table';
            const columns = [{ column: 'id', type: 'INTEGER PRIMARY KEY' }, { column: 'name', type: 'TEXT' }];
            await databaseService.ensureTableExists(tableName, columns);
            expect(mockRun).toHaveBeenCalledWith(`CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY, name TEXT)`);
        });

        it('should throw an error if not connected', async () => {
            const tableName = 'test_table';
            const columns = [{ column: 'id', type: 'INTEGER PRIMARY KEY' }, { column: 'name', type: 'TEXT' }];
            await expect(databaseService.ensureTableExists(tableName, columns)).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('getSingleValue', () => {
        it('should retrieve a single value from a table', async () => {
            const mockGet = jest.fn().mockResolvedValue({ value: 'test_value' });
            databaseService.get = mockGet;
            databaseService['pool'] = mockPool;

            const tableName = 'test_table';
            const key = 'test_key';
            const result = await databaseService.getSingleValue(tableName, key);

            expect(mockGet).toHaveBeenCalledWith(`SELECT value FROM ${tableName} WHERE key = $1`, [key]);
            expect(result).toBe('test_value');
        });

        it('should return undefined if the value is not found', async () => {
            const mockGet = jest.fn().mockResolvedValue(undefined);
            databaseService.get = mockGet;
            databaseService['pool'] = mockPool;

            const tableName = 'test_table';
            const key = 'test_key';
            const result = await databaseService.getSingleValue(tableName, key);

            expect(mockGet).toHaveBeenCalledWith(`SELECT value FROM ${tableName} WHERE key = $1`, [key]);
            expect(result).toBeUndefined();
        });

        it('should throw an error if not connected', async () => {
            const tableName = 'test_table';
            const key = 'test_key';
            await expect(databaseService.getSingleValue(tableName, key)).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('setSingleValue', () => {
        it('should update an existing value in the table', async () => {
            const mockClient = {
                query: jest.fn().mockResolvedValue({ rowCount: 1 }),
                release: jest.fn(),
            };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const tableName = 'test_table';
            const key = 'test_key';
            const value = 'new_value';

            await databaseService.setSingleValue(tableName, key, value);

            expect(mockClient.query).toHaveBeenCalledWith(`UPDATE ${tableName} SET value = $1 WHERE key = $2`, [value, key]);
            expect(mockClient.release).toHaveBeenCalled();

        });

        it('should insert a new value into the table if it does not exist', async () => {
            const mockClient = {
                query: jest.fn()
                    .mockResolvedValueOnce({ rowCount: 0 }) // Simulate no update
                    .mockResolvedValueOnce(undefined),        // Simulate successful insert
                release: jest.fn(),
            };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            const tableName = 'test_table';
            const key = 'test_key';
            const value = 'new_value';

            await databaseService.setSingleValue(tableName, key, value);

            expect(mockClient.query).toHaveBeenCalledWith(`UPDATE ${tableName} SET value = $1 WHERE key = $2`, [value, key]);
            expect(mockClient.query).toHaveBeenCalledWith(`INSERT INTO ${tableName} (key, value) VALUES ($1, $2)`, [key, value]);
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should throw an error if not connected', async () => {
            const tableName = 'test_table';
            const key = 'test_key';
            const value = 'new_value';
            await expect(databaseService.setSingleValue(tableName, key, value)).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('beginTransaction', () => {
        it('should begin a transaction', async () => {
            const mockClient = { query: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            await databaseService.beginTransaction();
            expect(mockPool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should throw an error if not connected', async () => {
            await expect(databaseService.beginTransaction()).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('commitTransaction', () => {
        it('should commit a transaction', async () => {
            const mockClient = { query: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            await databaseService.commitTransaction();
            expect(mockPool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should throw an error if not connected', async () => {
            await expect(databaseService.commitTransaction()).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('rollbackTransaction', () => {
        it('should rollback a transaction', async () => {
            const mockClient = { query: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            databaseService['pool'] = mockPool;
            await databaseService.rollbackTransaction();
            expect(mockPool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should throw an error if not connected', async () => {
            await expect(databaseService.rollbackTransaction()).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });
});