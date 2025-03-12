// tests/issueAttachment.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Issue Attachment API', () => {
  it('should upload an attachment to an issue', async () => {
    // Assuming you have an API endpoint like /issues/:issueKey/attachments
    const issueKey = 'ATM-137'; // Replace with a valid issue key or create one for testing
    const filePath = 'tests/test_attachment.txt'; // Path to a test attachment file

    // Create a dummy attachment file for testing
    // Consider creating this programmatically during the test or setting it up during the beforeAll hook.
    // This is for demonstration only.  You would need to create this file in your environment or use a mock.
    // For example:
    // fs.writeFileSync(filePath, 'This is a test attachment content.');

    const response = await request(app)
      .post(`/issues/${issueKey}/attachments`)
      .attach('attachment', filePath) // 'attachment' is the field name expected by your API
      .expect(200); // Or the expected status code upon successful upload

    // Assertions to verify the attachment was handled correctly.
    expect(response.body).toBeDefined();
    // Add more detailed assertions based on your API response
    // e.g., check the attachment metadata, file name, etc.
  });

  // Add more tests for error cases, file type validation, etc.
});
