import request from 'supertest';
import app from '../../app';

describe('issueController', () => {
  describe('POST /rest/api/2/issue', () => {
    const validPayload = {
      fields: {
        project: { key: 'TEST' },
        issuetype: { id: '10002' },
        summary: 'This is a valid test issue summary',
        description: 'Optional description',
      },
    };

    test('should return 201 status for a valid request', async () => {
      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(validPayload);

      expect(res.status).toBe(201);
      // The controller currently returns a simple message, not the created issue details
      expect(res.body).toEqual({ message: 'Issue creation request received' });
    });

    test('should return 400 status if project key is missing', async () => {
      const invalidPayload = {
        fields: {
          project: { }, // Missing key inside project
          issuetype: { id: '10002' },
          summary: 'This is a test issue summary',
        },
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Project key is required' });
    });

    test('should return 400 status if issue type ID is missing', async () => {
      const invalidPayload = {
        fields: {
          project: { key: 'TEST' },
          issuetype: { }, // Missing id inside issuetype
          summary: 'This is a test issue summary',
        },
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Issue type ID is required' });
    });

    test('should return 400 status if summary is missing', async () => {
      const invalidPayload = {
        fields: {
          project: { key: 'TEST' },
          issuetype: { id: '10002' },
          // summary is missing entirely
        },
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Summary is required' });
    });

    test('should return 400 status if fields object is missing', async () => {
      const invalidPayload = {
        // fields is missing entirely
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      // The controller checks for fields?.project?.key first, which will be undefined
      expect(res.body).toEqual({ error: 'Project key is required' });
    });

    test('should return 400 status if project object is missing', async () => {
      const invalidPayload = {
        fields: {
          // project is missing entirely
          issuetype: { id: '10002' },
          summary: 'This is a test issue summary',
        },
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      // The controller checks for fields?.project?.key first, which will be undefined
      expect(res.body).toEqual({ error: 'Project key is required' });
    });

    test('should return 400 status if issuetype object is missing', async () => {
      const invalidPayload = {
        fields: {
          project: { key: 'TEST' },
          // issuetype is missing entirely
          summary: 'This is a test issue summary',
        },
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      // The controller checks for fields?.issuetype?.id
      expect(res.body).toEqual({ error: 'Issue type ID is required' });
    });
  });
});
