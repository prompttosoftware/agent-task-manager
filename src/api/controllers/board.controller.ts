import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { BoardService } from '../services/board.service';
import { CreateBoardDto } from '../api/dto/create-board.dto';
import { UpdateBoardDto } from '../api/dto/update-board.dto';
import { Board } from '../models/board.model';

@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  async create(@Body() createBoardDto: CreateBoardDto): Promise<Board> {
    return this.boardService.createBoard(createBoardDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Board> {
    const board = await this.boardService.getBoardById(id);
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return board;
  }

  @Get()
  async findAll(): Promise<Board[]> {
    return this.boardService.getAllBoards();
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto): Promise<Board> {
    const board = await this.boardService.updateBoard(id, updateBoardDto);
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return board;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    const board = await this.boardService.deleteBoard(id);
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return;
  }
}