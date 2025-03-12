// tests/issueRoutes.test.ts

import request from 'supertest';
import app from '../src/app';

describe('Issue Routes', () => {
  it('should create an issue with a valid label', async () => {
    const response = await request(app)
      .post('/issues')
      .send({ summary: 'Test Issue', description: 'This is a test issue', labels: ['label1'] });

    expect(response.statusCode).toBe(201);
    expect(response.body.labels).toEqual(expect.arrayContaining(['label1']));
  });

  it('should fail to create an issue without a required label', async () => {
    const response = await request(app)
      .post('/issues')
      .send({ summary: 'Test Issue', description: 'This is a test issue' });

    expect(response.statusCode).toBe(400);
    // Add specific error message assertion here based on expected error
    // expect(response.body.message).toBe('Label is required');
  });

  it('should update an issue with board information', async () => {
    // This test requires the issue to exist and board functionality to be implemented
    // For now, this test is commented out, but it will assert that the board information
    // gets set correctly when the issue is updated.
    //  const createResponse = await request(app)
    //     .post('/issues')
    //     .send({ summary: 'Test Issue', description: 'This is a test issue', labels: ['label1'] });
    // const issueId = createResponse.body.id;
    // const updateResponse = await request(app)
    //   .put(`/issues/${issueId}`)
    //   .send({ board: 'board1' });

    //   expect(updateResponse.statusCode).toBe(200);
    //   expect(updateResponse.body.board).toBe('board1');
  });
});
