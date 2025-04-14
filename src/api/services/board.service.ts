import { Board } from '../types/board';
import { BoardRepository } from '../data/board.repository';

export class BoardService {
  private readonly boardRepository: BoardRepository;

  constructor(boardRepository: BoardRepository) {
    this.boardRepository = boardRepository;
  }

  async getBoardById(boardId: string): Promise<Board | null> {
    try {
      const id = parseInt(boardId, 10);
      if (isNaN(id)) {
        return null;
      }
      return await this.boardRepository.getBoardById(id);
    } catch (error: any) {
      console.error('Error in BoardService.getBoardById:', error);
      throw error;
    }
  }
}
