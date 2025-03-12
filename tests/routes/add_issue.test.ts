// tests/routes/add_issue.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Add Issue Endpoint', () => {
  it('should respond with a 200 status code', async () => {
    const response = await request(app).post('/api/issues'); // Assuming your endpoint is /api/issues
    expect(response.statusCode).toBe(200);
  });

  it('should include board and label information in the response', async () => {
    // Assuming the POST /api/issues endpoint returns the created issue
    const response = await request(app).post('/api/issues').send({ /* Example issue data with board and label */ });
    expect(response.statusCode).toBe(200);
    //expect(response.body).toHaveProperty('board'); // check for board property
    //expect(response.body).toHaveProperty('labels'); // check for labels property
    // Add further assertions based on how board and label data is structured
  });
});