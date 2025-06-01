import express, { Application } from 'express';
import request from 'supertest';
import issueRouter from './issueRoutes';

// Create a simple Express app instance for testing
const app: Application = express();
app.use(express.json()); // Use express.json() middleware to parse request bodies
app.use('/rest/api/2', issueRouter); // Mount the issueRoutes router under the correct path

// Add a test for a simple dummy route to verify routing setup
describe('GET /rest/api/2/status - issueRoutes', () => {
  it('should return 200 and OK for the status route', async () => {
    const response = await request(app).get('/rest/api/2/status');
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});
