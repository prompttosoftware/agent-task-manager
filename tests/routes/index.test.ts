// tests/routes/index.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from app.ts or similar

describe('GET /api/boards/{boardId}/issues', () => {
  it('should return 200 OK and an array of issues for a valid board ID', async () => {
    // Assuming you have a board with ID '123'
    const boardId = '123';
    const response = await request(app).get(`/api/boards/${boardId}/issues`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    // Add more specific assertions based on the expected issue data structure.
    // For example: expect(response.body[0]).toHaveProperty('id');
  });

  it('should return 404 Not Found for a non-existent board ID', async () => {
    const boardId = 'nonexistent';
    const response = await request(app).get(`/api/boards/${boardId}/issues`);

    expect(response.status).toBe(404);
    // You might want to check for a specific error message in the response body.
  });

  it('should return 400 Bad Request if boardId is invalid', async () => {
    const boardId = 'invalid-id'; // Or an empty string ''
    const response = await request(app).get(`/api/boards/${boardId}/issues`);

    expect(response.status).toBe(400);
    // You might want to check for a specific error message in the response body.
  });
});