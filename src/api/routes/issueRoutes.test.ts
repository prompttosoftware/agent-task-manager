import express, { Application } from 'express';
import request from 'supertest';
import issueRoutes from './issueRoutes';
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
      title: reqBody.summary,       // summary maps to title
      issueTypeName: reqBody.issueType, // issueType maps to issueTypeName
      description: reqBody.description, // description *should* be passed if present
      parentKey: null, // No parent for Task
    });
    // Verify the response body matches the structure and data returned by the mocked service
    expect(response.body).toEqual(mockCreatedIssue);
    // Also check expected fields are present and have plausible formats (basic check)
    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.id).toBe('string');
    expect(response.body).toHaveProperty('key');
    expect(typeof response.body.key).toBe('string');
    expect(response.body).toHaveProperty('issueType', reqBody.issueType);
    expect(response.body).toHaveProperty('summary', reqBody.summary);
    expect(response.body).toHaveProperty('description', reqBody.description); // Should be included if provided
    expect(response.body).toHaveProperty('status', 'Todo'); // Expect status set by service
    expect(response.body).toHaveProperty('createdAt');
    expect(typeof response.body.createdAt).toBe('string'); // ISO date string
    expect(response.body).toHaveProperty('updatedAt');
    expect(typeof response.body.updatedAt).toBe('string'); // ISO date string
    // Check for the correct key name used in the returned object (from the mock)
    expect(response.body).toHaveProperty('parentKey', null); // Task should not have parent
    // Ensure parentIssueKey (from request) is NOT in the returned object if not applicable
    expect(response.body).not.toHaveProperty('parentIssueKey');
  });

  // Test Case 1c: Successful creation for 'Story' issue type
  it('should return 201 for successful Story creation with required fields and description', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Story', // New issue type to test
      summary: 'As a user, I want...',
      description: 'Detailed description of the story acceptance criteria.', // Include description
      // No status needed in request body based on previous tests
      // No parentIssueKey needed for Story
    };

    // Simulate the service returning a successful issue creation
    const mockCreatedIssue: AnyIssue = {
      id: 'story-id-789',
      key: 'ATM-3',
      issueType: 'Story',
      summary: 'As a user, I want...',
      description: 'Detailed description of the story acceptance criteria.',
      status: 'Todo', // Service sets initial status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentKey: null, // Stories are not subtasks
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
      description: reqBody.description, // Description should be mapped and passed
      parentKey: null, // Story should not have a parent key
    });
    // Verify the response body matches the structure and data returned by the mocked service
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
    expect(response.body).toHaveProperty('parentKey', null); // Story should not have a parent
  });

  // Test Case 1d: Successful creation for 'Epic' issue type
  it('should return 201 for successful Epic creation with required fields and description', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Epic', // New issue type to test
      summary: 'Implement feature X',
      description: 'Description of the epic.', // Include description
      // No status needed in request body
      // No parentIssueKey needed for Epic
    };

    // Simulate the service returning a successful issue creation
    const mockCreatedIssue: AnyIssue = {
      id: 'epic-id-987',
      key: 'ATM-4',
      issueType: 'Epic',
      summary: 'Implement feature X',
      description: 'Description of the epic.',
      status: 'Todo', // Service sets initial status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentKey: null, // Epics are not subtasks
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
      description: reqBody.description, // Description should be mapped and passed
      parentKey: null, // Epic should not have a parent key
    });
    // Verify the response body matches the structure and data returned by the mocked service
    expect(response.body).toEqual(mockCreatedIssue);
    // Basic checks for expected fields
    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.id).toBe('string');
    expect(response.body).toHaveProperty('key');
    expect(typeof response.body.key).toBe('string');
    expect(response.body).toHaveProperty('issueType', reqBody.issueType);
    expect(response.body).toHaveProperty('summary', reqBody.summary);
    expect(response.body).toHaveProperty('status', 'Todo');
    expect(response.body).toHaveProperty('createdAt');
    expect(typeof response.body.createdAt).toBe('string'); // ISO date string
    expect(response.body).toHaveProperty('updatedAt');
    expect(typeof response.body.updatedAt).toBe('string'); // ISO date string
    expect(response.body).toHaveProperty('parentKey', null); // Epic should not have a parent
    expect(response.body).not.toHaveProperty('parentIssueKey');
  });

  // Test Case 1e: Successful creation for 'Bug' issue type
  it('should return 201 for successful Bug creation with required fields and description', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Bug', // New issue type to test
      summary: 'Fix critical error',
      description: 'Steps to reproduce the bug.', // Include description
      // No status needed in request body
      // No parentIssueKey needed for Bug
    };

    // Simulate the service returning a successful issue creation
    const mockCreatedIssue: AnyIssue = {
      id: 'bug-id-654',
      key: 'ATM-5',
      issueType: 'Bug',
      summary: 'Fix critical error',
      description: 'Steps to reproduce the bug.',
      status: 'Todo', // Service sets initial status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentKey: null, // Bugs are not subtasks
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
      description: reqBody.description, // Description should be mapped and passed
      parentKey: null, // Bug should not have a parent key
    });
    // Verify the response body matches the structure and data returned by the mocked service
    expect(response.body).toEqual(mockCreatedIssue);
    // Basic checks for expected fields
    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.id).toBe('string');
    expect(response.body).toHaveProperty('key');
    expect(typeof response.body.key).toBe('string');
    expect(response.body).toHaveProperty('issueType', reqBody.issueType);
    expect(response.body).toHaveProperty('summary', reqBody.summary);
    expect(response.body).toHaveProperty('status', 'Todo');
    expect(response.body).toHaveProperty('createdAt');
    expect(typeof response.body.createdAt).toBe('string'); // ISO date string
    expect(response.body).toHaveProperty('updatedAt');
    expect(typeof response.body.updatedAt).toBe('string'); // ISO date string
    expect(response.body).toHaveProperty('parentKey', null); // Bug should not have a parent
    expect(response.body).not.toHaveProperty('parentIssueKey');
  });

  // Test Case 1b: Successful creation of a Subtask
  it('should return 201 for successful subtask creation with required fields and parentIssueKey', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Subtask',
      summary: 'Implement subtask feature Y',
      // No status needed in request body
      parentIssueKey: 'ATM-1', // Required for Subtask in request body
    };

    // Simulate the service returning a successful issue creation
    const mockCreatedIssue: AnyIssue = {
      id: 'test-id-456',
      key: 'ATM-2',
      issueType: 'Subtask',
      summary: 'Implement subtask feature Y',
      status: 'Todo', // Service sets status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentKey: 'ATM-1', // Service uses parentKey
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
      description: undefined, // No description in reqBody
      parentKey: reqBody.parentIssueKey, // parentIssueKey maps to parentKey
    });
    // Verify the response body matches the structure and data returned by the mocked service
    expect(response.body).toEqual(mockCreatedIssue);
    // Basic checks for expected fields
    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.id).toBe('string');
    expect(response.body).toHaveProperty('key');
    expect(typeof response.body.key).toBe('string');
    expect(response.body).toHaveProperty('issueType', reqBody.issueType);
    expect(response.body).toHaveProperty('summary', reqBody.summary);
    expect(response.body).toHaveProperty('status', 'Todo');
    expect(response.body).toHaveProperty('createdAt');
    expect(typeof response.body.createdAt).toBe('string'); // ISO date string
    expect(response.body).toHaveProperty('updatedAt');
    expect(typeof response.body.updatedAt).toBe('string'); // ISO date string
    expect(response.body).toHaveProperty('parentKey', 'ATM-1'); // Subtask should have a parent
    expect(response.body).not.toHaveProperty('parentIssueKey'); // parentIssueKey is request-specific

  });

  // Test Case 2: Missing required fields (e.g., summary)
  it('should return 400 for missing required fields', async () => {
    // Arrange
    const reqBodyMissingSummary = {
      issueType: 'Task',
      // summary is missing
      status: 'Todo',
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBodyMissingSummary);

    // Assert
    expect(response.status).toBe(400);
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty for this type of validation error
    // Check for the specific error message content within the errorMessages array
    expect(response.body.errorMessages[0]).toContain('summary is required');
    // Ensure the service was NOT called
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
  });

  // Test Case 3: Invalid issueType
  it('should return 400 for invalid issueType', async () => {
    // Arrange
    const reqBodyInvalidType = {
      issueType: 'InvalidType', // Not 'Task' or 'Subtask'
      summary: 'Some summary',
      status: 'Todo',
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBodyInvalidType);

    // Assert
    expect(response.status).toBe(400);
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty
    // Check for the specific error message content within the errorMessages array
    expect(response.body.errorMessages[0]).toContain('issueType must be one of [Task, Subtask, Story, Epic, Bug]'); // Updated validation list based on 1c, 1d, 1e tests
    // Ensure the service was NOT called
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
  });

  // Test Case 4: Subtask missing parentIssueKey
  it('should return 400 for a Subtask missing parentIssueKey', async () => {
    // Arrange
    const reqBodySubtaskMissingParent = {
      issueType: 'Subtask',
      summary: 'Subtask without parent',
      status: 'Todo',
      // parentIssueKey is missing
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBodySubtaskMissingParent);

    // Assert
    expect(response.status).toBe(400);
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty
    // Check for the specific error message content within the errorMessages array
    expect(response.body.errorMessages[0]).toContain('parentIssueKey is required for Subtask');
    // Ensure the service was NOT called
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
  });

  // Test Case 7: parentIssueKey provided for non-Subtask issue type
  it('should return 400 if parentIssueKey is provided for a non-Subtask issue type', async () => {
    // Arrange
    const reqBodyWithParentKeyForTask = {
      issueType: 'Task', // Not a Subtask
      summary: 'Task with a parent key',
      // No status needed in request body
      parentIssueKey: 'ATM-1', // Should not be present for Task
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBodyWithParentKeyForTask);

    // Assert
    expect(response.status).toBe(400);
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty
    // Check for the specific error message content within the errorMessages array
    // This message depends on the controller's validation logic
    expect(response.body.errorMessages[0]).toContain('parentIssueKey is only allowed for Subtask issue type');
    // Ensure the service was NOT called
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
  });


  // Test Case 5: Service returns an error (e.g., IssueCreationError)
  it('should return 500 if issue service returns IssueCreationError', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Issue causing service error',
      status: 'Todo',
    };

    // Simulate the service throwing a specific error
    const serviceErrorMessage = 'Error creating issue in external system';
    mockedCreateIssueService.mockRejectedValue(new IssueCreationError(serviceErrorMessage));

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(500); // Internal Server Error
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty
    // The error message returned should be the specific service error message
    expect(response.body.errorMessages[0]).toBe(serviceErrorMessage); // Assuming the controller puts the error message in errorMessages
    // Ensure the service was called with the correct arguments before it failed
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: reqBody.summary,
      issueTypeName: reqBody.issueType,
      description: undefined, // Description not in reqBody
      parentKey: null,        // Not a subtask
    });
  });

  // Test Case 6: Service returns an unexpected error
  it('should return 500 if issue service returns an unexpected error', async () => {
    // Arrange
    const reqBody = {
      issueType: 'Task',
      summary: 'Issue causing unexpected service error',
      status: 'Todo',
    };

    // Simulate the service throwing a generic error
    const genericErrorMessage = 'Something went wrong internally';
    mockedCreateIssueService.mockRejectedValue(new Error(genericErrorMessage));

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(500); // Internal Server Error
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty
    // For unexpected errors, the controller might return a generic message in the errorMessages array
    expect(response.body.errorMessages[0]).toBe('Failed to create issue due to an unexpected error.'); // Assuming a generic error message
    // Ensure the service was called with the correct arguments before it failed
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: reqBody.summary,
      issueTypeName: reqBody.issueType,
      description: undefined, // Description not in reqBody
      parentKey: null,        // Not a subtask
    });
  });

  // --- New Test Cases for POST /rest/api/2/issue Edge Cases ---

  // Edge Case 1: Attempting to create a Subtask with a non-existent parent key.
  it('should return 400 if creating a Subtask with a non-existent parent key', async () => {
    // Arrange
    const nonExistentParentKey = 'NON-EXISTENT-123';
    const reqBody = {
      issueType: 'Subtask',
      summary: 'Subtask with non-existent parent',
      parentIssueKey: nonExistentParentKey,
    };

    // Simulate the service throwing an error because the parent was not found
    const errorMessage = `Parent issue ${nonExistentParentKey} not found.`;
    mockedCreateIssueService.mockRejectedValue(new IssueCreationError(errorMessage));

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty
    // Expect the specific error message in the errorMessages array
    expect(response.body.errorMessages[0]).toBe(errorMessage);
    // Ensure the service was called with the intended data before it failed
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: reqBody.summary,
      issueTypeName: reqBody.issueType,
      description: undefined,
      parentKey: reqBody.parentIssueKey,
    });
  });

  // Edge Case 2: Attempting to create a Subtask with a parent that is not a Task or Story.
  it('should return 400 if creating a Subtask with an invalid parent type (e.g., Epic)', async () => {
    // Arrange
    const invalidParentKey = 'EPIC-ABC'; // Assume this key exists but belongs to an Epic
    const reqBody = {
      issueType: 'Subtask',
      summary: 'Subtask with invalid parent type',
      parentIssueKey: invalidParentKey,
    };

    // Simulate the service throwing an error because the parent type is invalid
    const errorMessage = `Parent issue ${invalidParentKey} is not a valid parent type (Task or Story).`;
    mockedCreateIssueService.mockRejectedValue(new IssueCreationError(errorMessage));

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBody);

    // Assert
    expect(response.status).toBe(400);
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty
    // Expect the specific error message in the errorMessages array
    expect(response.body.errorMessages[0]).toBe(errorMessage);
    // Ensure the service was called with the intended data before it failed
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: reqBody.summary,
      issueTypeName: reqBody.issueType,
      description: undefined,
      parentKey: reqBody.parentIssueKey,
    });
  });

  // Edge Case 3: Attempting to create a Task/Story with a non-existent parent key. (Covered by the more general case 7)
  // Edge Case 4: Attempting to create a Task/Story with a parent that is not an Epic. (Covered by the more general case 7)
  // Note: Based on the current validation (Test Case 7), providing *any* parentIssueKey for Task/Story/Epic/Bug results in 400 at the controller level
  // because parentIssueKey is only allowed for Subtask. We will add tests for Epic and Bug below to reinforce this validation for other types.

  // Edge Case 5a: Attempting to create an Epic with any parent key provided.
  it('should return 400 if parentIssueKey is provided for an Epic issue type', async () => {
    // Arrange
    const reqBodyWithParentKeyForEpic = {
      issueType: 'Epic', // Not a Subtask
      summary: 'Epic with a parent key',
      parentIssueKey: 'SOME-KEY', // Should not be present for Epic
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBodyWithParentKeyForEpic);

    // Assert
    expect(response.status).toBe(400);
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty
    // Check the expected error message from the controller validation in the errorMessages array
    expect(response.body.errorMessages[0]).toContain('parentIssueKey is only allowed for Subtask issue type');
    // Ensure the service was NOT called
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
  });

  // Edge Case 5b: Attempting to create a Bug with any parent key provided.
  it('should return 400 if parentIssueKey is provided for a Bug issue type', async () => {
    // Arrange
    const reqBodyWithParentKeyForBug = {
      issueType: 'Bug', // Not a Subtask
      summary: 'Bug with a parent key',
      parentIssueKey: 'SOME-KEY', // Should not be present for Bug
    };

    // Act
    const response = await request(app).post('/rest/api/2/issue').send(reqBodyWithParentKeyForBug);

    // Assert
    expect(response.status).toBe(400);
    // The controller should return a specific error structure
    expect(response.body).toHaveProperty('errorMessages');
    expect(Array.isArray(response.body.errorMessages)).toBe(true);
    expect(response.body.errorMessages.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual({}); // Expect errors object to be empty
    // Check the expected error message from the controller validation in the errorMessages array
    expect(response.body.errorMessages[0]).toContain('parentIssueKey is only allowed for Subtask issue type');
    // Ensure the service was NOT called
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
  });

  // Note: Test Case 7 already covers Task with parentIssueKey.
  // Test Case 3 & 4 (Task/Story with non-existent/invalid parent) are covered by the fact that
  // parentIssueKey is rejected *at all* for Task/Story by controller validation.
  // If the validation logic were different (e.g., allowing parentIssueKey but validating the parent existence/type later),
  // separate tests for Task/Story would be needed, potentially mocking `issueService.createIssue`
  // to fail specifically on parent validation for those types.

}); // End of describe POST /rest/api/2/issue (Mocked Service)
