import {
  Task,
  Story,
  Bug,
  Epic,
  Subtask,
  AnyIssue,
  DbSchema,
} from './models/issue';

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
    expect(task.issueType).toBe('TASK'); // Corrected issue type
  });

  it('should define Story correctly', () => {
    const story: Story = {
      id: 'uuid',
      key: 'PROJECT-6',
      issueType: 'STOR', // Corrected issue type
      summary: 'Story Summary',
      status: 'Done',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(story.issueType).toBe('STOR'); // Corrected issue type
  });

  it('should define Bug correctly', () => {
    const bug: Bug = {
      id: 'uuid',
      key: 'PROJECT-7',
      issueType: 'BUG', // Corrected issue type
      summary: 'Bug Summary',
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(bug.issueType).toBe('BUG'); // Corrected issue type
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
    expect(typeof epic.status).toBe('string'); // Could add more specific status check if needed
    expect(epic.createdAt).toBeDefined();
    expect(typeof epic.createdAt).toBe('string');
    expect(epic.updatedAt).toBeDefined();
    expect(typeof epic.updatedAt).toBe('string');
  });

  it('should define Subtask correctly', () => {
    const subtask: Subtask = {
      id: 'uuid',
      key: 'PROJECT-11',
      issueType: 'SUBT', // Corrected issue type
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
    expect(subtask.issueType).toBe('SUBT'); // Corrected issue type
    expect(subtask.summary).toBeDefined();
    expect(typeof subtask.summary).toBe('string');
    expect(subtask.description).toBeUndefined(); // Description is optional and not provided
    expect(subtask.status).toBeDefined();
    expect(typeof subtask.status).toBe('string'); // Could add more specific status check if needed
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
      issueType: 'TASK', // Corrected issue type
      summary: 'AnyIssue Task',
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(task.issueType).toBe('TASK'); // Corrected issue type

    const story: AnyIssue = {
      id: 'uuid',
      key: 'PROJECT-14',
      issueType: 'STOR', // Corrected issue type
      summary: 'AnyIssue Story',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(story.issueType).toBe('STOR'); // Corrected issue type
  });

  it('should define DbSchema correctly', () => {
    const dbSchema: DbSchema = {
      issues: [],
      issueKeyCounter: 0,
    };
    expect(dbSchema.issues).toBeDefined();
    expect(dbSchema.issueKeyCounter).toBe(0);
  });
});

import request from 'supertest'; // Import supertest
import app from './app'; // Import the Express app instance

// API Endpoint Tests
describe('API Endpoint Tests', () => {
  // Test for POST /rest/api/2/issue
  // This test is simplified to check basic POST request handling,
  // specifically status code 201 and JSON content type.
  it('POST /rest/api/2/issue should return 201 and Content-Type JSON', async () => {
    // Send a basic issue creation request in Jira-like format
    const basicIssue = {
      fields: { // Wrap fields in 'fields' property
        summary: "Basic Test Issue",
        issuetype: { name: "TASK" }, // Modified to match controller expectation
        status: "Todo",
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(basicIssue);

    // Assert status code and content type
    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/json/);
    // Optional: Add basic checks for response body format
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('key');
    expect(response.body).toHaveProperty('summary', basicIssue.fields.summary);
    expect(response.body).toHaveProperty('issueType', basicIssue.fields.issuetype.name); // Assert against the name property
    expect(response.body).toHaveProperty('status', basicIssue.fields.status);
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  // Add more API tests here as needed for other endpoints
  // e.g., GET /rest/api/2/issue/{issueIdOrKey}, PUT, DELETE, etc.

  // Detailed tests for POST /rest/api/2/issue
  it('POST /rest/api/2/issue should create a task issue successfully with valid fields', async () => {
    const validIssueData = {
      fields: {
        summary: "Test Task Issue",
        issuetype: { name: "TASK" }, // Modified to match controller expectation
        status: "Todo",
        description: "This is a test description."
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(validIssueData);

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('key');
    expect(response.body.summary).toBe(validIssueData.fields.summary);
    expect(response.body.issueType).toBe(validIssueData.fields.issuetype.name); // Assert against the name property
    expect(response.body.status).toBe(validIssueData.fields.status);
    expect(response.body.description).toBe(validIssueData.fields.description);
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
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
    expect(response.body).toHaveProperty('error', 'Required field fields.summary cannot be empty');
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
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.issuetype'); // Error message updated
  });

  it('POST /rest/api/2/issue should return 400 if status is missing within fields', async () => {
    const issueDataMissingStatus = {
      fields: {
        summary: "Test Issue",
        issuetype: { name: "TASK" } // Modified to match controller expectation
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataMissingStatus);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.status');
  });

  it('POST /rest/api/2/issue should return 400 if summary is empty', async () => {
    const issueDataEmptySummary = {
      fields: {
        summary: "", // Empty summary
        issuetype: { name: "TASK" }, // Modified to match controller expectation
        status: "Todo"
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataEmptySummary);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Required field fields.summary cannot be empty');
  });

  it('POST /rest/api/2/issue should return 400 if issueType is empty', async () => {
    const issueDataEmptyIssueType = {
      fields: {
        summary: "Test Issue",
        issuetype: { name: "" }, // Modified to match controller expectation
        status: "Todo"
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataEmptyIssueType);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.issuetype.name'); // Error message updated
  });

  it('POST /rest/api/2/issue should return 400 if issueType is invalid', async () => {
    const issueDataInvalidIssueType = {
      fields: {
        summary: "Test Issue",
        issuetype: { name: "INVALID" }, // Modified to match controller expectation
        status: "Todo"
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueDataInvalidIssueType);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid issueType. Must be one of: TASK, STOR, EPIC, BUG, SUBT');
  });

  it('POST /rest/api/2/issue should return 400 if parentIssueKey is missing for SUBT issueType', async () => {
    const subtaskDataMissingParent = {
      fields: {
        summary: "Test Subtask",
        issuetype: { name: "SUBT" }, // Modified to match controller expectation
        status: "Todo"
        // parentIssueKey is missing
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(subtaskDataMissingParent);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.parentIssueKey for subtask');
  });

  it('POST /rest/api/2/issue should create a SUBT issue successfully with parentIssueKey', async () => {
    const subtaskDataValid = {
      fields: {
        summary: "Test Subtask with Parent",
        issuetype: { name: "SUBT" }, // Modified to match controller expectation
        status: "Todo",
        parentIssueKey: "PROJECT-1" // Assuming a parent key exists (or can be any string for validation test)
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(subtaskDataValid);

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('key');
    expect(response.body.summary).toBe(subtaskDataValid.fields.summary);
    expect(response.body.issueType).toBe(subtaskDataValid.fields.issuetype.name); // Assert against the name property
    expect(response.body.status).toBe(subtaskDataValid.fields.status);
    expect(response.body.parentIssueKey).toBe(subtaskDataValid.fields.parentIssueKey);
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });
});
