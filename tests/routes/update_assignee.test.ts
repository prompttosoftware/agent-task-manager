// tests/routes/update_assignee.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts

describe('Update Assignee Endpoint', () => {
  it('should update the assignee of an issue', async () => {
    // Assuming you have a way to create an issue for testing (e.g., using a test database)
    const issueKey = 'ATM-123'; // Replace with an existing issue key or a test issue key
    const newAssignee = 'user2'; // Replace with a valid user

    const response = await request(app)
      .put(`/api/issues/${issueKey}/assignee`)
      .send({ assignee: newAssignee })
      .expect(200);

    // Add assertions to verify the response and the database update
    expect(response.body.assignee).toBe(newAssignee);

    // Verify that the issue in the database has been updated
    // This part depends on your database implementation.  You'll need to:
    // 1. Import your database connection or model.
    // 2. Query the database for the updated issue.
    // 3. Assert that the assignee field matches newAssignee.
    // Example (replace with your actual database code):
    // const updatedIssue = await Issue.findOne({ where: { issueKey: issueKey } });
    // expect(updatedIssue.assignee).toBe(newAssignee);
  });

  it('should return 400 if the assignee is invalid', async () => {
    const issueKey = 'ATM-123';
    const invalidAssignee = ''; // Or any other invalid assignee value

    await request(app)
      .put(`/api/issues/${issueKey}/assignee`)
      .send({ assignee: invalidAssignee })
      .expect(400);

    // Optionally, check the error response body for an appropriate message
  });

  it('should return 404 if the issue does not exist', async () => {
    const nonExistentIssueKey = 'ATM-999'; // A key that does not exist
    const newAssignee = 'user2';

    await request(app)
      .put(`/api/issues/${nonExistentIssueKey}/assignee`)
      .send({ assignee: newAssignee })
      .expect(404);
  });
});