// test/controllers/issue.controller.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { issueService } from '../../src/services/issue.service';

// Mock the issueService to isolate the controller tests
vi.mock('../../src/services/issue.service');

describe('Issue Controller - Transitions', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Reset all mocks before each test
  });

  it('should return 400 Bad Request for invalid transition ID', async () => {
    // Mock the issueService to simulate an error
    vi.mocked(issueService.transitionIssue).mockRejectedValue(new Error('Invalid transition ID'));

    const issueKey = 'ATM-123'; // Example issue key
    const invalidTransitionId = '9999'; // Example invalid ID

    const response = await request(app)
      .post(`/issue/${issueKey}/transitions`)
      .send({ transitionId: invalidTransitionId })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({ // Check for the error message
      message: expect.stringContaining('Invalid transition ID')
    }));
  });
});
