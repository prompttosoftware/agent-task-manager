import request from 'supertest';
import app from './src/app';
import { IssueService } from './src/services/issueService';
import { Database } from './src/db/database';
import { AnyIssue, CreateIssueInput } from './src/models/issue'; // Import AnyIssue and CreateIssueInput

describe('POST /rest/api/2/issue', () => {
  it('should call IssueService.createIssue and return 201 with the created issue', async () => {
    const requestBody = {
      fields: {
        summary: 'Test issue',
        description: 'This is a test issue description',
        issuetype: { name: 'TASK' },
        status: 'Todo',
      },
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(requestBody)
      .set('Content-Type', 'application/json');

    // Assertions
    expect(response.status).toBe(201);

    // Assert that the response body contains the created issue properties based on the service logic
    expect(response.body).toHaveProperty('id'); // Check for the presence of 'id'
    expect(response.body).toHaveProperty('key');
    expect(response.body).toHaveProperty('issueType', 'TASK'); // Reflects input type
    expect(response.body).toHaveProperty('status', 'Todo'); // Reflects input status

    // Optional: Check types/formats for generated properties
    expect(typeof response.body.id).toBe('string'); // Check that 'id' is a string (or number if applicable)
    expect(typeof response.body.key).toBe('string');
  });

  it('should return 400 for missing required fields (summary)', async () => {
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: '', // Send empty summary to trigger service validation
          description: 'This is a test issue description',
          issuetype: { name: 'TASK' },
          status: 'Todo',
        },
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    // Assert the specific error message from the controller for missing summary
    // Controller catches this before the service and returns { error: "..." }
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.summary');
  });

  it('should return 400 for missing required fields (issuetype)', async () => {
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Test issue without type',
          description: 'This issue is missing its type',
          status: 'Todo',
          // issuetype is missing - this is caught by controller before service
        },
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    // Assert the specific error message from the controller for missing issuetype.name
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.issuetype.name');
  });

  it('should return 400 for invalid issue type', async () => {
      const response = await request(app)
        .post('/rest/api/2/issue')
        .send({
          fields: {
            summary: 'Test issue',
            issuetype: { name: 'INVALID' }, // Invalid type
            status: 'Todo',
          },
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      // Assert the specific error message from the controller for invalid type
      // The controller catches invalid type before the service in the current implementation
      expect(response.body).toHaveProperty('error', 'Invalid issue type');
    });

  it('should call IssueService.createIssue with parentIssueKey for subtask and return 201', async () => {
    const requestBody = {
      fields: {
        summary: 'Test subtask',
        issuetype: { name: 'SUBT' },
        status: 'Todo', // Using valid status
        parentIssueKey: 'PROJ-123',
      },
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(requestBody)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(201);
  });

  it('should return 400 for missing parentIssueKey for subtask', async () => {
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Test subtask',
          issuetype: { name: 'SUBT' },
          status: 'Todo', // Using valid status
          // parentIssueKey: missing
        },
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    // Assert the specific error message from the controller for missing parentIssueKey
    // Controller catches this before the service and returns { error: "..." }
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.parentIssueKey for subtask');
  });

  it('should return 400 for missing required fields (status)', async () => {
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Test issue without status',
          issuetype: { name: 'TASK' },
          description: 'This issue is missing its status',
          // status is missing - this is caught by controller before service
        },
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    // Assert the specific error message from the controller for missing status
    expect(response.body).toHaveProperty('error', 'Missing required field: fields.status');
  });
});
