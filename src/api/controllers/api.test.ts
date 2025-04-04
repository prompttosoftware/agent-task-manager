// src/api/controllers/api.test.ts
import request from 'supertest';
import express, { Application } from 'express';
import { addIssue, updateIssue, getIssue, deleteIssue, listIssues } from '../controllers/issue.controller';
import * as issueService from '../services/issue.service';
import { Issue } from '../types/issue.d';
import { BoardController } from '../controllers/board.controller';
import { EpicController } from '../controllers/epic.controller';
import * as webhookController from '../controllers/webhook.controller';
import { Board } from '../models/board';
import { EpicCreateRequest, EpicResponse, EpicListResponse, EpicUpdateRequest } from '../types/epic.d';
import { v4 as uuidv4 } from 'uuid';
import { Webhook } from '../api/models/webhook';

jest.mock('../services/issue.service');
jest.mock('../services/board.service');
jest.mock('../services/epic.service');
jest.mock('../services/webhook.service');

const app: Application = express();
app.use(express.json());

// Issue Controller Setup
app.post('/issues', addIssue);
app.put('/issues/:id', updateIssue);
app.get('/issues/:id', getIssue);
app.delete('/issues/:id', deleteIssue);
app.get('/issues', listIssues);

// Board Controller Setup
const boardController = new BoardController();
app.post('/boards', boardController.createBoard.bind(boardController));

// Epic Controller Setup
const epicController = new EpicController();
app.post('/api/epics', epicController.createEpic.bind(epicController));
app.get('/api/epics', epicController.getAllEpics.bind(epicController));
app.get('/api/epics/:epicKey', epicController.getEpicByKey.bind(epicController));
app.put('/api/epics/:epicKey', epicController.updateEpic.bind(epicController));
app.delete('/api/epics/:epicKey', epicController.deleteEpic.bind(epicController));
app.get('/api/epics/:epicKey/issues', epicController.getIssuesByEpicKey.bind(epicController));

// Webhook Controller Setup
app.post('/api/webhooks', webhookController.registerWebhook);
app.delete('/api/webhooks/:webhookId', webhookController.deleteWebhook);
app.get('/api/webhooks', webhookController.listWebhooks);




describe('API Response Format Verification', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Issue Controller Tests
  describe('Issue Controller', () => {
    const mockIssue: Issue = {
      id: 1,
      summary: 'Test Summary',
      description: 'Test Description',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    describe('POST /issues', () => {
      it('should create an issue and return 201 with the correct JSON format', async () => {
        (issueService.createIssue as jest.Mock).mockResolvedValue(mockIssue);

        const response = await request(app)
          .post('/issues')
          .send({ summary: 'Test', description: 'Desc', status: 'open' });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(Number),
          summary: expect.any(String),
          description: expect.any(String),
          status: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });

      it('should return 400 if validation fails', async () => {
        const response = await request(app).post('/issues').send({}); // Empty body

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(Array.isArray(response.body.errors)).toBe(true);
      });

      it('should return 500 if issue creation fails', async () => {
        (issueService.createIssue as jest.Mock).mockRejectedValue(new Error('Failed to create'));

        const response = await request(app)
          .post('/issues')
          .send({ summary: 'Test', description: 'Desc', status: 'open' });

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to create issue');
      });
    });

    describe('PUT /issues/:id', () => {
      it('should update an issue and return 200 with the correct JSON format', async () => {
        const updatedIssue: Issue = {
          ...mockIssue,
          summary: 'Updated Summary',
        };
        (issueService.updateIssue as jest.Mock).mockResolvedValue(updatedIssue);

        const response = await request(app).put('/issues/1').send({ summary: 'Updated Summary' });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: expect.any(String),
          summary: expect.any(String),
          description: expect.any(String),
          status: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });

      it('should return 400 for invalid ID', async () => {
        const response = await request(app).put('/issues/abc').send({ summary: 'Updated Summary' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid issue ID');
      });

      it('should return 500 if update fails', async () => {
        (issueService.updateIssue as jest.Mock).mockRejectedValue(new Error('Failed to update'));

        const response = await request(app).put('/issues/1').send({ summary: 'Updated Summary' });

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to update issue');
      });
    });

    describe('GET /issues/:id', () => {
      it('should get an issue and return 200 with the correct JSON format', async () => {
        (issueService.getIssueById as jest.Mock).mockResolvedValue(mockIssue);

        const response = await request(app).get('/issues/1');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: expect.any(Number),
          summary: expect.any(String),
          description: expect.any(String),
          status: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });

      it('should return 400 for invalid ID', async () => {
        const response = await request(app).get('/issues/abc');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid issue ID');
      });

      it('should return 404 if issue not found', async () => {
        (issueService.getIssueById as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app).get('/issues/2');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Issue not found');
      });

      it('should return 500 if get fails', async () => {
        (issueService.getIssueById as jest.Mock).mockRejectedValue(new Error('Failed to get'));

        const response = await request(app).get('/issues/1');

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to get issue');
      });
    });

    describe('DELETE /issues/:id', () => {
      it('should delete an issue and return 204', async () => {
        (issueService.deleteIssue as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app).delete('/issues/1');

        expect(response.status).toBe(204);
        expect(response.body).toEqual({}); // Expecting empty body for 204
      });

      it('should return 400 for invalid ID', async () => {
        const response = await request(app).delete('/issues/abc');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid issue ID');
      });

      it('should return 500 if delete fails', async () => {
        (issueService.deleteIssue as jest.Mock).mockRejectedValue(new Error('Failed to delete'));

        const response = await request(app).delete('/issues/1');

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to delete issue');
      });
    });

    describe('GET /issues', () => {
      it('should list issues and return 200 with the correct JSON format', async () => {
        const mockIssues: Issue[] = [mockIssue, { ...mockIssue, id: 2 }];
        (issueService.listIssues as jest.Mock).mockResolvedValue(mockIssues);

        const response = await request(app).get('/issues');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(response.body[0]).toMatchObject({
          id: expect.any(Number),
          summary: expect.any(String),
          description: expect.any(String),
          status: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });

      it('should list issues with filters and return 200 with the correct JSON format', async () => {
        const mockIssues: Issue[] = [mockIssue];
        (issueService.listIssues as jest.Mock).mockResolvedValue(mockIssues);

        const response = await request(app).get('/issues?status=open');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toMatchObject({
          id: expect.any(Number),
          summary: expect.any(String),
          description: expect.any(String),
          status: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });

      it('should return 500 if listing fails', async () => {
        (issueService.listIssues as jest.Mock).mockRejectedValue(new Error('Failed to list'));

        const response = await request(app).get('/issues');

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to list issues');
      });
    });
  });

  // Board Controller Tests
  describe('Board Controller', () => {
    const mockBoard: Board = {
      id: 1,
      name: 'Test Board',
      description: 'Test Description',
    };

    it('should create a board and return 201 with the correct JSON format', async () => {
      const createBoardMock = jest.fn().mockResolvedValue(mockBoard);
      (boardService.BoardService.prototype.createBoard as any) = createBoardMock;

      const response = await request(app).post('/boards').send({ name: 'Test Board', description: 'Test Description' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        description: expect.any(String),
      });
    });

    it('should return 400 if validation fails', async () => {
      const response = await request(app).post('/boards').send({ name: '', description: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 500 if board creation fails', async () => {
      const createBoardMock = jest.fn().mockRejectedValue(new Error('Failed to create'));
      (boardService.BoardService.prototype.createBoard as any) = createBoardMock;

      const response = await request(app).post('/boards').send({ name: 'Test Board', description: 'Test Description' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  // Epic Controller Tests
  describe('Epic Controller', () => {
    const mockEpic: EpicResponse = {
      id: 1,
      key: 'TEST-1',
      name: 'Test Epic',
      createdAt: new Date().toISOString(),
      self: '',
    };

    describe('POST /api/epics', () => {
      it('should create an epic and return 201 with the correct JSON format', async () => {
        (epicService.EpicService.prototype.createEpic as any).mockResolvedValue(mockEpic);

        const response = await request(app)
          .post('/api/epics')
          .send({ key: 'TEST-1', name: 'Test Epic' });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(Number),
          key: expect.any(String),
          name: expect.any(String),
          createdAt: expect.any(String),
          self: expect.any(String),
        });
      });

      it('should return 400 if validation fails', async () => {
        const response = await request(app).post('/api/epics').send({ key: '', name: '' });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Validation failed');
      });

      it('should return 500 if epic creation fails', async () => {
        (epicService.EpicService.prototype.createEpic as any).mockRejectedValue(new Error('Failed to create'));
        const response = await request(app).post('/api/epics').send({ key: 'TEST-1', name: 'Test Epic' });
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to create epic');
      });
    });

    describe('GET /api/epics', () => {
      it('should get all epics and return 200 with the correct JSON format', async () => {
        const mockEpics: EpicListResponse = [mockEpic, { ...mockEpic, id: 2, key: 'TEST-2' }];
        (epicService.EpicService.prototype.getAllEpics as any).mockResolvedValue(mockEpics);

        const response = await request(app).get('/api/epics');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(response.body[0]).toMatchObject({
          id: expect.any(Number),
          key: expect.any(String),
          name: expect.any(String),
          createdAt: expect.any(String),
          self: expect.any(String),
        });
      });

      it('should return 500 if getting all epics fails', async () => {
        (epicService.EpicService.prototype.getAllEpics as any).mockRejectedValue(new Error('Failed to get'));
        const response = await request(app).get('/api/epics');
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to get all epics');
      });
    });

    describe('GET /api/epics/:epicKey', () => {
      it('should get an epic by key and return 200 with the correct JSON format', async () => {
        (epicService.EpicService.prototype.getEpicByKey as any).mockResolvedValue(mockEpic);

        const response = await request(app).get('/api/epics/TEST-1');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: expect.any(Number),
          key: expect.any(String),
          name: expect.any(String),
          createdAt: expect.any(String),
          self: expect.any(String),
        });
      });

      it('should return 404 if epic not found', async () => {
        (epicService.EpicService.prototype.getEpicByKey as any).mockResolvedValue(undefined);
        const response = await request(app).get('/api/epics/TEST-1');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Epic not found');
      });

      it('should return 500 if getting epic by key fails', async () => {
        (epicService.EpicService.prototype.getEpicByKey as any).mockRejectedValue(new Error('Failed to get'));
        const response = await request(app).get('/api/epics/TEST-1');
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to get epic by key');
      });
    });

    describe('PUT /api/epics/:epicKey', () => {
      it('should update an epic and return 200 with the correct JSON format', async () => {
        const updatedEpic: EpicResponse = { ...mockEpic, name: 'Updated Name' };
        (epicService.EpicService.prototype.updateEpic as any).mockResolvedValue(updatedEpic);

        const response = await request(app).put('/api/epics/TEST-1').send({ name: 'Updated Name' });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: expect.any(Number),
          key: expect.any(String),
          name: expect.any(String),
          createdAt: expect.any(String),
          self: expect.any(String),
        });
      });

      it('should return 400 if validation fails', async () => {
        const response = await request(app).put('/api/epics/TEST-1').send({ name: '' });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Validation failed');
      });

      it('should return 404 if epic not found', async () => {
        (epicService.EpicService.prototype.updateEpic as any).mockResolvedValue(undefined);
        const response = await request(app).put('/api/epics/TEST-1').send({ name: 'Updated Name' });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Epic not found');
      });

      it('should return 500 if updating epic fails', async () => {
        (epicService.EpicService.prototype.updateEpic as any).mockRejectedValue(new Error('Failed to update'));
        const response = await request(app).put('/api/epics/TEST-1').send({ name: 'Updated Name' });
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to update epic');
      });
    });

    describe('DELETE /api/epics/:epicKey', () => {
      it('should delete an epic and return 204', async () => {
        (epicService.EpicService.prototype.deleteEpic as any).mockResolvedValue(undefined);

        const response = await request(app).delete('/api/epics/TEST-1');

        expect(response.status).toBe(204);
        expect(response.body).toEqual({});
      });

      it('should return 404 if epic not found', async () => {
        (epicService.EpicService.prototype.deleteEpic as any).mockRejectedValue(new Error('Epic not found'));
        const response = await request(app).delete('/api/epics/TEST-1');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Epic not found');
      });

      it('should return 500 if deleting epic fails', async () => {
        (epicService.EpicService.prototype.deleteEpic as any).mockRejectedValue(new Error('Failed to delete'));
        const response = await request(app).delete('/api/epics/TEST-1');
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to delete epic');
      });
    });

    describe('GET /api/epics/:epicKey/issues', () => {
      it('should get issues by epic key and return 200 with the correct JSON format', async () => {
        const mockIssue = {
          id: '1',
          key: 'ISSUE-1',
          self: '',
          fields: {
            summary: 'Issue Summary',
            status: {
              name: 'Open',
              id: '',
              statusCategory: {
                key: ''
              }
            },
            issuetype: {
              name: 'Story',
              iconUrl: 'icon.url',
            },
          },
        };
        const mockIssues = [mockIssue];
        (epicService.EpicService.prototype.getIssuesByEpicKey as any).mockResolvedValue(mockIssues);

        const response = await request(app).get('/api/epics/TEST-1/issues');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toMatchObject({
          id: expect.any(String),
          key: expect.any(String),
          self: expect.any(String),
          fields: {
            summary: expect.any(String),
            status: {
              name: expect.any(String),
              id: expect.any(String),
              statusCategory: {
                key: expect.any(String)
              }
            },
            issuetype: {
              name: expect.any(String),
              iconUrl: expect.any(String),
            },
          },
        });
      });

      it('should return 500 if getting issues by epic key fails', async () => {
        (epicService.EpicService.prototype.getIssuesByEpicKey as any).mockRejectedValue(new Error('Failed to get'));
        const response = await request(app).get('/api/epics/TEST-1/issues');
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to get issues by epic key');
      });
    });
  });

  // Webhook Controller Tests
  describe('Webhook Controller', () => {
    const mockWebhook: Webhook = {
      id: uuidv4(),
      url: 'https://example.com/webhook',
      events: ['issue_created'],
      active: true,
    };

    describe('POST /api/webhooks', () => {
      it('should register a webhook and return 201 with the correct JSON format', async () => {
        (webhookController.register as any).mockResolvedValue(mockWebhook);

        const response = await request(app)
          .post('/api/webhooks')
          .send(mockWebhook);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(String),
          url: expect.any(String),
          events: expect.any(Array),
          active: expect.any(Boolean),
        });
      });

      it('should return 500 if webhook registration fails', async () => {
        (webhookController.register as any).mockRejectedValue(new Error('Failed to register'));

        const response = await request(app)
          .post('/api/webhooks')
          .send(mockWebhook);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to register webhook');
      });
    });

    describe('DELETE /api/webhooks/:webhookId', () => {
      it('should delete a webhook and return 204', async () => {
        (webhookController.remove as any).mockResolvedValue(undefined);

        const response = await request(app).delete(`/api/webhooks/${mockWebhook.id}`);

        expect(response.status).toBe(204);
        expect(response.body).toEqual({});
      });

      it('should return 500 if webhook deletion fails', async () => {
        (webhookController.remove as any).mockRejectedValue(new Error('Failed to delete'));

        const response = await request(app).delete(`/api/webhooks/${mockWebhook.id}`);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to delete webhook');
      });
    });

    describe('GET /api/webhooks', () => {
      it('should list webhooks and return 200 with the correct JSON format', async () => {
        const mockWebhooks: Webhook[] = [mockWebhook, { ...mockWebhook, id: uuidv4(), url: 'https://example.com/webhook2' }];
        (webhookController.list as any).mockResolvedValue(mockWebhooks);

        const response = await request(app).get('/api/webhooks');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(response.body[0]).toMatchObject({
          id: expect.any(String),
          url: expect.any(String),
          events: expect.any(Array),
          active: expect.any(Boolean),
        });
      });

      it('should return 500 if listing webhooks fails', async () => {
        (webhookController.list as any).mockRejectedValue(new Error('Failed to list'));

        const response = await request(app).get('/api/webhooks');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to list webhooks');
      });
    });
  });
});