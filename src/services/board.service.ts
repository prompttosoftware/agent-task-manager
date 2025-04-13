// src/services/board.service.ts

import { Board } from '../types/board';
import { connectToDatabase } from '../database'; // Assuming you have a database connection function

export class BoardService {
  async createBoard(boardData: Partial<Board>): Promise<Board> {
    const { db } = await connectToDatabase();
    const collection = db.collection('boards');
    const result = await collection.insertOne(boardData);
    const newBoard: Board = { ...boardData, id: result.insertedId.toString() } as Board;
    return newBoard;
  }

  async getBoardById(id: string): Promise<Board | null> {
    const { db } = await connectToDatabase();
    const collection = db.collection('boards');
    const board = await collection.findOne({ id });
    return board as Board | null;
  }

  async updateBoard(id: string, boardData: Partial<Board>): Promise<Board | null> {
    const { db } = await connectToDatabase();
    const collection = db.collection('boards');
    const result = await collection.updateOne({ id }, { $set: boardData });
    if (result.modifiedCount === 0) {
      return null;
    }
    const updatedBoard = await collection.findOne({ id });
    return updatedBoard as Board | null;
  }

  async deleteBoard(id: string): Promise<boolean> {
    const { db } = await connectToDatabase();
    const collection = db.collection('boards');
    const result = await collection.deleteOne({ id });
    return result.deletedCount === 1;
  }
}
