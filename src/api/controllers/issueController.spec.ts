import { issueController } from '../../src/api/controllers/issueController';
import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/config/db';

// Mock the database connection
jest.mock('../../src/config/db', () => {
    const mockDb = {
        run: jest.fn((sql: string, params: any[], callback: (err: Error | null) => void) => {
            // Mock implementation for db.run
            if (sql.startsWith('INSERT INTO Issues')) {
                //Simulate successful insertion and return lastID
                callback(null);
            } else if (sql.startsWith('UPDATE')) {
                 // Simulate successful update
                 callback(null);
            } else {
                callback(new Error('Simulated error')); // Simulate an error if needed
            }
        }),
        get: jest.fn((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
            // Mock implementation for db.get
            if (sql.includes('SELECT id FROM Issues WHERE key = ?')) {
                const key = params[0];
                let row;
                if (key === 'PARENT-1') {
                    row = { id: 123 }; // Simulate finding the parent
                } else if (key === 'EPIC-1') {
                    row = { id: 456 }; // Simulate finding the epic
                }
                callback(null, row);
            } else if (sql.includes('SELECT id FROM IssueLinks')) {
                callback(null, undefined);
            } else {
                callback(new Error('Simulated error')); // Simulate an error if needed
            }
        }),
        all: jest.fn() // Add mock implementation for db.all if needed
    };
    return { db: mockDb };
});

describe('issueController.createIssue', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock<NextFunction>;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };
        mockNext = jest.fn();

        // Reset mock implementations before each test
        (db.run as jest.Mock).mockClear();
        (db.get as jest.Mock).mockClear();
        (mockResponse.status as jest.Mock).mockClear();
        (mockResponse.json as jest.Mock).mockClear();
        (mockResponse.send as jest.Mock).mockClear();

    });

    it('should create a basic issue', async () => {
        mockRequest.body = {
            fields: {
                issuetype: { name: 'Story' },
                summary: 'Test Issue',
                key: 'ISSUE-1'
            },
        };

        await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({ id: undefined }); // Assuming lastID is undefined in the mock
        const mockRunArgs = (db.run as jest.Mock).mock.calls[0][1];
        expect(mockRunArgs[0]).toBe('Test Issue'); //Verify title
        expect(mockRunArgs[1]).toBe('Story'); //Verify issue type
        expect(mockRunArgs[4]).toBeNull(); //Verify parentId
        expect(mockRunArgs[5]).toBe('ISSUE-1'); //Verify key
    });

    it('should create an Epic issue and verify epic_name is saved', async () => {
        mockRequest.body = {
            fields: {
                issuetype: { name: 'Epic' },
                summary: 'Test Epic',
                customfield_10011: 'My Epic Name',
                key: 'EPIC-2'
            },
        };

        await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({ id: undefined });
        const mockRunArgs = (db.run as jest.Mock).mock.calls[0][1];
        expect(mockRunArgs[0]).toBe('Test Epic'); //Verify title
        expect(mockRunArgs[1]).toBe('Epic'); //Verify issue type
        expect(mockRunArgs[2]).toBe('My Epic Name'); //Verify epic_name
        expect(mockRunArgs[4]).toBeNull(); //Verify parentId
        expect(mockRunArgs[5]).toBe('EPIC-2'); //Verify key
    });

    it('should create a Subtask, verifying parent_id is set correctly', async () => {
        mockRequest.body = {
            fields: {
                issuetype: { name: 'Subtask' },
                summary: 'Test Subtask',
                parent: { key: 'PARENT-1' },
                key: 'SUB-1'
            },
        };

        await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({ id: undefined });
        expect((db.get as jest.Mock)).toHaveBeenCalledWith(
            'SELECT id FROM Issues WHERE key = ?',
            ['PARENT-1'],
            expect.any(Function)
        );
        const mockRunArgs = (db.run as jest.Mock).mock.calls[0][1];
        expect(mockRunArgs[0]).toBe('Test Subtask'); //Verify title
        expect(mockRunArgs[1]).toBe('Subtask'); //Verify issue type
        expect(mockRunArgs[4]).toBe(123); //Verify parentId
        expect(mockRunArgs[5]).toBe('SUB-1'); //Verify key
    });

    it('should throw an error if the parent is not found when creating a Subtask', async () => {
        mockRequest.body = {
            fields: {
                issuetype: { name: 'Subtask' },
                summary: 'Test Subtask',
                parent: { key: 'NONEXISTENT-PARENT' },
                key: 'SUB-2'
            },
        };
        (db.get as jest.Mock).mockImplementationOnce((sql, params, callback) => {
            callback(null, undefined); // Simulate parent not found
        });

        await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Parent issue not found' });
    });

    it('should create an issue with an Epic Link, verifying epic_id is set correctly', async () => {
        mockRequest.body = {
            fields: {
                issuetype: { name: 'Story' },
                summary: 'Test Story with Epic Link',
                customfield_10010: 'EPIC-1',
                key: 'STORY-1'
            },
        };

        await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({ id: undefined });
        expect((db.get as jest.Mock)).toHaveBeenCalledWith(
            'SELECT id FROM Issues WHERE key = ?',
            ['EPIC-1'],
            expect.any(Function)
        );
        const mockRunArgs = (db.run as jest.Mock).mock.calls[0][1];
        expect(mockRunArgs[0]).toBe('Test Story with Epic Link'); //Verify title
        expect(mockRunArgs[1]).toBe('Story'); //Verify issue type
        expect(mockRunArgs[3]).toBe(456); //Verify epic_id
        expect(mockRunArgs[5]).toBe('STORY-1'); //Verify key
    });

    it('should throw an error if the Epic is not found when creating an issue with an Epic Link', async () => {
       mockRequest.body = {
            fields: {
                issuetype: { name: 'Story' },
                summary: 'Test Story with Epic Link',
                customfield_10010: 'NONEXISTENT-EPIC',
                key: 'STORY-2'
            },
        };

        (db.get as jest.Mock).mockImplementationOnce((sql, params, callback) => {
            callback(null, undefined); // Simulate epic not found
        });

        await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Epic not found or not an Epic type' });
    });
});
