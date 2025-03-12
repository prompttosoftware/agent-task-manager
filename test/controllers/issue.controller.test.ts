// test/controllers/issue.controller.test.ts
import { test, expect, describe, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { createIssue, transitionIssue } from '../../src/services/issue.service';

describe('Transition Issue Endpoint', () => {
  beforeEach(async () => {
    // Assuming you have a way to set up your environment before each test
    // This might involve seeding your database or mocking external services.
    // For example, you might want to reset the database here or mock the service layer.
  });

  test('POST /issue/{issueKey}/transitions - Positive: Valid issue key and transition ID', async () => {
    // 1. Create a test issue.
    const issueKey = 'ATM-123'; // Replace with a valid issue key, or create a new one dynamically
    const transitionId = '31'; // Replace with a valid transition ID

    // Mock the createIssue and transitionIssue functions to avoid dependencies
    const createIssueMock = vi.fn().mockResolvedValue({ key: issueKey });
    const transitionIssueMock = vi.fn().mockResolvedValue(true);
    vi.mock('../../src/services/issue.service', () => ({
        createIssue: createIssueMock,
        transitionIssue: transitionIssueMock
    }));

    // 2. Send a request to the transition endpoint.
    const response = await request(app)
      .post(`/issue/${issueKey}/transitions`)
      .send({ transitionId });

    // 3. Assert that the response is successful.
    expect(response.status).toBe(200); // Or whatever status code indicates success

    // 4. Optionally, assert that the issue was transitioned correctly.
    // For example, you might check the response body for confirmation or
    // query your database or mock for changes.
    expect(transitionIssueMock).toHaveBeenCalledWith(issueKey, transitionId);
  });
});
