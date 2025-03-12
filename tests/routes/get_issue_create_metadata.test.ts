// tests/routes/get_issue_create_metadata.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts

describe('GET /rest/api/2/issue/createmeta', () => {
  it('should return 200 and issue create metadata', async () => {
    const response = await request(app)
      .get('/rest/api/2/issue/createmeta')
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    // Add more specific assertions based on the expected structure of the metadata
  });

  // Add more tests for different scenarios, e.g., with project keys, issue type names, etc.
});