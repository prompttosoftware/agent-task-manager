import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { BoardRepository } from '../data/board.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Board } from '../types/board.d';

describe('BoardService', () => {
  let service: BoardService;
  let boardRepository: BoardRepository;

  const mockBoard: Board = {
    id: '1',
    title: 'Test Board',
    description: 'Test Description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: getRepositoryToken(BoardRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockBoard),
          },
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    boardRepository = module.get<BoardRepository>(boardRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a board if found', async () => {
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(mockBoard);
      const result = await service.findById('1');
      expect(result).toEqual(mockBoard);
      expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException if board is not found', async () => {
      jest.spyOn(boardRepository, 'findOne').mockResolvedValueOnce(undefined);
      await expect(service.findById('2')).rejects.toThrow(NotFoundException);
      expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: '2' } });
    });
  });
});
