// src/tests/routes/issue.routes.test.ts
import request from 'supertest';
import express from 'express';
import issueRoutes from '../../routes/issueRoutes';
import { getIssueCreateMetadata } from '../../services/issueCreateMetaService';

jest.mock('../../services/issueCreateMetaService');

const app = express();
app.use(express.json());
app.use('/api', issueRoutes);

describe('Issue Routes', () => {
  describe('GET /issue/createmeta', () => {
    it('should respond with 200 and metadata when no parameters are provided', async () => {
      (getIssueCreateMetadata as jest.Mock).mockResolvedValueOnce({
        projects: [
          {
            id: '1',
            key: 'ATM',
            name: 'Agent Task Manager',
            issuetypes: [
              {
                id: '10000',
                description: 'A task',
                name: 'Task',
                subtask: false,
                hierarchyLevel: 0,
                fields: {},
              },
              {
                id: '10001',
                description: 'A bug',
                name: 'Bug',
                subtask: false,
                hierarchyLevel: 0,
                fields: {},
              },
            ],
          },
        ],
      });

      const response = await request(app).get('/api/issue/createmeta');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        projects: [
          {
            id: '1',
            key: 'ATM',
            name: 'Agent Task Manager',
            issuetypes: [
              {
                id: '10000',
                description: 'A task',
                name: 'Task',
                subtask: false,
                hierarchyLevel: 0,
                fields: {},
              },
              {
                id: '10001',
                description: 'A bug',
                name: 'Bug',
                subtask: false,
                hierarchyLevel: 0,
                fields: {},
              },
            ],
          },
        ],
      });
    });

    it('should respond with 200 and metadata when projectKeys and issueTypeNames are provided', async () => {
        (getIssueCreateMetadata as jest.Mock).mockResolvedValueOnce({
            projects: [
              {
                id: '1',
                key: 'ATM',
                name: 'Agent Task Manager',
                issuetypes: [
                  {
                    id: '10000',
                    description: 'A task',
                    name: 'Task',
                    subtask: false,
                    hierarchyLevel: 0,
                    fields: {},
                  },
                ],
              },
            ],
          });

      const response = await request(app).get('/api/issue/createmeta?projectKeys=ATM&issueTypeNames=Task');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        projects: [
          {
            id: '1',
            key: 'ATM',
            name: 'Agent Task Manager',
            issuetypes: [
              {
                id: '10000',
                description: 'A task',
                name: 'Task',
                subtask: false,
                hierarchyLevel: 0,
                fields: {},
              },
            ],
          },
        ],
      });
    });

    it('should respond with 400 when invalid projectKeys or issueTypeNames are provided', async () => {
      (getIssueCreateMetadata as jest.Mock).mockRejectedValueOnce(new Error('Invalid projectKeys or issueTypeNames'));

      const response = await request(app).get('/api/issue/createmeta?projectKeys=INVALID&issueTypeNames=InvalidType');

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid projectKeys or issueTypeNames' });
    });
  });
});