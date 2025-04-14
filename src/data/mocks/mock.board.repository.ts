import { BoardRepository } from '../board.repository';
import { Board } from '../../src/types/board.d';

export const mockBoardRepository = () => ({
  findById: jest.fn().mockImplementation((id: string): Promise<Board | null> => {
    if (id === '1') {
      return Promise.resolve({ id: '1', title: 'Test Board', description: 'Test Description' } as Board);
    }
    return Promise.resolve(null);
  }),
  // Add other methods as needed
});