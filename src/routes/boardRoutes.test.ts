import request from 'supertest';
import app from '../app';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Helper function to create a board
const createBoard = async (name: string) => {
    const res = await request(app).post('/boards').send({ name });
    return res.body;
};

// Helper function to create an issue
const createIssue = async (summary: string, description: string, boardId: number | null) => {
    const res = await request(app).post('/issues').send({ summary, description, boardId });
    return res.body;
};

describe('GET /boards/:boardId/issues', () => {
    let board1: any;
    let board2: any;
    let issue1: any;
    let issue2: any;

    beforeAll(async () => {
        // Create some boards and issues before running tests
        board1 = await createBoard('Board 1');
        board2 = await createBoard('Board 2');
        issue1 = await createIssue('Issue 1', 'Description 1', board1.id);
        issue2 = await createIssue('Issue 2', 'Description 2', board1.id);
    });

    afterAll(async () => {
      // Clean up:  reset the in-memory data to avoid polluting future tests
      // This is a basic approach for an in-memory store, in a real app
      // you'd likely have a separate test setup for managing the state.
      // Here, we're just clearing the data to keep tests independent.
      // In a real-world scenario, you'd have a way to seed and teardown your database
      // before and after the tests to have a clean state.
      // For simplicity and given the in-memory nature, just clear the data here.
      // @ts-ignore
      app.boards = [];
      // @ts-ignore
      app.issues = [];
    });

    it('should return 200 OK and issues for a valid boardId', async () => {
        const res = await request(app).get(`/boards/${board1.id}/issues`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(2);
        expect(res.body[0].summary).toBe('Issue 1');
        expect(res.body[1].summary).toBe('Issue 2');
    });

    it('should return an empty array for a boardId with no issues', async () => {
        const res = await request(app).get(`/boards/${board2.id}/issues`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('should return 404 Not Found if boardId does not exist', async () => {
        const res = await request(app).get('/boards/999/issues'); // Nonexistent board
        expect(res.statusCode).toBe(404);
    });
});
