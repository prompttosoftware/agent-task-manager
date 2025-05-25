import { Request, Response } from 'express';
import { createIssue } from '../controllers/issueController';
import request from 'supertest';
import issueRoutes from './issueRoutes'; // Import the route

// Mock the request and response objects
const mockRequest = (body = {}) => ({
  body,
} as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis(); // Allows chaining like res.status(201).json(...)
  res.json = jest.fn();
  res.send = jest.fn(); // In case send is used instead of json
  return res;
};

// These tests directly call the createIssue controller function,
// which is the handler for the POST /rest/api/2/issue route.
// This effectively tests the route's behavior by verifying the controller's output
// for various input request bodies.
describe('POST /rest/api/2/issue - issueRoutes', () => {

  // Test Case 1: Successful creation with all required fields and some extra fields
  it('should return 201 for successful issue creation with required and extra fields', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Implement feature X',
      status: 'To Do',
      description: 'Detailed description here', // Extra field
      assignee: 'user-xyz',                     // Extra field
    };
    const res = mockResponse();

    // Act
    // Use supertest to simulate a request to the route
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(201);
    // Verify that the response body contains the success message and the data structure
    // and that the data contains only the expected required fields from the input.
    expect(response.body).toEqual({
      message: 'Issue created successfully (simulation)',
      data: {
        issueType: reqBody.issueType,
        summary: reqBody.summary,
        status: reqBody.status,
      },
    });
  });

  // Test Case 2: Missing required field - issueType
  it('should return 400 when issueType is missing (undefined)', async () => {
    // Arrange
    const reqBody = {
      summary: 'Missing type field',
      status: 'Open',
    };
    const res = mockResponse();

    // Act
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });

  it('should return 400 when issueType is an empty string', async () => {
    // Arrange
    const reqBody = {
      issueType: '', // Empty string
      summary: 'Empty type field',
      status: 'Open',
    };
    const res = mockResponse();

    // Act
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });

  // Test Case 3: Missing required field - summary
  it('should return 400 when summary is missing (undefined)', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Bug',
      status: 'To Do',
    };
    const res = mockResponse();

    // Act
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });

  it('should return 400 when summary is an empty string', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Bug',
      summary: '', // Empty string
      status: 'To Do',
    };
    const res = mockResponse();

    // Act
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });

  // Test Case 4: Missing required field - status
  it('should return 400 when status is missing (undefined)', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Missing status field',
    };
    const res = mockResponse();

    // Act
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });

  it('should return 400 when status is an empty string', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Empty status field',
      status: '', // Empty string
    };
    const res = mockResponse();

    // Act
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });

  // Test Case 5: Missing all required fields (empty body)
  it('should return 400 when the request body is empty', async () => {
    // Arrange
    const reqBody = {}; // Empty body
    const res = mockResponse();

    // Act
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });

  // Test Case 6: Missing multiple required fields
  it('should return 400 when multiple required fields are missing', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task', // summary and status are missing
    };
    const res = mockResponse();

    // Act
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });

  // Test Case 7: Required fields are null (validation handles null as falsy)
  it('should return 400 when required fields are null', async () => {
    // Arrange
    const reqBody = {
      issueType: null,
      summary: null,
      status: null,
    };
    const res = mockResponse();

    // Act
    const agent = request(issueRoutes);
    const response = await agent.post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });

  // Note: Testing the 500 Internal Server Error case for this simple controller
  // would require forcing an error within the try block, which is difficult
  // without modifying the controller code or introducing more complex mocks
  // that simulate errors in basic operations (like accessing req.body),
  // which is generally not necessary unless the try block contains operations
  // prone to throwing specific errors (e.g., database calls, external API calls).
  // For this simulation controller, the primary focus is on the 201 and 400 paths
  // based on input validation.
});
