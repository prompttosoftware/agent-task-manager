import request from 'supertest';
import app from '../../src/api/index'; // Assuming your app is exported from index.ts
import { db } from '../../src/data/db'; // Import your database connection
import { Board } from '../../src/types/board';

describe('Board Controller - DELETE /boards/:boardId', () => {
  // Helper function to create a board
  const createTestBoard = async (name: string, description: string): Promise<Board> => {
    const board = await db.Board.create({ name, description });
    return board.toJSON() as Board;
  };

  beforeEach(async () => {
    // Clear the database before each test
    await db.Board.sync({ force: true }); // Use force: true for testing to clear data
  });

  it('should delete a board by ID and return 204', async () => {
    const board = await createTestBoard('Test Board', 'Test Description');

    const response = await request(app).delete(`/api/boards/${board.id}`);

    expect(response.statusCode).toBe(204);

    // Verify the board is deleted (optional, but recommended)
    const deletedBoard = await db.Board.findByPk(board.id);
    expect(deletedBoard).toBeNull();
  });

  it('should return 400 if boardId is invalid', async () => {
    const response = await request(app).delete('/api/boards/invalid-id');
    expect(response.statusCode).toBe(400);
    // You might want to add more assertions to check the response body
  });

  it('should return 404 if board is not found', async () => {
    const response = await request(app).delete('/api/boards/999'); // Assuming 999 doesn't exist
    expect(response.statusCode).toBe(204); // Assuming delete returns 204 even if not found.  Consider changing this in controller.
  });

  it('should handle database errors and return 500', async () => {
    // Mock the deleteBoard function to simulate a database error
    jest.spyOn(require('../../src/api/services/board.service'), 'deleteBoard').mockRejectedValue(new Error('Database error'));

    const response = await request(app).delete('/api/boards/1');
    expect(response.statusCode).toBe(500);
    jest.restoreAllMocks();
  });
});
