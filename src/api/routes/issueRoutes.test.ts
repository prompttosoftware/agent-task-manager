import express, { Application } from 'express';
import request from 'supertest';
import issueRoutes from './issueRoutes';
import * as issueController from '../controllers/issueController'; // Import the actual controller
import * as issueService from '../../issueService'; // Import the service to mock it if needed
import { IssueCreationError } from '../../utils/errorHandling'; // Import custom error type
import { AnyIssue } from '../../models'; // Import types

// Mock the issueService to control its behavior during testing
// We need to mock the specific function used by the controller
jest.mock('../../issueService', () => ({
  createIssue: jest.fn(),
  // Keep other service functions as they are for now, or mock them if needed for future tests
}));

// Create a simple Express app instance for testing
const app: Application = express();
app.use(express.json()); // Use express.json() middleware to parse request bodies
app.use('/rest/api/2', issueRoutes); // Mount the issueRoutes router under the correct path

// Add a test for a simple dummy route to verify routing setup
describe('GET /rest/api/2/status - issueRoutes', () => {
  it('should return 200 and OK for the status route', async () => {
    const response = await request(app).get('/rest/api/2/status');
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});

describe('POST /rest/api/2/issue - issueRoutes', () => {

  // Cast the mocked function for type safety
  const mockedCreateIssueService = issueService.createIssue as jest.Mock;

  // Reset mocks before each test
  beforeEach(() => {
    mockedCreateIssueService.mockReset();
  });

  // Test Case 1: Successful creation with all required fields and some extra fields
  it('should return 201 for successful issue creation with required and extra fields', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Implement feature X',
      status: 'Todo', // Controller validates status, service ignores it for initial state
      description: 'Detailed description here', // Extra field (handled by controller mapping)
      assignee: 'user-xyz',                     // Extra field (should be ignored)
    };

    // Simulate the service returning a successful issue creation
    const mockCreatedIssue: AnyIssue = {
      id: 'test-id-123',
      key: 'ATM-1',
      issueType: 'Task', // Service sets this based on input
      summary: 'Implement feature X', // Service maps title back to summary
      description: 'Detailed description here', // Service uses provided description
      status: 'Todo', // Service determines initial status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentKey: null, // Not a subtask - FIX: Changed parentIssueKey to parentKey
    };
    mockedCreateIssueService.mockResolvedValue(mockCreatedIssue);

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(201);
    // Verify that the service was called with the correctly mapped data
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: reqBody.summary, // summary maps to title
      issueTypeName: reqBody.issueType, // issueType maps to issueTypeName
      description: reqBody.description, // description is passed through
      parentKey: null, // Not a subtask
    });
    // Verify the response body matches the structure and data returned by the mocked service
    // Note: The response body comes from the mocked service return value, which uses 'parentKey'.
    expect(response.body).toEqual(mockCreatedIssue);
    // Also check expected fields are present and have plausible formats (basic check)
    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.id).toBe('string');
    expect(response.body).toHaveProperty('key');
    expect(typeof response.body.key).toBe('string');
    expect(response.body).toHaveProperty('issueType', reqBody.issueType);
    expect(response.body).toHaveProperty('summary', reqBody.summary);
    expect(response.body).toHaveProperty('status', 'Todo'); // Expect status set by service
    expect(response.body).toHaveProperty('createdAt');
    expect(typeof response.body.createdAt).toBe('string'); // ISO date string
    expect(response.body).toHaveProperty('updatedAt');
    expect(typeof response.body.updatedAt).toBe('string'); // ISO date string
    // Check for the correct key name used in the returned object (from the mock)
    expect(response.body).toHaveProperty('parentKey', null); // FIX: Changed parentIssueKey to parentKey
    // Ensure parentIssueKey (from request) is NOT in the returned object if not applicable
    expect(response.body).not.toHaveProperty('parentIssueKey');
  });

  // Test Case 1b: Successful creation of a Subtask
  it('should return 201 for successful subtask creation with required fields and parentIssueKey', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Subtask',
      summary: 'Implement subtask feature Y',
      status: 'Todo',
      parentIssueKey: 'ATM-1', // Required for Subtask in request body
    };

    // Simulate the service returning a successful issue creation
    const mockCreatedIssue: AnyIssue = {
      id: 'test-id-456',
      key: 'ATM-2',
      issueType: 'Subtask',
      summary: 'Implement subtask feature Y',
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentKey: 'ATM-1', // Service uses parentKey - FIX: Changed parentIssueKey to parentKey
    };
    mockedCreateIssueService.mockResolvedValue(mockCreatedIssue);

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(201);
    // Verify that the service was called with the correctly mapped data
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: reqBody.summary,
      issueTypeName: reqBody.issueType,
      description: '', // The controller maps undefined description to an empty string
      parentKey: reqBody.parentIssueKey, // parentIssueKey from request maps to parentKey in service call
    });
    // Verify the response body matches the structure and data returned by the mocked service
    expect(response.body).toEqual(mockCreatedIssue);
    // Check for the correct key name used in the returned object (from the mock)
    expect(response.body).toHaveProperty('parentKey', 'ATM-1'); // FIX: Changed parentIssueKey to parentKey
    expect(response.body).not.toHaveProperty('parentIssueKey');
  });


  // Test Case 2: Missing required field - issueType
  it('should return 400 when issueType is missing (undefined)', async () => {
    // Arrange
    const reqBody = {
      summary: 'Missing type field',
      status: 'Todo',
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message
    expect(response.body).toEqual({ message: 'Missing required field: issueType.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called on validation failure
  });

  it('should return 400 when issueType is an empty string', async () => {
    // Arrange
    const reqBody = {
      issueType: '', // Empty string
      summary: 'Empty type field',
      status: 'Todo',
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message
    expect(response.body).toEqual({ message: 'Missing required field: issueType.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 3: Missing required field - summary
  it('should return 400 when summary is missing (undefined)', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Bug',
      status: 'Todo',
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message
    expect(response.body).toEqual({ message: 'Missing or empty required field: summary.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  it('should return 400 when summary is an empty string', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Bug',
      summary: '', // Empty string
      status: 'Todo',
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message
    expect(response.body).toEqual({ message: 'Missing or empty required field: summary.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 4: Missing required field - status
  // The controller validates status is present and allowed, even though the service determines initial status.
  it('should return 400 when status is missing (undefined)', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Missing status field',
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message
    expect(response.body).toEqual({ message: 'Missing required field: status.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  it('should return 400 when status is an empty string', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Empty status field',
      status: '', // Empty string
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message
    expect(response.body).toEqual({ message: 'Missing required field: status.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 5: Missing all required fields (empty body)
  it('should return 400 when the request body is empty', async () => {
    // Arrange
    const reqBody = {}; // Empty body

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message (it checks issueType first)
    expect(response.body).toEqual({ message: 'Missing required field: issueType.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 6: Missing multiple required fields
  it('should return 400 when multiple required fields are missing', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task', // summary and status are missing
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message (it checks summary next)
    expect(response.body).toEqual({ message: 'Missing or empty required field: summary.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 7: Required fields are null (validation handles null as falsy)
  it('should return 400 when required fields are null', async () => {
    // Arrange
    const reqBody = {
      issueType: null,
      summary: null,
      status: null,
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody as any); // Cast to any for null values
    // Note: Supertest might strip nulls depending on version/settings, but controller should handle explicitly null too.

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message (it checks issueType first)
    expect(response.body).toEqual({ message: 'Missing required field: issueType.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 8: Required fields are explicitly undefined
  // Supertest's send({ key: undefined }) might omit the key entirely,
  // resulting in an empty body, which is handled by the first validation.
  it('should return 400 when required fields are explicitly undefined', async () => {
    // Arrange
    const reqBody = {
      issueType: undefined,
      summary: undefined,
      status: undefined,
    };

    // Act
    // Using send({ key: undefined }) often results in {}. Manually construct the payload if needed,
    // or trust that controller handles undefined properties if they somehow appear.
    // The current controller handles undefined/missing fields by checking falsiness.
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // Assert against the actual controller's validation error message (checks issueType first)
    expect(response.body).toEqual({ message: 'Missing required field: issueType.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 9: Invalid issueType value
  it('should return 400 when issueType has an invalid value', async () => {
    // Arrange
    const reqBody = {
      issueType: 'InvalidType', // Invalid value
      summary: 'Some summary',
      status: 'Todo',
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: `Invalid value for issueType: "${reqBody.issueType}". Must be one of: Task, Story, Epic, Bug, Subtask.` });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 10: Invalid status value
  it('should return 400 when status has an invalid value', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Some summary',
      status: 'InvalidStatus', // Invalid value
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: `Invalid value for status: "${reqBody.status}". Must be one of: Todo, In Progress, Done.` });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 11: Subtask missing parentIssueKey
  it('should return 400 when issueType is Subtask and parentIssueKey is missing', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Subtask',
      summary: 'Subtask without parent',
      status: 'Todo',
      // parentIssueKey is missing
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required field: parentIssueKey is required for Subtasks.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

   // Test Case 12: Subtask with empty parentIssueKey
   it('should return 400 when issueType is Subtask and parentIssueKey is empty', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Subtask',
      summary: 'Subtask with empty parent',
      status: 'Todo',
      parentIssueKey: '', // Empty string
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required field: parentIssueKey is required for Subtasks.' });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });


  // Test Case 13: Providing parentIssueKey for a non-Subtask
  it('should return 400 when parentIssueKey is provided for a non-Subtask type', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task', // Not a subtask
      summary: 'Task with parent key',
      status: 'Todo',
      parentIssueKey: 'ATM-1', // Should not be present for Task
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: `Invalid field: parentIssueKey is only allowed for Subtask issue types.` });
    expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Service should not be called
  });

  // Test Case 14: Handling a service error (IssueCreationError)
  it('should return status code and message from service-thrown IssueCreationError', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Task that causes service error',
      status: 'Todo',
    };
    // Simulate the service throwing a specific IssueCreationError
    // FIX: Corrected constructor call: pass undefined instead of null for errorCode
    const serviceError = new IssueCreationError('Service validation failed', undefined, 409); // Example: 409 Conflict
    mockedCreateIssueService.mockRejectedValue(serviceError);

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(serviceError.statusCode);
    expect(response.body).toEqual({ message: serviceError.message });
    expect(mockedCreateIssueService).toHaveBeenCalled(); // Service *should* have been called before error
  });

   // Test Case 15: Handling an unexpected internal service error (generic Error)
   it('should return 500 for an unexpected service error', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Task that causes unexpected error',
      status: 'Todo',
    };
    // Simulate the service throwing a generic error
    const unexpectedError = new Error('Something went wrong in the service');
    mockedCreateIssueService.mockRejectedValue(unexpectedError);

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
    expect(mockedCreateIssueService).toHaveBeenCalled(); // Service *should* have been called before error
  });
});

// TODO: Add tests for GET /rest/api/2/issue, GET /rest/api/2/issue/:id, GET /rest/api/2/issue/byKey/:key, PUT /rest/api/2/issue/:id, DELETE /rest/api/2/issue/:id
// These tests will also need mocking for the dataStore or the service layer functions they call.
