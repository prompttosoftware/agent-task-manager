// tests/issueCreationRetrieval.test.ts

import { createIssue, getIssue } from '../src/services/issueService'; // Assuming these functions exist

describe('Issue Creation and Retrieval', () => {
  it('should create and retrieve an issue with matching details', async () => {
    const issueSummary = 'Test Issue Creation and Retrieval ' + Date.now();
    const issueDescription = 'This is a test description.';

    // 1. Create a new issue
    const createdIssue = await createIssue({
      summary: issueSummary,
      description: issueDescription,
      // Add other required fields here, like project key, issue type etc.
    });

    expect(createdIssue).toBeDefined();
    expect(createdIssue.key).toBeDefined();

    // 2. Retrieve the created issue by its key
    const retrievedIssue = await getIssue(createdIssue.key);

    // 3. Assert that the retrieved issue's details match the originally created issue
    expect(retrievedIssue).toBeDefined();
    expect(retrievedIssue.fields.summary).toEqual(issueSummary);
    expect(retrievedIssue.fields.description).toEqual(issueDescription);
    // Add other assertions for other fields as needed
  });
});