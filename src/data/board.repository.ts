// src/data/board.repository.ts

import { Board } from '../types/board';

export interface BoardRepository {
    getBoardById(boardId: string): Promise<Board | undefined>;
    // Define other methods for board operations (create, update, delete)
}
