// tests/routes/issue_link.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts

describe('Issue Link Route', () => {
  it('should create an issue link', async () => {
    // Mock the necessary data for creating an issue link
    const issueLinkData = {
      // Add the necessary data (e.g., sourceIssueKey, targetIssueKey, linkType)
      sourceIssueKey: 'ATM-123',
      targetIssueKey: 'ATM-456',
      linkType: 'blocks',
    };

    const response = await request(app)
      .post('/api/issue-link') // Assuming the route is /api/issue-link
      .send(issueLinkData);

    expect(response.statusCode).toBe(201); // Assuming 201 Created
    // Add more assertions to validate the response body
  });

  it('should retrieve an issue link', async () => {
    // First, create an issue link (or use a pre-existing one)
    const issueLinkData = {
      // Add the necessary data (e.g., sourceIssueKey, targetIssueKey, linkType)
      sourceIssueKey: 'ATM-123',
      targetIssueKey: 'ATM-456',
      linkType: 'blocks',
    };

    await request(app)
    .post('/api/issue-link')
    .send(issueLinkData);

    const response = await request(app)
      .get('/api/issue-link/ATM-123') // Assuming the route is /api/issue-link/:sourceIssueKey

    expect(response.statusCode).toBe(200);
    // Add more assertions to validate the response body
  });

  it('should delete an issue link', async () => {
    // First, create an issue link (or use a pre-existing one)
    const issueLinkData = {
      // Add the necessary data (e.g., sourceIssueKey, targetIssueKey, linkType)
      sourceIssueKey: 'ATM-123',
      targetIssueKey: 'ATM-456',
      linkType: 'blocks',
    };

    await request(app)
    .post('/api/issue-link')
    .send(issueLinkData);

    const response = await request(app)
      .delete('/api/issue-link/ATM-123/ATM-456') // Assuming the route is /api/issue-link/:sourceIssueKey/:targetIssueKey

    expect(response.statusCode).toBe(204); // Assuming 204 No Content on successful deletion
    // Add more assertions to validate the response body
  });
});