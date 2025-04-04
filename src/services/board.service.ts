// src/services/board.service.ts

import { Board } from '../types/board';
import db from '../db/database';
import { validate } from 'express-validator';

const validateBoard = async (name: string, description: string) => {
    const validationResult = await Promise.all([
        validate('name').trim().notEmpty().withMessage('Name is required').run({ req: { body: { name } } }),
        validate('description').trim().notEmpty().withMessage('Description is required').run({ req: { body: { description } } })
    ]);

    const errors = validationResult.reduce((acc, result) => {
        if (!result.isEmpty()) {
            acc = acc.concat(result.array());
        }
        return acc;
    }, []);
    return errors;
};

export const createBoard = async (name: string, description: string): Promise<Board> => {
    try {
        const validationErrors = await validateBoard(name, description);
        if(validationErrors.length > 0) {
            throw new Error(JSON.stringify(validationErrors));
        }

        const stmt = db.prepare('INSERT INTO boards (name, description) VALUES (?, ?)');
        const info = stmt.run(name, description);
        const id = info.lastInsertRowid?.toString() || '';
        return { id, name, description } as Board;
    } catch (error: any) {
        console.error('Error creating board:', error);
        throw new Error(error.message || 'Failed to create board');
    }
};

export const getBoardById = async (id: string): Promise<Board | undefined> => {
    try {
        const stmt = db.prepare('SELECT id, name, description FROM boards WHERE id = ?');
        const row = stmt.get(id);
        if (!row) {
            return undefined;
        }
        return row as Board;
    } catch (error: any) {
        console.error('Error getting board by id:', error);
        throw new Error(error.message || 'Failed to get board');
    }
};

export const updateBoard = async (id: string, updates: Partial<Board>): Promise<Board | undefined> => {
    try {
        const { name, description } = updates;
        if (!name && !description) {
            throw new Error('At least one field (name or description) must be provided for update');
        }

        if (name !== undefined || description !== undefined) {
            const validationErrors = await validateBoard(name || '', description || '');
            if (validationErrors.length > 0) {
                throw new Error(JSON.stringify(validationErrors));
            }
        }

        const stmt = db.prepare('UPDATE boards SET name = ?, description = ? WHERE id = ?');
        const info = stmt.run(name, description, id);
        if (info.changes === 0) {
            return undefined;
        }
        return await getBoardById(id);
    } catch (error: any) {
        console.error('Error updating board:', error);
        throw new Error(error.message || 'Failed to update board');
    }
};

export const deleteBoard = async (id: string): Promise<boolean> => {
    try {
        const stmt = db.prepare('DELETE FROM boards WHERE id = ?');
        const info = stmt.run(id);
        return info.changes > 0;
    } catch (error: any) {
        console.error('Error deleting board:', error);
        throw new Error(error.message || 'Failed to delete board');
    }
};
