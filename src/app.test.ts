import request from 'supertest';
import app from './app';

describe('GET /', () => {
  it('should return "Hello, world!" and status 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Hello, world!');
  });
});

describe('POST /rest/api/2/issue', () => {
  // Test case 1: Successful issue creation with valid data
  it('should return 200 for a valid issue creation', async () => {
    const validIssueData = {
      fields: {
        summary: 'Valid Issue Summary',
        description: 'This is a valid issue description.',
        issuetype: { name: 'Bug' },
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(validIssueData);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Issue created successfully');
  });

  // Test case 2: Failed issue creation with missing required fields
  it('should return 400 and Zod errors for missing summary', async () => {
    const invalidIssueData = {
      fields: {
        description: 'Description without summary.',
        issuetype: { name: 'Task' },
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
    // Check for specific error related to summary
    const summaryError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'summary'
    );
    expect(summaryError).toBeDefined();
    // Check for specific error message
    expect(summaryError.message).toBe('Required');
  });

  it('should return 400 and Zod errors for missing description', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Summary without description.',
        issuetype: { name: 'Task' },
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
    // Check for specific error related to description
    const descriptionError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'description'
    );
    expect(descriptionError).toBeDefined();
    // Check for specific error message
    expect(descriptionError.message).toBe('Required');
  });

  it('should return 400 and Zod errors for missing issuetype', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Summary without issuetype.',
        description: 'Description without issuetype.',
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
    // Check for specific error related to issuetype
    const issuetypeError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'issuetype'
    );
    expect(issuetypeError).toBeDefined();
    // Zod's default message for missing object/field
    expect(issuetypeError.message).toBe('Required');
  });

  it('should return 400 and Zod errors for empty summary', async () => {
    const invalidIssueData = {
      fields: {
        summary: '',
        description: 'Valid Description',
        issuetype: { name: 'Bug' }
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
    const summaryError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'summary'
    );
    expect(summaryError).toBeDefined();
    // Zod's default message for .min(1)
    expect(summaryError.message).toBe('Summary is required.');
  });

  it('should return 400 and Zod errors for empty description', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Valid Summary',
        description: '',
        issuetype: { name: 'Bug' }
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
    const descriptionError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'description'
    );
    expect(descriptionError).toBeDefined();
    expect(descriptionError.message).toBe('Description is required.');
  });

  // Test case for missing parent.key when parent object exists
  it('should return 400 and Zod errors for missing parent key when parent is provided', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Summary with parent object but no key',
        description: 'Description with parent object but no key',
        issuetype: { name: 'Task' },
      },
      parent: {} // Parent object exists but key is missing
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
    const parentKeyError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'parent' && err.path[1] === 'key'
    );
    expect(parentKeyError).toBeDefined();
    // Zod's default message for missing a required key within an object
    expect(parentKeyError.message).toBe('Required');
  });

  // Test case: Failed issue creation with missing 'fields' object
  it('should return 400 and Zod errors for missing fields object', async () => {
    const invalidIssueData = {
      // fields object is missing
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
    const fieldsError = res.body.errors.find((err: any) =>
      err.path && err.path[0] === 'fields'
    );
    expect(fieldsError).toBeDefined();
    expect(fieldsError.message).toBe('Required');
  });

  // Test case: Failed issue creation with empty body
  it('should return 400 and Zod errors for empty request body', async () => {
    const invalidIssueData = {}; // Empty body
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
    const fieldsError = res.body.errors.find((err: any) =>
      err.path && err.path[0] === 'fields'
    );
    expect(fieldsError).toBeDefined();
    expect(fieldsError.message).toBe('Required');
  });

  // Test case: Failed issue creation with issuetype object but missing 'name'
  it('should return 400 and Zod errors for issuetype object missing name', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Summary with issuetype missing name',
        description: 'Description with issuetype missing name',
        issuetype: {} // issuetype object exists but name is missing
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
    const issuetypeNameError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'issuetype' && err.path[2] === 'name'
    );
    expect(issuetypeNameError).toBeDefined();
    expect(issuetypeNameError.message).toBe("Issue type must be 'Bug', 'Task', or 'Story'.");
  });


  // Test case 3: Failed issue creation with incorrect data types
  it('should return 400 and Zod errors for invalid type for summary', async () => {
    const invalidIssueData = {
      fields: {
        summary: 123 as any, // Incorrect type
        description: 'Valid Description',
        issuetype: { name: 'Bug' },
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
     const summaryError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'summary'
    );
    expect(summaryError).toBeDefined();
    // Zod's default message for invalid type
    expect(summaryError.message).toBe('Expected string, received number');
  });

   it('should return 400 and Zod errors for invalid type for description', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Valid Summary',
        description: 123 as any, // Incorrect type
        issuetype: { name: 'Bug' },
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
     const descriptionError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'description'
    );
    expect(descriptionError).toBeDefined();
    // Zod's default message for invalid type
    expect(descriptionError.message).toBe('Expected string, received number');
  });

  it('should return 400 and Zod errors for invalid type for issuetype.name', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Valid Summary',
        description: 'Valid Description',
        issuetype: { name: 123 as any }, // Incorrect type
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
     const issuetypeNameError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'issuetype' && err.path[2] === 'name'
    );
    expect(issuetypeNameError).toBeDefined();
     // Zod's default message for invalid type
    expect(issuetypeNameError.message).toBe("Issue type must be 'Bug', 'Task', or 'Story'.");
  });

   it('should return 400 and Zod errors for invalid type for issuetype object', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Valid Summary',
        description: 'Valid Description',
        issuetype: 'Bug' as any, // Should be an object
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
     const issuetypeError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'issuetype'
    );
    expect(issuetypeError).toBeDefined();
    // Zod's default message for invalid type
    expect(issuetypeError.message).toBe('Expected object, received string');
  });


  // Test case 4: Failed issue creation with invalid enum value for issue type
  it('should return 400 and Zod errors for invalid issuetype name enum value', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Summary with invalid type.',
        description: 'Description with invalid type.',
        issuetype: { name: 'Feature' as any }, // Invalid enum value
      },
    };
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
    const issuetypeNameError = res.body.errors.find((err: any) =>
      Array.isArray(err.path) && err.path[0] === 'fields' && err.path[1] === 'issuetype' && err.path[2] === 'name'
    );
    expect(issuetypeNameError).toBeDefined();
    // Check for the custom error message from Zod enum schema
    expect(issuetypeNameError.message).toBe("Issue type must be 'Bug', 'Task', or 'Story'.");
  });
});
