import express from 'express';
import request from 'supertest';
import issueRoutes from './issueRoutes';
import * as issueController from '../controllers/issueController';

// Mock the issueController module
jest.mock('../controllers/issueController');

describe('issueRoutes', () => {
  let app: express.Application;
  const mockCreateIssue = issueController.createIssue as jest.Mock;

  // Set up the Express app before each test
  beforeEach(() => {
    app = express();
    // Add middleware to parse JSON body
    app.use(express.json());
    // Use the issue routes
    app.use('/', issueRoutes);

    // Reset mocks before each test
    mockCreateIssue.mockClear();
  });

  // Test case for POST /rest/api/2/issue
  test('should call createIssue controller and return 201 status with success message', async () => {
    // Arrange
    const sampleRequestBody = {
      summary: 'Test Issue',
      description: 'This is a test issue description.',
      project: 'TEST',
      issueType: 'Task',
    };

    // Mock the controller function implementation
    // Since the controller is already a placeholder returning 201,
    // we can mock its behavior to just resolve or not throw,
    // and then check if it was called.
    // If we wanted to test a specific return value from the controller,
    // we would mock it here. For this test, we just need to verify call and status.
    // The controller's current implementation directly sets the status and body.
    // We can mock it to simply call next() or end() if needed, but
    // for verifying the route handler correctly maps the request to the controller,
    // the main assertion is that the controller function is called.
    // However, to test the route correctly handling the controller's *response*,
    // we need the controller to *actually* execute its `res.status(201).json(...)` logic.
    // Therefore, instead of mocking the *implementation*, we just mock the function
    // reference to spy on it, but let the real controller logic run.

    // We need to restore the original implementation for this specific test
    // so that `res.status(201).json(...)` is actually called.
    // Alternatively, mock the implementation to perform the same action.
    // Let's mock the implementation to explicitly return the expected response.
    // This makes the test less dependent on the internal controller implementation detail (like using res.status directly)
    // and more focused on the route calling the controller and the *response* being correct.
    mockCreateIssue.mockImplementationOnce((req, res) => {
      res.status(201).json({ message: 'Issue created successfully (placeholder)' });
    });


    // Act
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(sampleRequestBody)
      .set('Accept', 'application/json'); // Set Accept header if needed

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Issue created successfully (placeholder)' });

    // Verify that the controller function was called exactly once
    expect(mockCreateIssue).toHaveBeenCalledTimes(1);

    // Optionally, verify that the controller was called with the correct request and response objects
    // This level of detail is often omitted as it couples the test tightly to Express internals,
    // but can be useful in complex scenarios. For this case, checking the call count is sufficient.
    // expect(mockCreateIssue).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
  });

  test('should call createIssue controller and return 400 status with error message for validation failure', async () => {
    // Arrange
    const sampleRequestBody = {
      // Missing required fields or invalid data to simulate validation failure
      summary: '', // Example of invalid data
      description: 'This should fail validation.',
      project: 'INVALID', // Example of potentially invalid project key
      issueType: 'Task',
    };
    const errorMessage = 'Validation failed: summary is required'; // Example error message

    // Mock the controller function implementation to simulate a 400 response
    mockCreateIssue.mockImplementationOnce((req, res) => {
      res.status(400).json({ message: errorMessage });
    });

    // Act
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(sampleRequestBody)
      .set('Accept', 'application/json');

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: errorMessage });
    expect(mockCreateIssue).toHaveBeenCalledTimes(1);
    // Optional: Check if the controller was called with the specific request body if needed
    // expect(mockCreateIssue).toHaveBeenCalledWith(expect.objectContaining({ body: sampleRequestBody }), expect.any(Object));
  });

  test('should call createIssue controller and return 500 status with error message for internal server error', async () => {
    // Arrange
    const sampleRequestBody = {
      summary: 'Test Issue for 500',
      description: 'This issue should trigger a server error.',
      project: 'ERROR', // Example project key that might cause an error
      issueType: 'Bug',
    };
    const errorMessage = 'An unexpected error occurred'; // Example server error message

    // Mock the controller function implementation to simulate a 500 response
    mockCreateIssue.mockImplementationOnce((req, res) => {
      // In a real controller, this might be triggered by a thrown error or a database failure
      res.status(500).json({ message: errorMessage });
    });

    // Act
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(sampleRequestBody)
      .set('Accept', 'application/json');

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: errorMessage });
    expect(mockCreateIssue).toHaveBeenCalledTimes(1);
    // Optional: Check if the controller was called with the specific request body if needed
    // expect(mockCreateIssue).toHaveBeenCalledWith(expect.objectContaining({ body: sampleRequestBody }), expect.any(Object));
  });
});
