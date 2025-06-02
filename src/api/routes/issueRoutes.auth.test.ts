import request from 'supertest';
import app from '../../app'; // Assuming app.ts exports the express app
import { Buffer } from 'buffer';

// Store original environment variables
const originalAuthUsername = process.env.AUTH_USERNAME;
const originalAuthPassword = process.env.AUTH_PASSWORD;

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'testpassword';

// Minimal valid payload for creating an issue (assuming a Task structure)
const validIssuePayload = {
  title: 'Test Task',
  description: 'This is a test task description.',
  status: 'Open', // Assuming 'Open' is a valid status
  type: 'Task', // Assuming 'Task' is a valid type
};

describe('/issues POST authentication', () => {
  beforeEach(() => {
    // Set test environment variables before each test
    process.env.AUTH_USERNAME = TEST_USERNAME;
    process.env.AUTH_PASSWORD = TEST_PASSWORD;
  });

  afterEach(() => {
    // Restore original environment variables after each test
    if (originalAuthUsername !== undefined) {
      process.env.AUTH_USERNAME = originalAuthUsername;
    } else {
      delete process.env.AUTH_USERNAME;
    }
    if (originalAuthPassword !== undefined) {
      process.env.AUTH_PASSWORD = originalAuthPassword;
    } else {
      delete process.env.AUTH_PASSWORD;
    }
  });

  // Case 1: No authentication header
  it('should return 401 if no Authorization header is provided', async () => {
    const response = await request(app).post('/issues').send(validIssuePayload); // Send a valid payload even if auth fails first

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      errorMessages: ['Authorization header missing.'],
    });
  });

  // Case 2: Invalid Authorization header format (not Basic)
  it('should return 401 if Authorization header is not in Basic format', async () => {
    const response = await request(app)
      .post('/issues')
      .set('Authorization', 'Bearer some-token')
      .send(validIssuePayload);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      errorMessages: ['Authentication failed.'],
    });
  });

  // Case 3: Invalid Authorization header format (Basic but not two parts)
  it('should return 401 if Basic Authorization header is malformed (not two parts)', async () => {
    const response = await request(app)
      .post('/issues')
      .set('Authorization', 'Basic') // Missing credentials part
      .send(validIssuePayload);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      errorMessages: ['Authentication failed.'],
    });
  });

  // Case 4: Invalid Base64 credentials
  it('should return 401 if Basic credentials part is not valid Base64', async () => {
    const response = await request(app)
      .post('/issues')
      .set('Authorization', 'Basic invalid-base64-string%')
      .send(validIssuePayload);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      errorMessages: ['Authentication failed.'],
    });
  });

  // Case 5: Invalid credentials format (Base64 decodes but not username:password)
  it('should return 401 if Base64 decoded credentials are not in username:password format', async () => {
    const base64Malformed = Buffer.from('just-a-string-no-colon').toString('base64');
    const response = await request(app)
      .post('/issues')
      .set('Authorization', `Basic ${base64Malformed}`)
      .send(validIssuePayload);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      errorMessages: ['Authentication failed.'],
    });
  });

  // Case 6: Invalid Basic authentication (wrong password)
  it('should return 401 if Basic authentication credentials are invalid (wrong password)', async () => {
    const wrongPasswordCredentials = Buffer.from(`${TEST_USERNAME}:wrongpassword`).toString('base64');
    const response = await request(app)
      .post('/issues')
      .set('Authorization', `Basic ${wrongPasswordCredentials}`)
      .send(validIssuePayload);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      errorMessages: ['Authentication failed.'],
    });
  });

  // Case 7: Invalid Basic authentication (wrong username)
  it('should return 401 if Basic authentication credentials are invalid (wrong username)', async () => {
    const wrongUsernameCredentials = Buffer.from(`wronguser:${TEST_PASSWORD}`).toString('base64');
    const response = await request(app)
      .post('/issues')
      .set('Authorization', `Basic ${wrongUsernameCredentials}`)
      .send(validIssuePayload);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      errorMessages: ['Authentication failed.'],
    });
  });

  // Case 8: Valid Basic authentication
  it('should return 201 if Basic authentication credentials are valid', async () => {
    const validCredentials = Buffer.from(`${TEST_USERNAME}:${TEST_PASSWORD}`).toString('base64');

    // Note: The actual createIssue controller needs to be functional for this to return 201.
    // If the controller throws an error or returns a different status, this test might fail
    // even if authentication passed. This test primarily verifies that the 401 from the
    // auth middleware is *not* returned. Assuming the controller returns 201 on success.
    const response = await request(app)
      .post('/issues')
      .set('Authorization', `Basic ${validCredentials}`)
      .send(validIssuePayload);

    expect(response.status).toBe(201);
    // Further assertions could be added here to check the response body if createIssue
    // controller returns something specific, e.g., the created issue object.
    // Example: expect(response.body).toHaveProperty('id');
    // Example: expect(response.body.title).toBe('Test Task');
  });

  // Optional: Test server misconfiguration case if needed, but requires
  // temporarily unsetting AUTH_USERNAME/PASSWORD within a test case.
  // Keeping it simple and relying on beforeEach/afterEach for standard scenarios.
});
