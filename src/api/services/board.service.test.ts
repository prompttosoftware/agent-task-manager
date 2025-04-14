// src/api/services/board.service.test.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { BoardRepository } from '../data/board.repository';
import { Board } from '../types/board.d';
import { v4 as uuidv4 } from 'uuid';

describe('BoardService', () => {
  let service: BoardService;
  let boardRepository: BoardRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        { provide: BoardRepository, useValue: {
          findById: jest.fn(),
        } },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    boardRepository = module.get<BoardRepository>(BoardRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a board when found', async () => {
    const boardId = uuidv4();
    const expectedBoard: Board = { id: boardId, name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(boardRepository, 'findById').mockResolvedValue(expectedBoard);

    const result = await service.getBoard(boardId);

    expect(boardRepository.findById).toHaveBeenCalledWith(boardId);
    expect(result).toEqual(expectedBoard);
  });

  it('should return undefined when not found', async () => {
    const boardId = uuidv4();
    jest.spyOn(boardRepository, 'findById').mockResolvedValue(undefined);

    const result = await service.getBoard(boardId);

    expect(boardRepository.findById).toHaveBeenCalledWith(boardId);
    expect(result).toBeUndefined();
  });
});