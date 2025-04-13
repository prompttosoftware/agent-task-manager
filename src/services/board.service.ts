// src/services/board.service.ts
import { Board } from '../types/board.d.ts';
import { v4 as uuidv4 } from 'uuid';

export class BoardService {
    private boards: Board[] = [
        { id: uuidv4(), name: 'Project Board', description: 'A board for managing project tasks' },
        { id: uuidv4(), name: 'Personal Board', description: 'A board for personal tasks' },
    ];

    async getBoardById(id: string): Promise<Board | null> {
        return this.boards.find(board => board.id === id) || null;
    }

    async listBoards(): Promise<Board[]> {
        return this.boards;
    }

    async createBoard(board: { name: string, description?: string }): Promise<Board> {
        const newBoard: Board = {
            id: uuidv4(),
            name: board.name,
            description: board.description,
        };
        this.boards.push(newBoard);
        return newBoard;
    }

    async updateBoard(id: string, updates: { name?: string, description?: string }): Promise<Board | null> {
        const boardIndex = this.boards.findIndex(board => board.id === id);
        if (boardIndex === -1) {
            return null;
        }

        this.boards[boardIndex] = {
            ...this.boards[boardIndex],
            ...updates,
        };
        return this.boards[boardIndex];
    }

    async deleteBoard(id: string): Promise<boolean> {
        const boardIndex = this.boards.findIndex(board => board.id === id);
        if (boardIndex === -1) {
            return false;
        }
        this.boards.splice(boardIndex, 1);
        return true;
    }
}
