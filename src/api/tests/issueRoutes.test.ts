import request from 'supertest';
import app from '../../app';
import { createIssue } from '../controllers/issueController';

// Mock the createIssue controller function
jest.mock('../controllers/issueController', () => ({
  createIssue: jest.fn().mockImplementation((req, res) => {
    res.sendStatus(201);
    return Promise.resolve();
  }),
}));

const mockedCreateIssue = createIssue as jest.Mock;

describe('Issue Routes', () => {
  it('POST /rest/api/2/issue should return 201', async () => {
    console.log('Setting up mock implementation for createIssue...');
    console.log('Mock implementation set.');
    console.log('About to send POST request to /rest/api/2/issue');
    const response = await request(app).post('/rest/api/2/issue').send({
      projectId: "PROJ-123",
      issueType: "Task",
      summary: "Implement user authentication",
      description: "Detailed steps for implementing user authentication feature.",
      reporterId: "user-abc",
    });
    console.log('Received response status code:', response.statusCode); // Debug log: received status
    expect(response.statusCode).toBe(201);
    expect(mockedCreateIssue).toHaveBeenCalled();
  });
});
