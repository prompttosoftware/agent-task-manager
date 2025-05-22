import request from 'supertest';
import app from '../../app';
import { createIssue as createIssueService } from '../../services/issueService';
import { IssueType } from '../../models/issue';

jest.mock('../../services/issueService');

describe('issueController', () => {
  describe('POST /rest/api/2/issue', () => {
    const validPayload = {
      fields: {
        project: { key: 'TEST' },
        issuetype: { name: 'Bug' },
        summary: 'This is a valid test issue summary',
        description: 'Optional description',
      },
    };

    test('should return 201 status for a valid request', async () => {
      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(validPayload);

      expect(res.status).toBe(201);
      // The controller currently returns the created issue details
      expect(res.body).toEqual({
        id: expect.any(String),
        key: expect.any(String),
        self: expect.any(String),
      });
    });

    test('should return 400 status if project key is missing', async () => {
      const invalidPayload = {
        fields: {
          project: { }, // Missing key inside project
          issuetype: { name: 'Bug' },
          summary: 'This is a test issue summary',
        },
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Project key is required' });
    });

    test('should return 400 status if issue type name is missing', async () => {
      const invalidPayload = {
        fields: {
          project: { key: 'TEST' },
          issuetype: { }, // Missing name inside issuetype
          summary: 'This is a test issue summary',
        },
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Issue type name is required' });
    });

    test('should return 400 status if summary is missing', async () => {
      const invalidPayload = {
        fields: {
          project: { key: 'TEST' },
          issuetype: { name: 'Bug' },
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
          issuetype: { name: 'Bug' },
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
      // The controller checks for fields?.issuetype?.name
      expect(res.body).toEqual({ error: 'Issue type name is required' });
    });

    test('should return 201 when parent key exists', async () => {
      (createIssueService as jest.Mock).mockResolvedValueOnce({
        id: '123',
        key: 'TEST-1',
        self: 'http://localhost:3000/rest/api/2/issue/123',
      });
      const payloadWithParent = {
        fields: {
          project: { key: 'TEST' },
          issuetype: { name: 'Bug' },
          summary: 'This is a test issue with a parent',
          parent: { key: 'TEST-123' },
        },
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(payloadWithParent);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: '123',
        key: 'TEST-1',
        self: 'http://localhost:3000/rest/api/2/issue/123',
      });
      expect(createIssueService).toHaveBeenCalledWith(expect.objectContaining({
        parentKey: 'TEST-123',
      }));
    });

    test('should return 500 when parent key does not exist', async () => {
        (createIssueService as jest.Mock).mockRejectedValueOnce(new Error('Parent issue not found'));
        const payloadWithParent = {
            fields: {
                project: { key: 'TEST' },
                issuetype: { name: 'Bug' },
                summary: 'This is a test issue with a non-existent parent',
                parent: { key: 'TEST-999' },
            },
        };

        const res = await request(app)
            .post('/rest/api/2/issue')
            .send(payloadWithParent);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to create issue' });
        expect(createIssueService).toHaveBeenCalledWith(expect.objectContaining({
            parentKey: 'TEST-999',
        }));
    });

    test('should return 400 if issue type is invalid', async () => {
      const invalidPayload = {
        fields: {
          project: { key: 'TEST' },
          issuetype: { name: 'InvalidType' },
          summary: 'This is a test issue summary',
        },
      };

      const res = await request(app)
        .post('/rest/api/2/issue')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid issue type' });
    });
  });
});
