import request from 'supertest';
import app from '../index';
import { getAllBoards } from '../services/board.service';
import { Board } from '../types/board.d';

jest.mock('../services/board.service');

describe('GET /boards', () => {
  it('should return a list of boards with status code 200', async () => {
    const mockBoards: Board[] = [
      { id: 1, name: 'Board 1', description: 'Description 1' },
      { id: 2, name: 'Board 2', description: 'Description 2' },
    ];

    (getAllBoards as jest.Mock).mockResolvedValue(mockBoards);

    const response = await request(app).get('/api/boards');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockBoards);
    expect(getAllBoards).toHaveBeenCalledTimes(1);
  });

  it('should return a 500 status code and an error message if getAllBoards service fails', async () => {
    (getAllBoards as jest.Mock).mockRejectedValue(new Error('Failed to fetch boards'));

    const response = await request(app).get('/api/boards');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch boards' });
    expect(getAllBoards).toHaveBeenCalledTimes(1);
  });
});