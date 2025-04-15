import { Test, TestingModule, INestApplication } from '@nestjs/testing';
import { BoardController } from './board.controller';
import { BoardService } from '../services/board.service';
import { CreateBoardDto } from '../dto/create-board.dto';
import { Board } from '../../types/board.d';
import * as request from 'supertest';
import { ConfigService } from '../../config/config.service';

describe('BoardController', () => {
  let app: INestApplication;
  let boardService: BoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardController],
      providers: [
        { provide: BoardService, useValue: { createBoard: jest.fn(), getAllBoards: jest.fn(), getBoardById: jest.fn(), updateBoard: jest.fn(), deleteBoard: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn(key => (key === 'port' ? 3000 : null)) } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    boardService = module.get<BoardService>(BoardService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(boardService).toBeDefined();
  });

  it('should create a board', async () => {
    const createBoardDto: CreateBoardDto = { name: 'Test Board', description: 'Test Description' };
    const createdBoard: Board = { id: '1', ...createBoardDto, createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(boardService, 'createBoard').mockResolvedValue(createdBoard);

    const response = await request(app.getHttpServer())
      .post('/boards')
      .send(createBoardDto)
      .expect(201);

    expect(response.body).toEqual(createdBoard);
    expect(boardService.createBoard).toHaveBeenCalledWith(createBoardDto);
  });

  it('should get all boards', async () => {
    const boards: Board[] = [
      { id: '1', name: 'Board 1', description: 'Desc 1', createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Board 2', description: 'Desc 2', createdAt: new Date(), updatedAt: new Date() },
    ];
    jest.spyOn(boardService, 'getAllBoards').mockResolvedValue(boards);

    const response = await request(app.getHttpServer())
      .get('/boards')
      .expect(200);

    expect(response.body).toEqual(boards);
    expect(boardService.getAllBoards).toHaveBeenCalled();
  });

  it('should get a board by id', async () => {
    const boardId = '1';
    const board: Board = { id: boardId, name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(boardService, 'getBoardById').mockResolvedValue(board);

    const response = await request(app.getHttpServer())
      .get(`/boards/${boardId}`)
      .expect(200);

    expect(response.body).toEqual(board);
    expect(boardService.getBoardById).toHaveBeenCalledWith(boardId);
  });

  it('should update a board', async () => {
    const boardId = '1';
    const updateBoardDto: CreateBoardDto = { name: 'Updated Name', description: 'Updated Description' };
    const updatedBoard: Board = { id: boardId, ...updateBoardDto, createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(boardService, 'updateBoard').mockResolvedValue(updatedBoard);

    const response = await request(app.getHttpServer())
      .put(`/boards/${boardId}`)
      .send(updateBoardDto)
      .expect(200);

    expect(response.body).toEqual(updatedBoard);
    expect(boardService.updateBoard).toHaveBeenCalledWith(boardId, updateBoardDto);
  });

  it('should delete a board', async () => {
    const boardId = '1';
    jest.spyOn(boardService, 'deleteBoard').mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/boards/${boardId}`)
      .expect(204);

    expect(boardService.deleteBoard).toHaveBeenCalledWith(boardId);
  });
});