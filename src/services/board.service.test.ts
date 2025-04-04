// src/services/board.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as boardService from './board.service';
import { Board } from '../types/board';
import db from '../db/database';

// Mock the database module
jest.mock('../db/database', () => ({
    run: jest.fn(),
    get: jest.fn(),
}));

describe('Board Service - deleteBoard', () => {
    it('should delete a board and return true if successful', async () => {
        const boardId = '1';
        (db.run as jest.Mock).mockResolvedValueOnce({ changes: 1 });

        const result = await boardService.deleteBoard(boardId);

        expect(result).toBe(true);
        expect(db.run).toHaveBeenCalledWith('DELETE FROM boards WHERE id = ?', [boardId]);
    });

    it('should return false if board is not found', async () => {
        const boardId = '999';
        (db.run as jest.Mock).mockResolvedValueOnce({ changes: 0 });

        const result = await boardService.deleteBoard(boardId);

        expect(result).toBe(false);
        expect(db.run).toHaveBeenCalledWith('DELETE FROM boards WHERE id = ?', [boardId]);
    });

    it('should throw an error if the database operation fails', async () => {
        const boardId = '1';
        const errorMessage = 'Database error';
        (db.run as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

        await expect(boardService.deleteBoard(boardId)).rejects.toThrow(errorMessage);
        expect(db.run).toHaveBeenCalledWith('DELETE FROM boards WHERE id = ?', [boardId]);
    });
});
