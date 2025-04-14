// src/data/board.inmemory.repository.ts

import { Board } from '../types/board';
import { BoardRepository } from './board.repository';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryBoardRepository implements BoardRepository {
    private boards: Board[] = [];

    async getBoardById(boardId: string): Promise<Board | undefined> {
        try {
            return this.boards.find(board => board.id === boardId);
        } catch (error) {
            console.error(`Error getting board by id: ${boardId}`, error);
            return undefined;
        }
    }

    async createBoard(board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>): Promise<Board> {
        try {
            const newBoard: Board = {
                id: uuidv4(),
                ...board,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.boards.push(newBoard);
            return newBoard;
        } catch (error) {
            console.error('Error creating board:', error);
            throw new Error('Failed to create board');
        }
    }

    async updateBoard(boardId: string, board: Partial<Board>): Promise<Board | undefined> {
        try {
            const boardIndex = this.boards.findIndex(board => board.id === boardId);

            if (boardIndex === -1) {
                return undefined;
            }

            const existingBoard = this.boards[boardIndex];

            const updatedBoard: Board = {
                ...existingBoard,
                ...board,
                updatedAt: new Date()
            };

            this.boards[boardIndex] = updatedBoard;
            return updatedBoard;

        } catch (error) {
            console.error(`Error updating board with id: ${boardId}`, error);
            return undefined;
        }
    }

    async deleteBoard(boardId: string): Promise<boolean> {
        try {
            const initialLength = this.boards.length;
            this.boards = this.boards.filter(board => board.id !== boardId);
            return this.boards.length !== initialLength;
        } catch (error) {
            console.error(`Error deleting board with id: ${boardId}`, error);
            return false;
        }
    }
}