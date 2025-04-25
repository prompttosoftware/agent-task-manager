/**
 * @fileoverview This file contains the test suite for the metadata routes.
 * It uses supertest to simulate HTTP requests and Jest for assertions.
 */

import request from 'supertest';
import express, { Express } from 'express';
import metadataRoutes from './metadataRoutes';

/**
 * Describes the test suite for the metadata routes.
 */
describe('metadataRoutes', () => {
  /** @type {Express} Express application instance for testing. */
  let app: Express;

  /**
   * Sets up the Express application and mounts the metadata routes before running tests.
   */
  beforeAll(() => {
    app = express();
    app.use(metadataRoutes);
  });

  /**
   * Describes the tests for the GET /createmeta endpoint.
   */
  describe('/createmeta', () => {
    /**
     * Test case to verify that the /createmeta endpoint returns a 200 status code
     * and the expected JSON response containing project metadata.
     * @async
     */
    it('should return a 200 status code and the correct JSON response', async () => {
      /**
       * Sends a GET request to the /createmeta endpoint.
       * @type {request.Response}
       */
      const response = await request(app).get('/createmeta');

      // Assert that the status code is 200 (OK).
      expect(response.status).toBe(200);
      // Assert that the response body matches the expected metadata structure.
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