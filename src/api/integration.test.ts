// src/tests/integration/integration.test.ts
import * as request from 'supertest';
import { app } from '../../app'; // Assuming you have an app instance
import { db } from '../../src/db/database'; // Assuming you have a database connection
import { WebhookService } from '../../api/services/webhook.service'; // Import the WebhookService
import { Webhook } from '../../api/models/webhook';
import { registerWebhook } from '../../api/controllers/webhook.controller';
import * as webhookService from '../../api/services/webhook.service'; // Import the webhook service
import { mock } from 'jest-mock';

// Mock the webhook processing service
jest.mock('../../api/services/webhook.service');

describe('Integration Tests', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await db.exec('DELETE FROM issues');
    await db.exec('DELETE FROM boards');
    await db.exec('DELETE FROM epics');
    await db.exec('DELETE FROM webhooks');
    jest.clearAllMocks(); // Clear mocks after each test
  });

  afterAll(async () => {
    // Close the database connection after all tests
    // await db.end(); // if you are using a connection pool
  });

  // Issue Controller Tests (Existing - Keeping for context)
  describe('IssueController', () => {
    // ... (Issue Controller tests from the original file)
    describe('POST /issues', () => {
      it('should create an issue and persist it in the database', async () => {
        const newIssue = {
          summary: 'Test issue',
          description: 'This is a test issue',
          status: 'open',
        };

        const response = await request(app)
          .post('/issues')
          .send(newIssue)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.summary).toBe(newIssue.summary);

        // Verify data in the database
        const dbResponse = await db.query('SELECT * FROM issues WHERE id = $1', [response.body.id]);
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].summary).toBe(newIssue.summary);
      });

      it('should return 400 if validation fails', async () => {
        const invalidIssue = {
          description: 'This is a test issue',
          status: 'open',
        };

        await request(app).post('/issues').send(invalidIssue).expect(400);
      });
    });

    describe('PUT /issues/:id', () => {
      it('should update an issue and persist the changes', async () => {
        // Create an issue first
        const createResponse = await request(app)
          .post('/issues')
          .send({ summary: 'Initial summary', description: 'Initial description', status: 'open' })
          .expect(201);
        const issueId = createResponse.body.id;

        const updateData = {
          summary: 'Updated summary',
          description: 'Updated description',
          status: 'in progress',
        };

        const response = await request(app)
          .put(`/issues/${issueId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.summary).toBe(updateData.summary);
        expect(response.body.description).toBe(updateData.description);
        expect(response.body.status).toBe(updateData.status);

        // Verify data in the database
        const dbResponse = await db.query('SELECT * FROM issues WHERE id = $1', [issueId]);
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].summary).toBe(updateData.summary);
        expect(dbResponse.rows[0].description).toBe(updateData.description);
        expect(dbResponse.rows[0].status).toBe(updateData.status);
      });

      it('should return 400 for an invalid id', async () => {
        await request(app).put('/issues/invalid').send({ summary: 'Updated summary' }).expect(400);
      });

      it('should return 404 if issue not found', async () => {
        await request(app).put('/issues/9999').send({ summary: 'Updated summary' }).expect(404);
      });
    });

    describe('GET /issues/:id', () => {
      it('should retrieve an issue by ID', async () => {
        // Create an issue first
        const createResponse = await request(app)
          .post('/issues')
          .send({ summary: 'Test summary', description: 'Test description', status: 'open' })
          .expect(201);
        const issueId = createResponse.body.id;

        const response = await request(app).get(`/issues/${issueId}`).expect(200);

        expect(response.body.id).toBe(issueId);
        expect(response.body.summary).toBe('Test summary');
      });

      it('should return 400 for an invalid id', async () => {
        await request(app).get('/issues/invalid').expect(400);
      });

      it('should return 404 if issue not found', async () => {
        await request(app).get('/issues/9999').expect(404);
      });
    });

    describe('DELETE /issues/:id', () => {
      it('should delete an issue', async () => {
        // Create an issue first
        const createResponse = await request(app)
          .post('/issues')
          .send({ summary: 'Test summary', description: 'Test description', status: 'open' })
          .expect(201);
        const issueId = createResponse.body.id;

        await request(app).delete(`/issues/${issueId}`).expect(204);

        // Verify the issue is deleted from the database
        const dbResponse = await db.query('SELECT * FROM issues WHERE id = $1', [issueId]);
        expect(dbResponse.rows.length).toBe(0);
      });

      it('should return 400 for an invalid id', async () => {
        await request(app).delete('/issues/invalid').expect(400);
      });

      it('should return 404 if issue not found', async () => {
        await request(app).delete('/issues/9999').expect(404);
      });
    });

    describe('GET /issues', () => {
      it('should list all issues', async () => {
        // Create some issues first
        await request(app)
          .post('/issues')
          .send({ summary: 'Test summary 1', description: 'Test description 1', status: 'open' });
        await request(app)
          .post('/issues')
          .send({ summary: 'Test summary 2', description: 'Test description 2', status: 'in progress' });

        const response = await request(app).get('/issues').expect(200);

        expect(response.body.length).toBeGreaterThanOrEqual(2);
        // You might want to add more specific checks here,
        // e.g., checking for the presence of the test issues you created.
      });

      it('should list issues with filters', async () => {
        // Create some issues first, one with the status we want to filter by
        await request(app)
          .post('/issues')
          .send({ summary: 'Test summary 1', description: 'Test description 1', status: 'open' });
        await request(app)
          .post('/issues')
          .send({ summary: 'Test summary 2', description: 'Test description 2', status: 'in progress' });

        const response = await request(app).get('/issues?status=open').expect(200);

        expect(response.body.length).toBeGreaterThanOrEqual(1);
        expect(response.body[0].status).toBe('open');
      });
    });
  });

  // Board Controller Tests
  describe('BoardController', () => {
    describe('POST /boards', () => {
      it('should create a board and persist it in the database', async () => {
        const newBoard = {
          name: 'Test Board',
          description: 'This is a test board',
        };

        const response = await request(app)
          .post('/boards')
          .send(newBoard)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(newBoard.name);

        // Verify data in the database
        const dbResponse = await db.query('SELECT * FROM boards WHERE id = $1', [response.body.id]);
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].name).toBe(newBoard.name);
      });
    });

    describe('GET /api/boards', () => {
      it('should list all boards', async () => {
        // Create some boards first
        await request(app).post('/boards').send({ name: 'Board 1', description: 'Desc 1' });
        await request(app).post('/boards').send({ name: 'Board 2', description: 'Desc 2' });

        const response = await request(app).get('/api/boards').expect(200);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('GET /api/boards/:id', () => {
      it('should get a board by id', async () => {
        // Create a board first
        const createResponse = await request(app)
          .post('/boards')
          .send({ name: 'Test Board', description: 'Test Description' })
          .expect(200);
        const boardId = createResponse.body.id;

        const response = await request(app).get(`/api/boards/${boardId}`).expect(200);
        expect(response.body.id).toBe(boardId);
        expect(response.body.name).toBe('Test Board');
      });

      it('should return 400 for an invalid id', async () => {
        await request(app).get('/api/boards/invalid').expect(400);
      });

      it('should return 404 if board not found', async () => {
        await request(app).get('/api/boards/9999').expect(404);
      });
    });
  });

  // Epic Controller Tests
  describe('EpicController', () => {
    describe('POST /api/epics', () => {
      it('should create an epic and persist it in the database', async () => {
        const newEpic = {
          key: 'TEST-1',
          name: 'Test Epic',
        };

        const response = await request(app)
          .post('/api/epics')
          .send(newEpic)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.key).toBe(newEpic.key);
        expect(response.body.name).toBe(newEpic.name);

        // Verify data in the database
        const dbResponse = await db.query('SELECT * FROM epics WHERE key = $1', [newEpic.key]);
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].key).toBe(newEpic.key);
        expect(dbResponse.rows[0].name).toBe(newEpic.name);
      });

      it('should return 400 if validation fails', async () => {
        const invalidEpic = {
          name: 'Test Epic', // Missing key
        };

        await request(app).post('/api/epics').send(invalidEpic).expect(400);
      });
    });

    describe('GET /api/epics', () => {
      it('should list all epics', async () => {
        // Create some epics first
        await request(app).post('/api/epics').send({ key: 'TEST-1', name: 'Epic 1' });
        await request(app).post('/api/epics').send({ key: 'TEST-2', name: 'Epic 2' });

        const response = await request(app).get('/api/epics').expect(200);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('GET /api/epics/:epicKey', () => {
      it('should get an epic by key', async () => {
        // Create an epic first
        await request(app).post('/api/epics').send({ key: 'TEST-3', name: 'Epic 3' }).expect(201);

        const response = await request(app).get('/api/epics/TEST-3').expect(200);
        expect(response.body.key).toBe('TEST-3');
        expect(response.body.name).toBe('Epic 3');
      });

      it('should return 404 if epic not found', async () => {
        await request(app).get('/api/epics/NON-EXISTENT').expect(404);
      });
    });

    describe('PUT /api/epics/:epicKey', () => {
      it('should update an epic and persist the changes', async () => {
        // Create an epic first
        await request(app).post('/api/epics').send({ key: 'TEST-4', name: 'Epic 4' }).expect(201);

        const updateData = {
          name: 'Updated Epic',
        };

        const response = await request(app).put('/api/epics/TEST-4').send(updateData).expect(200);

        expect(response.body.key).toBe('TEST-4');
        expect(response.body.name).toBe(updateData.name);

        // Verify data in the database
        const dbResponse = await db.query('SELECT * FROM epics WHERE key = $1', ['TEST-4']);
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].name).toBe(updateData.name);
      });

      it('should return 400 if validation fails', async () => {
        // Create an epic first
        await request(app).post('/api/epics').send({ key: 'TEST-5', name: 'Epic 5' }).expect(201);

        const invalidUpdate = {
          key: 123, // Invalid key
        };

        await request(app).put('/api/epics/TEST-5').send(invalidUpdate).expect(400);
      });

      it('should return 404 if epic not found', async () => {
        const updateData = {
          name: 'Updated Epic',
        };
        await request(app).put('/api/epics/NON-EXISTENT').send(updateData).expect(404);
      });
    });

    describe('DELETE /api/epics/:epicKey', () => {
      it('should delete an epic', async () => {
        // Create an epic first
        await request(app).post('/api/epics').send({ key: 'TEST-6', name: 'Epic 6' }).expect(201);

        await request(app).delete('/api/epics/TEST-6').expect(204);

        // Verify the epic is deleted from the database
        const dbResponse = await db.query('SELECT * FROM epics WHERE key = $1', ['TEST-6']);
        expect(dbResponse.rows.length).toBe(0);
      });

      it('should return 404 if epic not found', async () => {
        await request(app).delete('/api/epics/NON-EXISTENT').expect(404);
      });
    });

    describe('GET /api/epics/:epicKey/issues', () => {
      it('should get issues for an epic', async () => {
        // This test assumes you have a way to associate issues with epics in your database.
        // For example, you might have an 'epic_issues' table.

        // Create an epic
        await request(app).post('/api/epics').send({ key: 'TEST-7', name: 'Epic 7' }).expect(201);

        // Assuming you have a way to create issues and associate them with the epic.
        // For example, you might have an endpoint like POST /issues/:epicKey.
        // The following is a placeholder, replace it with your actual issue creation logic.

        // Create an issue and associate with the epic
        await request(app)
          .post('/issues')
          .send({ summary: 'Issue for Epic 7', description: 'Description', status: 'open' })
          .expect(201);

        // Get issues for the epic
        const response = await request(app).get('/api/epics/TEST-7/issues').expect(200);

        expect(response.body).toBeDefined();
        // Add more specific checks here, e.g., checking for the presence of the test issues you created.
        // For example, check if the response body contains issues associated with the epic.
      });

      it('should return 404 if epic not found', async () => {
        await request(app).get('/api/epics/NON-EXISTENT/issues').expect(404);
      });
    });
  });

  // Webhook Controller Tests
  describe('WebhookController', () => {
    const mockWebhookService = (webhookService as any);

    beforeEach(() => {
      // Reset the mock before each test
      mockWebhookService.WebhookService.mockClear();
      mockWebhookService.register.mockClear();
      mockWebhookService.remove.mockClear();
      mockWebhookService.list.mockClear();
    });

    describe('POST /api/webhooks', () => {
      it('should register a webhook and persist it in the database', async () => {
        const newWebhook: Webhook = {
          url: 'https://example.com/webhook',
          events: ['issue_created', 'issue_updated'],
          active: true,
        };

        const registerMock = jest.fn().mockResolvedValue({ ...newWebhook, id: 'some-uuid' });
        mockWebhookService.WebhookService.mockImplementation(() => ({
          createWebhook: registerMock,
          listWebhooks: jest.fn().mockResolvedValue([]),
          getWebhook: jest.fn().mockResolvedValue(undefined),
          updateWebhook: jest.fn().mockResolvedValue(false),
          deleteWebhook: jest.fn().mockResolvedValue(false),
        }));
        mockWebhookService.register = registerMock;

        const response = await request(app).post('/api/webhooks').send(newWebhook).expect(201);
        expect(response.body.url).toBe(newWebhook.url);
        expect(response.body.events).toEqual(newWebhook.events);
        expect(response.body.active).toBe(newWebhook.active);
        expect(registerMock).toHaveBeenCalledWith(newWebhook);

        // Verify data in the database
        const dbResponse = await db.query('SELECT * FROM webhooks WHERE id = $1', [response.body.id]);
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].url).toBe(newWebhook.url);
      });

      it('should return 500 if webhook registration fails', async () => {
        const newWebhook: Webhook = {
          url: 'https://example.com/webhook',
          events: ['issue_created', 'issue_updated'],
          active: true,
        };
        const errorMessage = 'Failed to register webhook';

        const registerMock = jest.fn().mockRejectedValue(new Error(errorMessage));
        mockWebhookService.WebhookService.mockImplementation(() => ({
          createWebhook: registerMock,
          listWebhooks: jest.fn().mockResolvedValue([]),
          getWebhook: jest.fn().mockResolvedValue(undefined),
          updateWebhook: jest.fn().mockResolvedValue(false),
          deleteWebhook: jest.fn().mockResolvedValue(false),
        }));
        mockWebhookService.register = registerMock;

        await request(app).post('/api/webhooks').send(newWebhook).expect(500);
        expect(registerMock).toHaveBeenCalledWith(newWebhook);
      });
    });

    describe('DELETE /api/webhooks/:webhookId', () => {
      it('should delete a webhook', async () => {
        const webhookId = 'some-uuid';
        const deleteMock = jest.fn().mockResolvedValue(true);
        mockWebhookService.WebhookService.mockImplementation(() => ({
          createWebhook: jest.fn().mockResolvedValue({
            url: 'https://example.com/webhook',
            events: ['issue_created', 'issue_updated'],
            active: true,
          }),
          listWebhooks: jest.fn().mockResolvedValue([]),
          getWebhook: jest.fn().mockResolvedValue(undefined),
          updateWebhook: jest.fn().mockResolvedValue(false),
          deleteWebhook: deleteMock,
        }));
        mockWebhookService.remove = deleteMock;

        await request(app).delete(`/api/webhooks/${webhookId}`).expect(204);
        expect(deleteMock).toHaveBeenCalledWith(webhookId);

        // Verify the webhook is deleted from the database
        const dbResponse = await db.query('SELECT * FROM webhooks WHERE id = $1', [webhookId]);
        expect(dbResponse.rows.length).toBe(0);
      });

      it('should return 500 if webhook deletion fails', async () => {
        const webhookId = 'some-uuid';
        const errorMessage = 'Failed to delete webhook';
        const deleteMock = jest.fn().mockRejectedValue(new Error(errorMessage));
        mockWebhookService.WebhookService.mockImplementation(() => ({
          createWebhook: jest.fn().mockResolvedValue({
            url: 'https://example.com/webhook',
            events: ['issue_created', 'issue_updated'],
            active: true,
          }),
          listWebhooks: jest.fn().mockResolvedValue([]),
          getWebhook: jest.fn().mockResolvedValue(undefined),
          updateWebhook: jest.fn().mockResolvedValue(false),
          deleteWebhook: deleteMock,
        }));
        mockWebhookService.remove = deleteMock;

        await request(app).delete(`/api/webhooks/${webhookId}`).expect(500);
        expect(deleteMock).toHaveBeenCalledWith(webhookId);
      });
    });

    describe('GET /api/webhooks', () => {
      it('should list all webhooks', async () => {
        const mockWebhooks: Webhook[] = [
          { id: 'id1', url: 'https://example.com/webhook1', events: ['event1'], active: true },
          { id: 'id2', url: 'https://example.com/webhook2', events: ['event2'], active: false },
        ];
        const listMock = jest.fn().mockResolvedValue(mockWebhooks);
        mockWebhookService.WebhookService.mockImplementation(() => ({
          createWebhook: jest.fn().mockResolvedValue({
            url: 'https://example.com/webhook',
            events: ['issue_created', 'issue_updated'],
            active: true,
          }),
          listWebhooks: listMock,
          getWebhook: jest.fn().mockResolvedValue(undefined),
          updateWebhook: jest.fn().mockResolvedValue(false),
          deleteWebhook: jest.fn().mockResolvedValue(false),
        }));
        mockWebhookService.list = listMock;

        const response = await request(app).get('/api/webhooks').expect(200);
        expect(response.body).toEqual(mockWebhooks);
        expect(listMock).toHaveBeenCalled();
      });

      it('should return 500 if listing webhooks fails', async () => {
        const errorMessage = 'Failed to list webhooks';
        const listMock = jest.fn().mockRejectedValue(new Error(errorMessage));
        mockWebhookService.WebhookService.mockImplementation(() => ({
          createWebhook: jest.fn().mockResolvedValue({
            url: 'https://example.com/webhook',
            events: ['issue_created', 'issue_updated'],
            active: true,
          }),
          listWebhooks: listMock,
          getWebhook: jest.fn().mockResolvedValue(undefined),
          updateWebhook: jest.fn().mockResolvedValue(false),
          deleteWebhook: jest.fn().mockResolvedValue(false),
        }));
        mockWebhookService.list = listMock;
        await request(app).get('/api/webhooks').expect(500);
        expect(listMock).toHaveBeenCalled();
      });
    });
  });
});