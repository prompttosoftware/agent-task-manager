// src/services/board.service.test.ts
import { createBoard, getBoardById, updateBoard, deleteBoard } from './board.service';
import db from '../db/database';
import { Board } from '../types/board';

// Mock the database module
jest.mock('../db/database', () => ({
    prepare: jest.fn(() => ({
        run: jest.fn(() => ({ lastInsertRowid: '1', changes: 1 })),
        get: jest.fn(() => ({ id: '1', name: 'Test Board', description: 'Test Description' }))
    }))
}));

describe('Board Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createBoard should create a board', async () => {
        const newBoard = await createBoard('Test Board', 'Test Description');
        expect(newBoard).toEqual({ id: '1', name: 'Test Board', description: 'Test Description' } as Board);
    });

    it('createBoard should throw an error if validation fails', async () => {
        await expect(createBoard('', '')).rejects.toThrow();
    });

    it('getBoardById should retrieve a board', async () => {
        const board = await getBoardById('1');
        expect(board).toEqual({ id: '1', name: 'Test Board', description: 'Test Description' } as Board);
    });

    it('getBoardById should return undefined if board not found', async () => {
        (db.prepare as jest.Mock).mockReturnValueOnce({ get: jest.fn(() => undefined) });
        const board = await getBoardById('2');
        expect(board).toBeUndefined();
    });

    it('updateBoard should update a board', async () => {
        const updatedBoard = await updateBoard('1', { name: 'Updated Board', description: 'Updated Description' });
        expect(updatedBoard).toEqual({ id: '1', name: 'Test Board', description: 'Test Description' } as Board);
    });

    it('updateBoard should throw an error if validation fails', async () => {
      await expect(updateBoard('1', {name: '', description: ''})).rejects.toThrow();
    });

    it('updateBoard should return undefined if board not found', async () => {
        (db.prepare as jest.Mock).mockReturnValueOnce({ run: jest.fn(() => ({ changes: 0 })) });
        const board = await updateBoard('2', { name: 'Updated Board', description: 'Updated Description' });
        expect(board).toBeUndefined();
    });

    it('deleteBoard should delete a board', async () => {
        const result = await deleteBoard('1');
        expect(result).toBe(true);
    });

    it('deleteBoard should return false if board not found', async () => {
        (db.prepare as jest.Mock).mockReturnValueOnce({ run: jest.fn(() => ({ changes: 0 })) });
        const result = await deleteBoard('2');
        expect(result).toBe(false);
    });
});
