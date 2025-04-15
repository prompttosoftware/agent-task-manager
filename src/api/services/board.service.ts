import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BoardRepository } from '../data/board.repository';
import { CreateBoardDto } from '../dto/create-board.dto';
import { ConfigService } from '../../config/config.service';
import { Board } from '../types/board';

@Injectable()
export class BoardService {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly configService: ConfigService,
  ) {}

  async createBoard(createBoardDto: CreateBoardDto): Promise<Board> {
    return this.boardRepository.createBoard(createBoardDto);
  }

  async getBoardById(id: string): Promise<Board> {
    const boardId = Number(id);
    if (isNaN(boardId)) {
      throw new BadRequestException('Invalid ID format');
    }
    const board = await this.boardRepository.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return board;
  }

  async getAllBoards(): Promise<Board[]> {
    return this.boardRepository.getAllBoards();
  }

  async updateBoard(id: string, updateBoardDto: Partial<Board>): Promise<Board> {
     const boardId = Number(id);
    if (isNaN(boardId)) {
      throw new BadRequestException('Invalid ID format');
    }
    const updatedBoard = await this.boardRepository.updateBoard(boardId, updateBoardDto);
    if (!updatedBoard) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return updatedBoard;
  }

  async deleteBoard(id: string): Promise<void> {
     const boardId = Number(id);
    if (isNaN(boardId)) {
      throw new BadRequestException('Invalid ID format');
    }
    await this.boardRepository.deleteBoard(boardId);
  }
}
