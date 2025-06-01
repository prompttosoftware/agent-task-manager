import request from 'supertest';
import app from '../src/app';
// Assuming types like AnyIssue are defined in a separate 'types' file or directory
// Adjust the import path based on your project structure where AnyIssue is defined
import { AnyIssue } from '../src/types';

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

    // Assert the response body
    expect(response.body).toMatchObject({
      message: 'Issue created successfully (simulation)',
      data: {
        issueType: newIssuePayload.issueType,
        summary: newIssuePayload.summary,
        status: newIssuePayload.status,
        id: expect.any(String),
        key: 'ISSUE-0001',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });

    // Define the expected structure of the data part of the response
    interface ExpectedIssueData extends AnyIssue {
      id: string;
      key: string;
      createdAt: string;
      updatedAt: string;
    }

    // Access the data property and cast it to the expected data type after assertion
    // Note: The expect().toMatchObject() call above checks the runtime shape.
    const data = (response.body as { data: ExpectedIssueData }).data;

    // Assert the presence and basic format of generated fields
    expect(data.id).toBeDefined();
    expect(typeof data.id).toBe('string');
    // Basic check for UUID format (length and hyphens presence)
    expect(data.id.length).toBe(36);
    expect(data.id).toContain('-');

    expect(data.key).toBeDefined();
    expect(typeof data.key).toBe('string');
    // Expect the first key to be ISSUE-0001
    expect(data.key).toBe('ISSUE-0001');

    expect(data.createdAt).toBeDefined();
    expect(typeof data.createdAt).toBe('string');
    // Assert it's a valid ISO 8601 date string
    expect(() => new Date(data.createdAt).toISOString()).not.toThrow();

    expect(data.updatedAt).toBeDefined();
    expect(typeof data.updatedAt).toBe('string');
    // Assert it's a valid ISO 8601 date string
    expect(() => new Date(data.updatedAt).toISOString()).not.toThrow();

    // For a newly created issue, createdAt and updatedAt should be the same
    expect(data.createdAt).toBe(data.updatedAt);

  });

  // Add more tests here for other scenarios like missing fields, invalid types etc.
  // describe('Error Handling', () => { ... });
});
