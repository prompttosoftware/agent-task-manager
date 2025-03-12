// test/controllers/issue.controller.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app'; // Adjust the import path
import sequelize from '../../src/config/database.config'; // Adjust the import path
import { Issue } from '../../src/models/issue.model'; // Adjust the import path

describe('IssueController Integration Tests', () => {
  beforeAll(async () => {
    try {
      await sequelize.sync({ force: true }); // Sync database before tests
    } catch (error) {
      console.error('Error syncing database:', error);
    }
  });

  afterAll(async () => {
    await sequelize.close(); // Close the database connection after tests
  });

  it('should create an issue (POST /issues)', async () => {
    const res = await request(app)
      .post('/issues') // Adjust the endpoint
      .send({ /* issue data */ summary: 'Test Issue',  });

    expect(res.statusCode).toEqual(201); // Assuming 201 Created
    expect(res.body).toHaveProperty('id');
    expect(res.body.summary).toBe('Test Issue');
  });

  it('should get an issue by id (GET /issues/:id)', async () => {
    // Create an issue first
    const createRes = await request(app)
      .post('/issues')
      .send({ summary: 'Get Issue Test' });

    const issueId = createRes.body.id;

    const res = await request(app).get(`/issues/${issueId}`);
    expect(res.statusCode).toEqual(200); // Assuming 200 OK
    expect(res.body.id).toEqual(issueId);
    expect(res.body.summary).toBe('Get Issue Test');
  });

  it('should update an issue (PUT /issues/:id)', async () => {
      // Create an issue first
      const createRes = await request(app)
          .post('/issues')
          .send({ summary: 'Update Issue Test' });

      const issueId = createRes.body.id;

      const res = await request(app)
          .put(`/issues/${issueId}`)
          .send({ summary: 'Updated Issue' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.summary).toBe('Updated Issue');
  });

    it('should delete an issue (DELETE /issues/:id)', async () => {
        // Create an issue first
        const createRes = await request(app)
            .post('/issues')
            .send({ summary: 'Delete Issue Test' });

        const issueId = createRes.body.id;

        const res = await request(app).delete(`/issues/${issueId}`);
        expect(res.statusCode).toEqual(204); // Assuming 204 No Content on successful delete

        // Verify that the issue is actually deleted (optional)
        const getRes = await request(app).get(`/issues/${issueId}`);
        expect(getRes.statusCode).toEqual(404); // Or appropriate not found status code
    });
});
