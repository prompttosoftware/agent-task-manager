import request from 'supertest';
import express from 'express';
import { issueRoutes } from './issueRoutes';
import * as issueService from '../../services/issueService'; // Import the service to mock;

// Cast the mocked service to a Jest Mocked object type for easier access to mock methods
const mockedIssueService = issueService as jest.Mocked<typeof issueService>;

const app = express();
app.use(express.json()); // Need to parse JSON body;
app.use('/rest/api/2', issueRoutes); // Mount the router at the correct path

describe('Issue Routes', () => {
  beforeEach(() => {
    // Clear any previous mock implementations or calls before each test
    jest.clearAllMocks();
  });

  describe('POST /rest/api/2/issue', () => {
    it('should return 201 and the created issue object when a valid request is made', async () => {
      const mockIssue = {
        id: 'mock-id-123',
        key: 'ATM-1001',
        issueType: 'Task',
        summary: 'Mock Issue Summary',
        description: 'Mock Issue Description',
        status: 'Todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Configure the mock implementation for createIssue
      mockedIssueService.createIssue.mockResolvedValue(mockIssue);

      const issueData = {
        summary: 'Test Issue',
        description: 'This is a test issue',
      };

      const response = await request(app)
        .post('/rest/api/2/issue')
        .send(issueData)
        .expect('Content-Type', /json/);

      // Assert the status code
      expect(response.status).toBe(201);

      // Assert the response body matches the mock issue object
      expect(response.body).toEqual(mockIssue);

      // Assert that issueService.createIssue was called with the correct data
      expect(mockedIssueService.createIssue).toHaveBeenCalledTimes(1);
      expect(mockedIssueService.createIssue).toHaveBeenCalledWith(issueData);
    });

    it('should return 400 if summary is missing', async () => {
        const issueData = {
          description: 'This is a test issue without summary',
        };

        const response = await request(app)
          .post('/rest/api/2/issue')
          .send(issueData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(400);
        // Expect the specific validation error message required by the prompt
        expect(response.body).toEqual({ error: 'Summary is required and must be a string' });
        // Ensure the service was NOT called because validation failed before reaching it
        expect(mockedIssueService.createIssue).not.toHaveBeenCalled();
    });

    it('should return 500 if issueService.createIssue throws a service error', async () => {
      const serviceErrorMessage = 'Failed to save to database';
      const serviceError = new Error(serviceErrorMessage);
      // Configure the mock implementation for createIssue to reject with an error
      mockedIssueService.createIssue.mockRejectedValue(serviceError);

      const issueData = {
        summary: 'Test Issue that will fail',
        description: 'This issue will cause a service error',
      };

      const response = await request(app)
        .post('/rest/api/2/issue')
        .send(issueData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(500);
      // Assert the response body matches the error format returned by the controller
      expect(response.body).toEqual({
        message: 'Failed to create issue',
        error: serviceErrorMessage,
      });

      // Ensure the service was called with the correct data before throwing the error
      expect(mockedIssueService.createIssue).toHaveBeenCalledTimes(1);
      expect(mockedIssueService.createIssue).toHaveBeenCalledWith(issueData);
    });
  });
});
