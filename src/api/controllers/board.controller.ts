import { Controller, Post, Body, Get, Param, Put, Delete, UsePipes, ValidationPipe, Inject } from '@nestjs/common';
import { CreateBoardDto } from '../dto/create-board.dto';
import { BoardService } from '../services/board.service';
import { Board } from '../types/board';

@Controller('boards')
export class BoardController {
  constructor(@Inject(BoardService) private readonly boardService: BoardService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createBoardDto: CreateBoardDto): Promise<Board> {
    return this.boardService.createBoard(createBoardDto);
  }

  @Get()
  async findAll(): Promise<Board[]> {
    return this.boardService.getAllBoards();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Board> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      // Handle invalid ID format
      throw new Error('Invalid ID format');
    }
    return this.boardService.getBoardById(parsedId);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(@Param('id') id: string, @Body() updateBoardDto: CreateBoardDto): Promise<Board> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      // Handle invalid ID format
      throw new Error('Invalid ID format');
    }
    return this.boardService.updateBoard(parsedId, updateBoardDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      // Handle invalid ID format
      throw new Error('Invalid ID format');
    }
    await this.boardService.deleteBoard(parsedId);
  }
}
