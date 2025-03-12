// tests/models/board.test.ts
import { Board } from '../src/models/board';

// Mock data for testing
const validBoardData = {
  name: 'Test Board',
  description: 'This is a test board',
};

describe('Board Model', () => {
  it('should create a board with valid data', () => {
    const board = new Board(validBoardData);
    expect(board.name).toBe(validBoardData.name);
    expect(board.description).toBe(validBoardData.description);
  });

  it('should throw an error if name is missing', () => {
    // @ts-ignore - Ignoring type check for testing purposes
    const invalidBoardData = { ...validBoardData, name: undefined };
    expect(() => new Board(invalidBoardData)).toThrowError();
  });

  it('should throw an error if description is missing', () => {
    // @ts-ignore - Ignoring type check for testing purposes
    const invalidBoardData = { ...validBoardData, description: undefined };
    expect(() => new Board(invalidBoardData)).toThrowError();
  });

  // Add more tests for other methods and properties of the Board model
});
