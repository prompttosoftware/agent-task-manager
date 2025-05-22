import request from 'supertest';
import app from '../app';

// Mock the issueService to control its behavior during the test.
// This isolates the test to focus on the controller and route logic,
// not the actual service implementation which might involve databases or external calls.
jest.mock('../../services/issueService');

// Import the mocked function and cast it to a Jest Mock for easier access to mock methods
import { createIssue as mockCreateIssueService } from '../../services/issueService';
const createIssueService = mockCreateIssueService as jest.Mock;

describe('POST /rest/api/2/issue', () => {
  // Reset mocks before each test to ensure test independence
  beforeEach(() => {
    createIssueService.mockClear();
  });

  test('should create an issue and return 201 with application/json content type', async () => {
    // Define the expected successful return value from the mocked service.
    // This simulates the successful creation of an issue as expected by the controller.
    const mockCreatedIssue = {
      id: '10001',
      key: 'TEST-123',
      self: '/rest/api/2/issue/TEST-123', // Use relative URL as per service implementation
      // The service returns more fields, but the controller only sends id, key, self in the response.
      // We define the mock return value to match what the controller expects from the service,
      // even if the controller only uses a subset for the final HTTP response body.
      fields: { /* ... other fields */ }
    };

    // Configure the mock service to resolve successfully with the mock data
    createIssueService.mockResolvedValue(mockCreatedIssue);

    // Define a valid request body that meets the requirements checked by the controller
    const validIssueRequestBody = {
      fields: {
        project: {
          key: 'TEST',
        },
        summary: 'Test issue created by Supertest',
        issuetype: {
          name: 'Bug', // Controller expects 'name', not 'id' for validation
        },
        description: 'This is a test description for the issue.',
        // parent is optional, let's omit it for this basic test
        // parent: { key: 'PARENT-1' }
      },
    };

    // Send the POST request to the target endpoint using supertest
    const response = await request(app)
      .post('/rest/api/2/issue')
      .set('Accept', 'application/json') // Standard header to indicate preferred response type
      .send(validIssueRequestBody)
      .expect(201) // Assert the HTTP status code is 201 (Created)
      .expect('Content-Type', /application\/json/); // Assert the response Content-Type header is application/json

    // Assert that the response body matches the structure and content expected
    // based on the controller's successful response handling.
    expect(response.body).toEqual({
      id: mockCreatedIssue.id,
      key: mockCreatedIssue.key,
      self: mockCreatedIssue.self,
    });

    // Verify that the mock service function was called correctly
    // The arguments should match how the controller extracts data from the request body
    // Note: The service expects issueTypeId, but the controller maps the issue type name to an ID internally before calling the service, or the service logic itself maps it.
    // Based on the controller code (`issueTypeName: fields.issuetype.name as IssueType`), the controller passes the *name* to the service.
    // Let's adjust the expected call parameters to match the controller's implementation detail.
    expect(createIssueService).toHaveBeenCalledTimes(1);
    // The controller calls `createIssueService` with an object `{ projectKey, issueTypeName, summary, description, parentKey }`.
    // The issueTypeName is passed directly from the request body.
    expect(createIssueService).toHaveBeenCalledWith({
      projectKey: validIssueRequestBody.fields.project.key,
      issueTypeName: validIssueRequestBody.fields.issuetype.name, // Controller passes 'name' as IssueType
      summary: validIssueRequestBody.fields.summary,
      description: validIssueRequestBody.fields.description,
      parentKey: undefined, // As omitted in the request body
    });
  });

  // Additional tests would typically be added here to cover validation errors (400)
  // for missing/invalid fields (project key, issue type name, summary, invalid issue type name),
  // and server errors (500) from the service layer,
  // but the request specifically asked for the successful 201 case.
});
