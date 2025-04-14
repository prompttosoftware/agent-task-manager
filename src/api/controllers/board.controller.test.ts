// src/api/controllers/board.controller.test.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BoardController } from './board.controller';
import { BoardService } from '../services/board.service';
import { Board } from '../types/board.d';
import { v4 as uuidv4 } from 'uuid';
import { validate } from 'class-validator';

describe('BoardController', () => {
  let controller: BoardController;
  let boardService: BoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardController],
      providers: [
        { provide: BoardService, useValue: {
          getBoard: jest.fn().mockResolvedValue(undefined),
        } },
      ],
    }).compile();

    controller = module.get<BoardController>(BoardController);
    boardService = module.get<BoardService>(BoardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a board when boardId is valid', async () => {
    const boardId = uuidv4();
    const board: Board = { id: boardId, name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(boardService, 'getBoard').mockResolvedValue(board);

    const result = await controller.getBoard({ params: { boardId } } as any, { json: jest.fn() } as any);

    expect(boardService.getBoard).toHaveBeenCalledWith(boardId);
    expect((result as any).json).toHaveBeenCalledWith(board);
  });

  it('should return 404 if board is not found', async () => {
    const boardId = uuidv4();
    jest.spyOn(boardService, 'getBoard').mockResolvedValue(undefined);

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.getBoard({ params: { boardId } } as any, res);

    expect(boardService.getBoard).toHaveBeenCalledWith(boardId);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Board not found' });
  });

  it('should return 400 if boardId is invalid', async () => {
    const boardId = 'invalid-uuid';
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.getBoard({ params: { boardId } } as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should handle errors and return 500', async () => {
    const boardId = uuidv4();
    const errorMessage = 'Internal server error';
    jest.spyOn(boardService, 'getBoard').mockRejectedValue(new Error(errorMessage));

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.getBoard({ params: { boardId } } as any, res);

    expect(boardService.getBoard).toHaveBeenCalledWith(boardId);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});