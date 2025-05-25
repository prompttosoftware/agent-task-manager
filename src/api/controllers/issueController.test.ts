import { Request, Response } from 'express';
import { createIssue } from './issueController';
import { issueService } from '../../services/issueService';
import { Task } from '../../models'; // Assuming Task type is defined in models

// Mock the issueService module
jest.mock('../../services/issueService');

// Cast the mocked issueService to JestMocked so we can access mock properties
const mockIssueService = issueService as jest.Mocked<typeof issueService>;

describe('createIssue', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    // Reset mocks and mock implementations before each test
    jest.clearAllMocks();

    // Create mock functions for response methods
    responseJson = jest.fn();
    // Mock the status function to return an object with a json function for chaining
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    // Define a mock request object with a body
    mockRequest = {
      body: {
        summary: 'Test Issue Summary',
        description: 'This is a test issue description.',
      },
    };

    // Define a mock response object
    mockResponse = {
      status: responseStatus,
      json: responseJson, // Include json directly as well, though status().json() is primary
    };
  });

  it('should return 201 status and the created issue object for a valid request', async () => {
    // Arrange: Define the expected created issue object
    const mockCreatedIssue: Task = {
      id: 'mock-uuid-123',
      key: 'ATM-1001',
      issueType: 'Task',
      summary: 'Test Issue Summary',
      description: 'This is a test issue description.',
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock the issueService.createIssue function to resolve with the mockCreatedIssue
    mockIssueService.createIssue.mockResolvedValue(mockCreatedIssue);

    // Act: Call the controller function
    await createIssue(mockRequest as Request, mockResponse as Response);

    // Assert: Verify the behavior
    // Verify that issueService.createIssue was called with the correct data from the request body
    expect(mockIssueService.createIssue).toHaveBeenCalledTimes(1);
    expect(mockIssueService.createIssue).toHaveBeenCalledWith({
      summary: 'Test Issue Summary',
      description: 'This is a test issue description.',
    });

    // Verify that the response status was set to 201
    expect(responseStatus).toHaveBeenCalledTimes(1);
    expect(responseStatus).toHaveBeenCalledWith(201);

    // Verify that the response json was called with the created issue object
    expect(responseJson).toHaveBeenCalledTimes(1);
    expect(responseJson).toHaveBeenCalledWith(mockCreatedIssue);
  });

  it('should return 500 status and an error message if issueService.createIssue throws an error', async () => {
    // Arrange: Define a mock error
    const mockError = new Error('Failed to connect to database');

    // Mock the issueService.createIssue function to reject with the mock error
    mockIssueService.createIssue.mockRejectedValue(mockError);

    // Act: Call the controller function
    await createIssue(mockRequest as Request, mockResponse as Response);

    // Assert: Verify the behavior
    // Verify that issueService.createIssue was called
    expect(mockIssueService.createIssue).toHaveBeenCalledTimes(1);
    expect(mockIssueService.createIssue).toHaveBeenCalledWith({
      summary: 'Test Issue Summary',
      description: 'This is a test issue description.',
    });

    // Verify that the response status was set to 500
    expect(responseStatus).toHaveBeenCalledTimes(1);
    expect(responseStatus).toHaveBeenCalledWith(500);

    // Verify that the response json was called with the correct error message structure
    expect(responseJson).toHaveBeenCalledTimes(1);
    expect(responseJson).toHaveBeenCalledWith({
      message: 'Failed to create issue',
      error: mockError.message,
    });
  });
});
