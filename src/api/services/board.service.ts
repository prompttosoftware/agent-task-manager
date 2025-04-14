// src/api/services/board.service.ts
import { BoardRepository } from '../data/board.repository';
import { Board } from '../types/board.d';

export class BoardService {
    private boardRepository: BoardRepository;

    constructor(boardRepository: BoardRepository) {
        this.boardRepository = boardRepository;
    }

    async getBoard(boardId: string): Promise<Board | undefined> {
        // In a real application, you would likely fetch the board from a database
        return this.boardRepository.findById(boardId);
    }
}
