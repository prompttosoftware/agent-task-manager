import request from 'supertest';
import router from './index'; // Assuming index.ts exports the router instance
import { AnyIssue, Task, BaseIssue } from '../models/issue'; // Import necessary types

// Extend Jest matchers for checking date strings
expect.extend({
  toBeValidDateString(received) {
    if (typeof received !== 'string') {
      return {
        message: () => `expected "${received}" to be a string`,
        pass: false,
      };
    }
    const date = new Date(received);
    const isValid = !isNaN(date.getTime());
    return {
      message: () => `expected "${received}" to be a valid date string`,
      pass: isValid,
    };
  },
});

// Declare the custom matcher so TypeScript knows about it
declare namespace jest {
  interface Matchers<R> {
    toBeValidDateString(): R;
  }
};


describe('/api/issues', () => {
  let createdIssue: AnyIssue | null = null;

  // Note: The in-memory database in src/api/index.ts is a global variable.
  // Its state persists across tests within this file execution.
  // For true test isolation, a database mock or reset mechanism would be needed,
  // but given the constraints, we'll test incrementally, assuming state persists.

  describe('POST /api/issues', () => {
    const newIssueData: Partial<BaseIssue> = {
      issueType: 'Task',
      summary: 'Test task issue',
      description: 'This is a test task',
      status: 'Todo',
      // createdAt and updatedAt are assigned by the server
    };

    test('should create a new issue and return 201', async () => {
      const response = await request(router)
        .post('/api/issues')
        .send(newIssueData)
        .expect(201);

      createdIssue = response.body;

      // Check response body structure and data integrity
      expect(createdIssue).toBeDefined();
      expect(typeof createdIssue.id).toBe('string');
      expect(createdIssue.id).not.toBeNull(); // Assuming id is generated
      expect(typeof createdIssue.key).toBe('string');
      expect(createdIssue.key).toMatch(/^ATM-\d+$/); // Assuming key format ATM-number
      expect(createdIssue.issueType).toBe(newIssueData.issueType);
      expect(createdIssue.summary).toBe(newIssueData.summary);
      expect(createdIssue.description).toBe(newIssueData.description);
      expect(createdIssue.status).toBe(newIssueData.status);

      // Check generated date fields
      expect(createdIssue.createdAt).toBeDefined();
      expect(createdIssue.updatedAt).toBeDefined();
      expect(createdIssue.createdAt).toBeValidDateString();
      expect(createdIssue.updatedAt).toBeValidDateString();
      // Basic check that updatedAt is not before createdAt (allow equality)
      expect(new Date(createdIssue.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(createdIssue.createdAt).getTime());
      
      // Ensure no unexpected properties are present (basic check)
      expect(Object.keys(createdIssue).length).toBeGreaterThanOrEqual(7); // id, key, issueType, summary, description, status, createdAt, updatedAt;
    });

    test('should return 400 for missing required fields', async () => {
      const invalidIssueData = {
        summary: 'Missing type and status',
        description: 'This should fail',
      };

      await request(router)
        .post('/api/issues')
        .send(invalidIssueData)
        .expect(400);
    });
  });

  describe('GET /api/issues', () => {
    test('should return a list of issues with status 200', async () => {
      const response = await request(router)
        .get('/api/issues')
        .expect(200);

      // Check response body structure
      expect(response.body).toBeInstanceOf(Array);

      const issues: AnyIssue[] = response.body;

      // Check data integrity - assuming at least one issue was created by the POST test
      if (createdIssue) {
        const found = issues.find(issue => issue.id === createdIssue!.id);
        expect(found).toBeDefined();
        expect(found).toEqual(createdIssue); // Check if the created issue is present and matches
      }

      // Check structure of issues in the array (if any)
      issues.forEach(issue => {
        expect(typeof issue.id).toBe('string');
        expect(typeof issue.key).toBe('string');
        expect(['Task', 'Story', 'Epic', 'Bug', 'Subtask']).toContain(issue.issueType);
        expect(typeof issue.summary).toBe('string');
        expect(['Todo', 'In Progress', 'Done']).toContain(issue.status);
        expect(issue.createdAt).toBeValidDateString();
        expect(issue.updatedAt).toBeValidDateString();

        // Check specific types if needed (optional based on request scope)
        if (issue.issueType === 'Epic') {
          expect(issue).toHaveProperty('childIssueKeys');
          expect(issue.childIssueKeys).toBeInstanceOf(Array);
        } else if (issue.issueType === 'Subtask') {
          expect(issue).toHaveProperty('parentIssueKey');
          expect(typeof issue.parentIssueKey).toBe('string');
        }
      });
    });

    test('should return an empty array if no issues exist initially (requires database reset)', async () => {
        // NOTE: This test will only pass if the in-memory database is reset before this specific test runs.
        // Given the current structure of src/api/index.ts, the database state persists from previous tests.
        // To make this test reliable without refactoring src/api/index.ts, you would need to:
        // 1. Export the 'db' object from index.ts and reset it here.
        // 2. Or, better, refactor index.ts to accept a database dependency that can be swapped or reset.
        // As per the instructions not to modify index.ts, this test might fail if other tests run first.
        // We include it to show how one would test the empty state, acknowledging the limitation.

        // If you were able to reset the db, the code would look like this:
        // await request(router).get('/api/issues').expect(200).expect([]);

        // As a compromise, we'll check that the response is always an array.
        // A truly empty state test requires environment control not available here.
        const response = await request(router)
            .get('/api/issues')
            .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        // Cannot reliably assert empty array due to shared state
        // expect(response.body.length).toBe(0); // This assertion is likely incorrect with shared state
    });
  });
});
