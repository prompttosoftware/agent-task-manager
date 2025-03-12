// tests/routes/transition_issue.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

// Mock the necessary modules and dependencies
jest.mock('../../src/models/issue');
const issueModel = require('../../src/models/issue');

describe('Issue Transition API', () => {
  const issueKey = 'ATM-123'; // Example issue key

  // Helper function to mock the issue model's transition method
  const mockTransition = (transitionResult: any) => {
    (issueModel.transitionIssue as jest.Mock).mockResolvedValue(transitionResult);
  };

  it('should successfully transition an issue to the next state', async () => {
    mockTransition({ status: 'In Progress' });

    const response = await request(app)
      .post(`/api/issue/${issueKey}/transition`)
      .send({ transitionId: 21 }); // Example transition ID

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'In Progress' });
    expect(issueModel.transitionIssue).toHaveBeenCalledWith(issueKey, 21, undefined);
  });

  it('should handle invalid transition IDs', async () => {
    mockTransition(null);

    const response = await request(app)
      .post(`/api/issue/${issueKey}/transition`)
      .send({ transitionId: 999 }); // Invalid transition ID

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid transition' });
  });

  it('should handle unauthorized transitions', async () => {
    mockTransition(null);

    // Mock user authentication to simulate lack of permissions
    const response = await request(app)
      .post(`/api/issue/${issueKey}/transition`)
      .send({ transitionId: 21 }); // Valid transition ID

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

    it('should verify the issue state is correctly updated after a successful transition', async () => {
    mockTransition({ status: 'Done' });

    const response = await request(app)
      .post(`/api/issue/${issueKey}/transition`)
      .send({ transitionId: 31 }); // Example transition ID to 'Done'

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'Done' });
    expect(issueModel.transitionIssue).toHaveBeenCalledWith(issueKey, 31, undefined);
  });

  it('should handle errors during the transition process', async () => {
    (issueModel.transitionIssue as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post(`/api/issue/${issueKey}/transition`)
      .send({ transitionId: 21 });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });
});
