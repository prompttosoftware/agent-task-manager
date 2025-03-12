// tests/successful_execution.test.ts

import { createIssue, getIssue, transitionIssue } from '../src/services/issueService';
import { Issue } from '../src/models/issue';

// Assuming you have a mock for the Jira API
jest.mock('../src/services/issueService');

describe('Successful Execution Test', () => {
  it('should successfully create, transition, and retrieve an issue', async () => {
    // Mock the service functions to return dummy data
    (createIssue as jest.Mock).mockResolvedValue({ key: 'ATM-200', id: '12345' });
    (getIssue as jest.Mock).mockResolvedValue({ key: 'ATM-200', fields: { status: { name: 'In Progress' } } });
    (transitionIssue as jest.Mock).mockResolvedValue(true);

    const issueDetails = {
      summary: 'Test Issue',
      description: 'This is a test issue',
      issuetype: { name: 'Task' }
    };

    // 1. Create Issue
    const createdIssue = await createIssue(issueDetails);
    expect(createdIssue).toBeDefined();
    expect(createdIssue.key).toBe('ATM-200');

    // 2. Transition the Issue
    const transitionResult = await transitionIssue('ATM-200', '21'); // Assuming '21' is In Progress transition
    expect(transitionResult).toBe(true);

    // 3. Get Issue Details
    const retrievedIssue = await getIssue('ATM-200');
    expect(retrievedIssue).toBeDefined();
    expect(retrievedIssue.key).toBe('ATM-200');
    expect(retrievedIssue.fields.status.name).toBe('In Progress');
  });
});