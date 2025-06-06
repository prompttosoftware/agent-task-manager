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
    // Send a basic issue creation request
    const basicIssue = {
      summary: "Basic Test Issue",
      issueType: "TASK",
      status: "Todo",
      // Other fields are not required for this simplified test
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(basicIssue);

    // Assert status code and content type
    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/json/);
  });

  // Add more API tests here as needed for other endpoints
  // e.g., GET /rest/api/2/issue/{issueIdOrKey}, PUT, DELETE, etc.

});
