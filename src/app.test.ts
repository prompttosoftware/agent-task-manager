import {
  Task,
  Story,
  Bug,
  Epic,
  Subtask,
  AnyIssue,
  DbSchema,
} from './models/issue';
import { IssueService } from './services/issueService'; // Import IssueService
import { Database } from './db/database'; // Import Database
import request from 'supertest'; // Import supertest
import app from './app'; // Import the Express app instance
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4
import { IssueType } from './models/issue';

describe('Data Model Tests', () => {
  it('should define Task correctly', () => {
    const task: Task = {
      id: 'uuid',
      key: 'PROJECT-5',
      issueType: 'TASK',
      summary: 'Task Summary',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(task.issueType).toBe('TASK');
  });

  it('should define Story correctly', () => {
    const story: Story = {
      id: 'uuid',
      key: 'PROJECT-6',
      issueType: 'STOR',
      summary: 'Story Summary',
      status: 'Done',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(story.issueType).toBe('STOR');
  });

  it('should define Bug correctly', () => {
    const bug: Bug = {
      id: 'uuid',
      key: 'PROJECT-7',
      issueType: 'BUG',
      summary: 'Bug Summary',
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(bug.issueType).toBe('BUG');
  });

  it('should define Epic correctly', () => {
    const epic: Epic = {
      id: 'uuid',
      key: 'PROJECT-8',
      issueType: 'EPIC',
      summary: 'Epic Summary',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(epic.id).toBeDefined();
    expect(typeof epic.id).toBe('string');
    expect(epic.key).toBeDefined();
    expect(typeof epic.key).toBe('string');
    expect(epic.issueType).toBe('EPIC');
    expect(epic.summary).toBeDefined();
    expect(typeof epic.summary).toBe('string');
    expect(epic.status).toBeDefined();
    expect(typeof epic.status).toBe('string');
    expect(epic.createdAt).toBeDefined();
    expect(typeof epic.createdAt).toBe('string');
    expect(epic.updatedAt).toBeDefined();
    expect(typeof epic.updatedAt).toBe('string');
  });

  it('should define Subtask correctly', () => {
    const subtask: Subtask = {
      id: 'uuid',
      key: 'PROJECT-11',
      issueType: 'SUBT',
      summary: 'Subtask Summary',
      status: 'Done',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentIssueKey: 'PROJECT-12',
    };
    expect(subtask.id).toBeDefined();
    expect(typeof subtask.id).toBe('string');
    expect(subtask.key).toBeDefined();
    expect(typeof subtask.key).toBe('string');
    expect(subtask.issueType).toBe('SUBT');
    expect(subtask.summary).toBeDefined();
    expect(typeof subtask.summary).toBe('string');
    expect(subtask.description).toBeUndefined();
    expect(subtask.status).toBeDefined();
    expect(typeof subtask.status).toBe('string');
    expect(subtask.createdAt).toBeDefined();
    expect(typeof subtask.createdAt).toBe('string');
    expect(subtask.updatedAt).toBeDefined();
    expect(typeof subtask.updatedAt).toBe('string');
    expect(subtask.parentIssueKey).toBeDefined();
    expect(typeof subtask.parentIssueKey).toBe('string');
  });

  it('should define AnyIssue correctly', () => {
    const task: AnyIssue = {
      id: 'uuid',
      key: 'PROJECT-13',
      issueType: 'TASK',
      summary: 'AnyIssue Task',
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(task.issueType).toBe('TASK');

    const story: AnyIssue = {
      id: 'uuid',
      key: 'PROJECT-14',
      issueType: 'STOR',
      summary: 'AnyIssue Story',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(story.issueType).toBe('STOR');
  });

  it('should define DbSchema correctly', () => {
    const dbSchema: DbSchema = {
      issues: [],
      issueKeyCounter: { TASK: 0, STOR: 0, EPIC: 0, BUG: 0, SUBT: 0 },
    };
    expect(dbSchema.issues).toBeDefined();
    expect(dbSchema.issueKeyCounter).toBeDefined();
    expect(dbSchema.issueKeyCounter.TASK).toBe(0);
  });
});

// API Endpoint Tests
describe('API Endpoint Tests', () => {
  // Mock the IssueService dependency for API tests
  let issueServiceMock: jest.Mocked<IssueService>; // Use Mocked<IssueService>
  let databaseMock: jest.Mocked<Database>;

  beforeEach(() => {
    // Mock the Database and its methods
    databaseMock = {
        getNextIssueId: jest.fn().mockImplementation(async (issueType: IssueType) => {
          const issueKeyCounter = { TASK: 0, STOR: 0, EPIC: 0, BUG: 0, SUBT: 0 };
          return issueKeyCounter[issueType] + 1;
        }),
        addIssue: jest.fn(),
        getIssues: jest.fn(),
    } as jest.Mocked<Database>;


    // Mock the IssueService constructor
    issueServiceMock = { // Correctly mock the IssueService
      createIssue: jest.fn(),
    } as jest.Mocked<IssueService>;

    // Override the IssueService to use the mock
    jest.mock('./services/issueService', () => ({
      IssueService: jest.fn().mockImplementation(() => issueServiceMock),
    }));

    jest.mock('./db/database', () => ({
      Database: jest.fn().mockImplementation(() => databaseMock),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks(); // Clear mocks after each test
    jest.resetModules(); // Resets modules for new tests
  });

  // Test for POST /rest/api/2/issue
  it('POST /rest/api/2/issue should return 201 and Content-Type JSON', async () => {
    const validIssueData = {
      fields: {
        summary: "Test Task Issue",
        issuetype: { name: "TASK" },
        status: "Todo",
        description: "This is a test description."
      }
    };

    // Mock the IssueService.createIssue call for this specific test
    const mockIssue: AnyIssue = {
        id: uuidv4(),
        key: 'TASK-1',
        issueType: 'TASK',
        summary: validIssueData.fields.summary,
        description: validIssueData.fields.description,
        status: 'Todo',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
    };
    issueServiceMock.createIssue.mockResolvedValue(mockIssue);


    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(validIssueData);

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toEqual(mockIssue); // Use toEqual for object comparison
    expect(issueServiceMock.createIssue).toHaveBeenCalledTimes(1);
    expect(issueServiceMock.createIssue).toHaveBeenCalledWith(expect.objectContaining({ // Verify arguments passed to service
        issueType: 'TASK',
        summary: validIssueData.fields.summary,
        description: validIssueData.fields.description,
        status: validIssueData.fields.status,
    }));
    expect(response.body.id).toBeDefined();
    expect(response.body.key).toBe('TASK-1');
    expect(response.body.issueType).toBe('TASK');
    expect(response.body.summary).toBe(validIssueData.fields.summary);
    expect(response.body.description).toBe(validIssueData.fields.description);
    expect(response.body.status).toBe('Todo');
    expect(typeof response.body.createdAt).toBe('string');
    expect(typeof response.body.updatedAt).toBe('string');
  });

  it('POST /rest/api/2/issue should return 400 if fields is missing', async () => {
    const issueDataMissingFields = {
      summary: "Test Issue",
      issueType: "TASK",
      status: "Todo"
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataMissingFields);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields');
    expect(issueServiceMock.createIssue).not.toHaveBeenCalled(); // Service should not be called on bad request
  });

  it('POST /rest/api/2/issue should return 400 if summary is missing within fields', async () => {
    const issueDataMissingSummary = {
      fields: {
        issueType: "TASK",
        status: "Todo"
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataMissingSummary);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.summary');
    expect(issueServiceMock.createIssue).not.toHaveBeenCalled();
  });

  it('POST /rest/api/2/issue should return 400 if issueType is missing within fields', async () => {
    const issueDataMissingIssueType = {
      fields: {
        summary: "Test Issue",
        status: "Todo"
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataMissingIssueType);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.issuetype.name');
    expect(issueServiceMock.createIssue).not.toHaveBeenCalled();
  });

  it('POST /rest/api/2/issue should return 400 if status is missing within fields', async () => {
    const issueDataMissingStatus = {
      fields: {
        summary: "Test Issue",
        issuetype: { name: "TASK" }
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataMissingStatus);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.status');
    expect(issueServiceMock.createIssue).not.toHaveBeenCalled();
  });

  it('POST /rest/api/2/issue should return 400 if summary is empty', async () => {
    const issueDataEmptySummary = {
      fields: {
        summary: "",
        issuetype: { name: "TASK" },
        status: "Todo"
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataEmptySummary);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.summary');
    expect(issueServiceMock.createIssue).not.toHaveBeenCalled();
  });

  it('POST /rest/api/2/issue should return 400 if issueType name is empty', async () => {
    const issueDataEmptyIssueType = {
      fields: {
        summary: "Test Issue",
        issuetype: { name: "" },
        status: "Todo"
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataEmptyIssueType);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.issuetype.name');
    expect(issueServiceMock.createIssue).not.toHaveBeenCalled();
  });

  it('POST /rest/api/2/issue should return 400 if issueType name is invalid', async () => {
    const issueDataInvalidIssueType = {
      fields: {
        summary: "Test Issue",
        issuetype: { name: "INVALID" },
        status: "Todo"
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataInvalidIssueType);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid issue type');
    expect(issueServiceMock.createIssue).not.toHaveBeenCalled();
  });

  it('POST /rest/api/2/issue should return 400 if parentIssueKey is missing for SUBT issueType', async () => {
    const subtaskDataMissingParent = {
      fields: {
        summary: "Test Subtask",
        issuetype: { name: "SUBT" },
        status: "Todo"
        // parentIssueKey is missing
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(subtaskDataMissingParent);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.parentIssueKey for subtask');
    expect(issueServiceMock.createIssue).not.toHaveBeenCalled();
  });

  it('POST /rest/api/2/issue should create a SUBT issue successfully with parentIssueKey', async () => {
    const subtaskDataValid = {
      fields: {
        summary: "Test Subtask with Parent",
        issuetype: { name: "SUBT" },
        status: "Todo",
        parentIssueKey: "PROJECT-1"
      }
    };

     // Mock the IssueService.createIssue call for this specific test
     const mockIssue: AnyIssue = {
        id: uuidv4(),
        key: 'SUBT-1',
        issueType: 'SUBT',
        summary: subtaskDataValid.fields.summary,
        description: undefined, // Assuming no description for this test
        status: 'Todo',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        parentIssueKey: subtaskDataValid.fields.parentIssueKey,
    };
    issueServiceMock.createIssue.mockResolvedValue(mockIssue);


    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(subtaskDataValid);

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toEqual(mockIssue); // Use toEqual for object comparison
    expect(issueServiceMock.createIssue).toHaveBeenCalledTimes(1);
    expect(issueServiceMock.createIssue).toHaveBeenCalledWith(expect.objectContaining({ // Verify arguments passed to service
        issueType: 'SUBT',
        summary: subtaskDataValid.fields.summary,
        description: undefined, // Assuming no description for this test
        status: subtaskDataValid.fields.status,
        parentIssueKey: subtaskDataValid.fields.parentIssueKey
    }));
    expect(response.body.id).toBeDefined();
    expect(response.body.key).toBe('SUBT-1');
    expect(response.body.issueType).toBe('SUBT');
    expect(response.body.summary).toBe(subtaskDataValid.fields.summary);
    expect(response.body.status).toBe(subtaskDataValid.fields.status);
    expect(response.body.parentIssueKey).toBe(subtaskDataValid.fields.parentIssueKey);
    expect(typeof response.body.createdAt).toBe('string');
    expect(typeof response.body.updatedAt).toBe('string');
  });


  it('POST /rest/api/2/issue should return 400 with validation errors if service returns errors', async () => {
    const invalidIssueData = {
      fields: {
        summary: "", // Invalid: missing summary
        issuetype: { name: "TASK" },
        status: "Todo"
      }
    };

    // Mock the IssueService.createIssue call to return validation errors
    const validationErrors = ['Summary is required'];
    issueServiceMock.createIssue.mockResolvedValue(validationErrors);


    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual(validationErrors);
    expect(issueServiceMock.createIssue).toHaveBeenCalledTimes(1); // Service should still be called
  });

  it('POST /rest/api/2/issue should return 500 if service throws an unexpected error', async () => {
    const validIssueData = {
      fields: {
        summary: "Test Task Issue",
        issuetype: { name: "TASK" },
        status: "Todo",
        description: "This is a test description."
      }
    };

    // Mock the IssueService.createIssue call to throw an error
    const errorMessage = 'Database connection failed';
    issueServiceMock.createIssue.mockRejectedValue(new Error(errorMessage));


    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(validIssueData);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', errorMessage);
    expect(issueServiceMock.createIssue).toHaveBeenCalledTimes(1); // Service should still be called
  });
});
