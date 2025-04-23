import request from 'supertest';
import express, { Express } from 'express';
import metadataRoutes from './metadataRoutes';

describe('metadataRoutes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(metadataRoutes);
  });

  describe('/createmeta', () => {
    it('should return a 200 status code and the correct JSON response', async () => {
      const response = await request(app).get('/createmeta');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        projects: [
          {
            id: '10000',
            name: 'My Project',
            issuetypes: [
              {
                id: '10001',
                name: 'Task',
                subtask: false
              },
              {
                id: '10002',
                name: 'Subtask',
                subtask: true
              },
              {
                id: '10003',
                name: 'Story',
                subtask: false
              },
              {
                id: '10004',
                name: 'Bug',
                subtask: false
              },
              {
                id: '10005',
                name: 'Epic',
                subtask: false
              }
            ]
          }
        ]
      });
    });
  });
});