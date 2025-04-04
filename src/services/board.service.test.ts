// src/services/board.service.test.ts
import { createBoard, getBoardById, updateBoard, deleteBoard } from './board.service';
import db from '../db/database';
import { Board } from '../types/board';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { check, validationResult } from 'express-validator';

// Mock the entire express-validator module
vi.mock('express-validator', () => {
    const originalModule = vi.importActual('express-validator');
    const mockCheck = vi.fn(() => ({
        trim: vi.fn().mockReturnThis(),
        notEmpty: vi.fn().mockReturnThis(),
        withMessage: vi.fn().mockReturnThis(),
        run: vi.fn().mockImplementation(async (req: any, res: any, next: any) => {
            // Simulate validation behavior
            const result = validationResult(req);
            if (!result.isEmpty()) {
                const errors = result.array();
                // Directly return errors in the expected format
                req.validationErrors = errors;
                return Promise.resolve(); // Simulate successful run, errors are stored in req
            }
            return Promise.resolve();
        }),
    }));

    return {
        ...originalModule,
        check: mockCheck,
        validationResult: vi.fn().mockImplementation(req => {
            return {
                isEmpty: vi.fn(() => !req.validationErrors || req.validationErrors.length === 0),
                array: vi.fn(() => req.validationErrors || []),
            };
        }),
    };
});


describe('Board Service', () => {
    beforeEach(async () => {
        // Clear the database before each test
        db.exec('DELETE FROM boards');
        // Seed the database with a test board
        db.exec("INSERT INTO boards (name, description) VALUES ('Test Board', 'Test Description')");
        vi.clearAllMocks(); // Clear mocks before each test.
    });

    afterEach(() => {
        // Clear mocks and reset the database after each test
        vi.restoreAllMocks();
    });

    it('createBoard should create a board', async () => {
        const newBoard = await createBoard('Test Board 2', 'Test Description 2');
        expect(newBoard).toEqual(expect.objectContaining({ name: 'Test Board 2', description: 'Test Description 2' }));
    });

    it('createBoard should throw an error if validation fails', async () => {
        const validationErrors = [{ msg: 'Name is required', param: 'name' }, { msg: 'Description is required', param: 'description' }];
        (validationResult as any).mockImplementation(req => ({
            isEmpty: () => false,
            array: () => validationErrors,
        }));

        await expect(createBoard('', '')).rejects.toThrowError(JSON.stringify(validationErrors));
    });

    it('getBoardById should retrieve a board', async () => {
        const board = await getBoardById('1');
        expect(board).toEqual(expect.objectContaining({ name: 'Test Board', description: 'Test Description' }));
    });

    it('getBoardById should return undefined if board not found', async () => {
        const board = await getBoardById('2');
        expect(board).toBeUndefined();
    });

    it('updateBoard should update a board', async () => {
        await updateBoard('1', { name: 'Updated Board', description: 'Updated Description' });
        const updatedBoard = await getBoardById('1');
        expect(updatedBoard).toEqual(expect.objectContaining({ name: 'Updated Board', description: 'Updated Description' }));
    });

    it('updateBoard should throw an error if validation fails', async () => {
        const validationErrors = [{ msg: 'Name is required', param: 'name' }];
        (validationResult as any).mockImplementation(req => ({
            isEmpty: () => false,
            array: () => validationErrors,
        }));
        await expect(updateBoard('1', { name: '', description: '' })).rejects.toThrowError(JSON.stringify(validationErrors));
    });

    it('updateBoard should return undefined if board not found', async () => {
        const board = await updateBoard('2', { name: 'Updated Board', description: 'Updated Description' });
        expect(board).toBeUndefined();
    });

    it('deleteBoard should delete a board', async () => {
        const result = await deleteBoard('1');
        expect(result).toBe(true);
    });

    it('deleteBoard should return false if board not found', async () => {
        const result = await deleteBoard('2');
        expect(result).toBe(false);
    });
});