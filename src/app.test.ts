import request from 'supertest';
import app from '../../src/app'; // Adjust the path based on your project structure
import { AnyIssue } from '../../src/models'; // Import necessary types

describe('POST /issues', () => {
  // Note: This test relies on the in-memory database starting in a clean state
  // with issueKeyCounter = 1 for the key assertion (ISSUE-0001).
  // For a more robust test suite with multiple tests interacting with the DB,
  // consider resetting the database state before each test (e.g., using beforeEach).

  it('should create a new issue with valid data and return 201', async () => {
    const newIssuePayload = {
      issueType: 'Task',
      summary: 'Implement user authentication',
      status: 'Todo',
      description: 'Need to add signup, login, and logout functionality for users.',
    };

    // Make the POST request using supertest
    const response = await request(app)
      .post('/issues')
      .send(newIssuePayload)
      .expect(201); // Assert the status code is 201 Created

    const createdIssue: AnyIssue = response.body;

    // Assert the response body contains the data sent in the payload
    expect(createdIssue).toMatchObject(newIssuePayload);

    // Assert the presence and basic format of generated fields
    expect(createdIssue.id).toBeDefined();
    expect(typeof createdIssue.id).toBe('string');
    // Basic check for UUID format (length and hyphens presence)
    expect(createdIssue.id.length).toBe(36);
    expect(createdIssue.id).toContain('-');

    expect(createdIssue.key).toBeDefined();
    expect(typeof createdIssue.key).toBe('string');
    // Expect the first key to be ISSUE-0001
    expect(createdIssue.key).toBe('ISSUE-0001');

    expect(createdIssue.createdAt).toBeDefined();
    expect(typeof createdIssue.createdAt).toBe('string');
    // Assert it's a valid ISO 8601 date string
    expect(() => new Date(createdIssue.createdAt).toISOString()).not.toThrow();

    expect(createdIssue.updatedAt).toBeDefined();
    expect(typeof createdIssue.updatedAt).toBe('string');
    // Assert it's a valid ISO 8601 date string
    expect(() => new Date(createdIssue.updatedAt).toISOString()).not.toThrow();

    // For a newly created issue, createdAt and updatedAt should be the same
    expect(createdIssue.createdAt).toBe(createdIssue.updatedAt);

    // Ensure no extra unexpected fields are present in the basic payload part
    // The toMatchObject check already does this for the payload fields,
    // and we explicitly check generated fields.
  });

  // Add more tests here for other scenarios like missing fields, invalid types etc.
  // describe('Error Handling', () => { ... });
});
