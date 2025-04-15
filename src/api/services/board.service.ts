import * as boardRepository from '../data/board.repository';
import { Board } from '../types/board';
import { CreateBoardData } from '../types/board';


export class BoardService {
  private readonly boardRepository: typeof boardRepository; // Or BoardRepository if you have an interface

  constructor(boardRepository: typeof boardRepository) {
    this.boardRepository = boardRepository;
  }

  async getBoardById(boardId: string): Promise<Board | null> {
    // Validate boardId is a number
    const id = Number(boardId);
    if (isNaN(id)) {
      return null;
    }

    try {
      return await this.boardRepository.getBoardById(id);
    } catch (error) {
      console.error('Error in BoardService getting board by id:', error);
      throw error; // Re-throw to allow the test to catch it
    }
  }

  // You'll need to implement the other methods as well, using the repository:
    async createBoard(boardData: CreateBoardData): Promise<Board> {
        return await this.boardRepository.createBoard(boardData);
    }

    async getAllBoards(): Promise<Board[]> {
        return await this.boardRepository.getAllBoards();
    }

    async updateBoard(id: string, boardData: Partial<Board>): Promise<Board | null> {
        const boardId = Number(id);
         if (isNaN(boardId)) {
          return null;
        }
        return await this.boardRepository.updateBoard(boardId, boardData);
    }

    async deleteBoard(id: string): Promise<void> {
        const boardId = Number(id);
         if (isNaN(boardId)) {
          return;
        }
        await this.boardRepository.deleteBoard(boardId);
    }
}