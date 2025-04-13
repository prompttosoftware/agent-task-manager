// src/services/board.service.test.ts

import { BoardService } from './board.service';
import { Board } from '../types/issue'; // Assuming you have a Board type defined in issue.d.ts

describe('BoardService', () => {
  let boardService: BoardService;
  let createdBoardId: string | undefined;

  beforeEach(() => {
    boardService = new BoardService();
  });

  afterEach(async () => {
    if (createdBoardId) {
      try {
        await boardService.deleteBoard(createdBoardId);
      } catch (error) {
        console.error('Error cleaning up test board:', error);
      }
      createdBoardId = undefined;
    }
  });

  it('should create a board', async () => {
    const boardData = { name: 'Test Board', description: 'Test Description' };
    const createdBoard = await boardService.createBoard(boardData);
    createdBoardId = createdBoard.id;
    expect(createdBoard).toBeDefined();
    expect(createdBoard.name).toBe(boardData.name);
    expect(createdBoard.description).toBe(boardData.description);
  });

  it('should get a board by id', async () => {
    const createBoardData = { name: 'Board to Get', description: 'Description to Get' };
    const createdBoard = await boardService.createBoard(createBoardData);
    createdBoardId = createdBoard.id;

    const retrievedBoard = await boardService.getBoardById(createdBoard.id);

    expect(retrievedBoard).toBeDefined();
    expect(retrievedBoard?.id).toBe(createdBoard.id);
    expect(retrievedBoard?.name).toBe(createBoardData.name);
    expect(retrievedBoard?.description).toBe(createBoardData.description);
  });

  it('should update a board', async () => {
    const createBoardData = { name: 'Board to Update', description: 'Description to Update' };
    const createdBoard = await boardService.createBoard(createBoardData);
    createdBoardId = createdBoard.id;

    const updateBoardData = { name: 'Updated Board', description: 'Updated Description' };
    const updatedBoard = await boardService.updateBoard(createdBoard.id, updateBoardData);

    expect(updatedBoard).toBeDefined();
    expect(updatedBoard?.id).toBe(createdBoard.id);
    expect(updatedBoard?.name).toBe(updateBoardData.name);
    expect(updatedBoard?.description).toBe(updateBoardData.description);
  });

  it('should delete a board', async () => {
    const createBoardData = { name: 'Board to Delete', description: 'Description to Delete' };
    const createdBoard = await boardService.createBoard(createBoardData);
    const deleted = await boardService.deleteBoard(createdBoard.id);
    expect(deleted).toBe(true);
    createdBoardId = undefined;
    const retrievedBoard = await boardService.getBoardById(createdBoard.id);
    expect(retrievedBoard).toBeNull();
  });
});