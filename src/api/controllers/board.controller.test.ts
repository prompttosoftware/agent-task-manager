import request from 'supertest';
import { app } from '../../src/app'; // Assuming your app is exported
import { BoardService } from '../../src/api/services/board.service';
import { mockBoard } from '../../src/data/mocks/mock.board.repository';

jest.mock('../../src/api/services/board.service');

describe('GET /boards/:boardId', () => {
  it('should return a board if the boardId is valid', async () => {
    const boardId = '1';
    const mockBoardData = mockBoard();
    (BoardService.prototype.getBoardById as jest.Mock).mockResolvedValue(mockBoardData);

    const response = await request(app).get(`/api/boards/${boardId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockBoardData);
    expect(BoardService.prototype.getBoardById).toHaveBeenCalledWith(boardId);
  });

  it('should return 400 if boardId is not a number', async () => {
    const boardId = 'abc';
    const response = await request(app).get(`/api/boards/${boardId}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({ errors: expect.any(Array) }));
  });

  it('should return 404 if board is not found', async () => {
    const boardId = '999';
    (BoardService.prototype.getBoardById as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get(`/api/boards/${boardId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Board not found' });
    expect(BoardService.prototype.getBoardById).toHaveBeenCalledWith(boardId);
  });

  it('should return 500 if there is an internal server error', async () => {
    const boardId = '1';
    (BoardService.prototype.getBoardById as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app).get(`/api/boards/${boardId}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Database error' });
    expect(BoardService.prototype.getBoardById).toHaveBeenCalledWith(boardId);
  });
});
