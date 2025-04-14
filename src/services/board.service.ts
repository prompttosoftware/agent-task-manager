import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../types/board.d';
import { BoardRepository } from '../data/board.repository';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(BoardRepository) private boardRepository: Repository<Board>,
  ) {}

  async findById(id: string): Promise<Board | undefined> {
    const board = await this.boardRepository.findOne({ where: { id } });
    return board;
  }
