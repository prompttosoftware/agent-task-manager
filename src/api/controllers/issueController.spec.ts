import { issueController } from './issueController';
import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db';

// Mock the database connection
jest.mock('../../config/db', () => {
  const mockDb = {
    run: jest.fn((sql: string, params: any, callback: (err: Error | null) => void) => {
      let errVal: Error | null = null;
      let lastID: number | undefined = undefined;
      // Mock implementation for db.run
      if (sql.startsWith('INSERT INTO Issues')) {
        //Simulate successful insertion and return lastID
        // Extract the 'key' from the SQL statement if it exists
        const keyMatch = sql.match(/key\s*=\s*\?.*?\)/i);
        const keyIndex = keyMatch ? sql.indexOf('key') : -1;
        //if the key exist, get the param value
        if(keyIndex > -1) {
           lastID = 999; // Simulate an id for insertion
        }
      } else if (sql.startsWith('UPDATE')) {
        // Simulate successful update
      } else if (sql.startsWith('SELECT')) {
        //do nothing
      } else {
        errVal = new Error('Simulated error'); // Simulate an error if needed
      }
      if (callback) {
        callback(errVal);
      }
    }),
    get: jest.fn((sql: string, params: any, callback: (err: Error | null, row: any) => void) => {
      // Mock implementation for db.get
      let errVal: Error | null = null;
      let rowVal: any = undefined;

      if (sql.includes('SELECT id FROM Issues WHERE key = ?')) {
        const key = params[0];
        if (key === 'PARENT-1') {
          rowVal = { id: 123 }; // Simulate finding the parent
        } else if (key === 'EPIC-1') {
          rowVal = { id: 456 }; // Simulate finding the epic
        } else {
          errVal = new Error('Simulated error'); // Simulate an error if needed
        }
      } else if (sql.includes('SELECT id FROM IssueLinks')) {
        // Do Nothing
      } else {
        errVal = new Error('Simulated error'); // Simulate an error if needed
      }
      if (callback) {
        callback(errVal, rowVal);
      }
    }),
    all: jest.fn((sql: string, params: any, callback: (err: Error | null, rows: any[]) => void) => {
      // Default mock implementation for db.all, can be customized in individual tests
      if (callback) {
        callback(null, []);
      }
    }),
  };

  return { db: mockDb };
});

//Tell typescript that db is not possibly null
const mockDb = (jest.requireMock('../../config/db') as any).db;

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
    mockDb.run.mockClear();
    mockDb.get.mockClear();
    mockDb.all.mockClear();
    (mockResponse.status as jest.Mock).mockClear();
    (mockResponse.json as jest.Mock).mockClear();
    (mockResponse.send as jest.Mock).mockClear();
  });

  it('should create a basic issue', async () => {
    mockRequest.body = {
      fields: {
        issuetype: { name: 'Story' },
        summary: 'Test Issue',
        key: 'ISSUE-1',
      },
    };

    await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({ id: 999 });
    const mockRunArgs = mockDb.run.mock.calls[0][1];
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
        key: 'EPIC-2',
      },
    };

    await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({ id: 999 });
    const mockRunArgs = mockDb.run.mock.calls[0][1];
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
        key: 'SUB-1',
      },
    };

    await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({ id: 999 });
    expect(mockDb.get).toHaveBeenCalledWith(
      'SELECT id FROM Issues WHERE key = ?',
      ['PARENT-1'],
      expect.any(Function)
    );
    const mockRunArgs = mockDb.run.mock.calls[0][1];
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
        key: 'SUB-2',
      },
    };
    mockDb.get.mockImplementationOnce((sql: string, params: any, callback: (err: Error | null, row: any) => void) => {
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
        key: 'STORY-1',
      },
    };

    await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({ id: 999 });
    expect(mockDb.get).toHaveBeenCalledWith(
      'SELECT id FROM Issues WHERE key = ?',
      ['EPIC-1'],
      expect.any(Function)
    );
    const mockRunArgs = mockDb.run.mock.calls[0][1];
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
        key: 'STORY-2',
      },
    };

    mockDb.get.mockImplementationOnce((sql: string, params: any, callback: (err: Error | null, row: any) => void) => {
      callback(null, undefined); // Simulate epic not found
    });

    await issueController.createIssue(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Epic not found or not an Epic type' });
  });
});
