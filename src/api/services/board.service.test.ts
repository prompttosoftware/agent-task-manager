import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from '../services/board.service';
import { BoardRepository } from '../../data/board.repository';
import { ConfigService } from '../../config/config.service';
import { Board } from '../../types/board.d';
import { CreateBoardDto } from '../../api/dto/create-board.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigModule } from '../../config/config.module';


describe('BoardService', () => {
  let service: BoardService;
  let boardRepository: Repository<Board>;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        BoardService,
        {
          provide: getRepositoryToken(Board),
          useClass: Repository,
        },
        ConfigService,
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(boardRepository).toBeDefined();
    expect(configService).toBeDefined();
  });

  it('should create a board', async () => {
    const createBoardData: CreateBoardDto = { name: 'Test Board', description: 'Test Description' };
    const createdBoard: Board = { id: '1', ...createBoardData, createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(boardRepository, 'save').mockResolvedValue(createdBoard);

    const result = await service.createBoard(createBoardData);

    expect(result).toEqual(createdBoard);
    expect(boardRepository.save).toHaveBeenCalledWith(expect.objectContaining(createBoardData));
  });

  it('should get a board by id', async () => {
    const boardId = '1';
    const board: Board = { id: boardId, name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);

    const result = await service.getBoardById(boardId);

    expect(result).toEqual(board);
    expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: boardId } });
  });

  it('should get all boards', async () => {
    const boards: Board[] = [
      { id: '1', name: 'Board 1', description: 'Desc 1', createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Board 2', description: 'Desc 2', createdAt: new Date(), updatedAt: new Date() },
    ];
    jest.spyOn(boardRepository, 'find').mockResolvedValue(boards);

    const result = await service.getAllBoards();

    expect(result).toEqual(boards);
    expect(boardRepository.find).toHaveBeenCalled();
  });

  it('should update a board', async () => {
    const boardId = '1';
    const updateBoardData: Partial<Board> = { name: 'Updated Name', description: 'Updated Description' };
    const existingBoard: Board = { id: boardId, name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
    const updatedBoard: Board = { ...existingBoard, ...updateBoardData, updatedAt: new Date() };
    jest.spyOn(boardRepository, 'findOne').mockResolvedValue(existingBoard);
    jest.spyOn(boardRepository, 'save').mockResolvedValue(updatedBoard);

    const result = await service.updateBoard(boardId, updateBoardData);

    expect(result).toEqual(updatedBoard);
    expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: boardId } });
    expect(boardRepository.save).toHaveBeenCalledWith(expect.objectContaining(updatedBoard));
  });

  it('should delete a board', async () => {
    const boardId = '1';
    const existingBoard: Board = { id: boardId, name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(boardRepository, 'findOne').mockResolvedValue(existingBoard);
    jest.spyOn(boardRepository, 'remove').mockResolvedValue(existingBoard);

    await service.deleteBoard(boardId);

    expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: boardId } });
    expect(boardRepository.remove).toHaveBeenCalledWith(existingBoard);
  });

  it('should throw NotFoundException if board is not found', async () => {
    const boardId = '999';
    jest.spyOn(boardRepository, 'findOne').mockResolvedValue(undefined);

    await expect(service.getBoardById(boardId)).rejects.toThrowError(NotFoundException);
    expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: boardId } });
  });

  it('should throw BadRequestException for invalid ID format', async () => {
    const invalidId = 'abc';
    await expect(service.getBoardById(invalidId)).rejects.toThrowError(BadRequestException);
    await expect(service.updateBoard(invalidId, {name: 'test', description: 'test'})).rejects.toThrowError(BadRequestException);
    await expect(service.deleteBoard(invalidId)).rejects.toThrowError(BadRequestException);
  });
});