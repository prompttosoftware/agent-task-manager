import { Request, Response, NextFunction } from 'express';
import { getEpics } from './epicController';
import * as IssueModel from '../../models/issue';

// Mock the Issue module
jest.mock('../../models/issue');

describe('getEpics', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockedFindAll: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {  //Correctly chain the methods
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Properly mock the Issue model and its findAll method
    (IssueModel as any).Issue = {
      findAll: jest.fn(),
    };

    mockedFindAll = (IssueModel as any).Issue.findAll;

    jest.clearAllMocks();
  });

  it('should call Issue.findAll with the correct parameters and respond with the found epics', async () => {
    const mockEpics = [{ id: 1, title: 'Epic 1' }, { id: 2, title: 'Epic 2' }];
    mockedFindAll.mockResolvedValue(mockEpics);

    await getEpics(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockedFindAll).toHaveBeenCalledWith({ where: { issueTypeId: 1 } });
    expect(mockResponse.json).toHaveBeenCalledWith(mockEpics);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next with the error if Issue.findAll throws an error', async () => {
    const mockError = new Error('Database error');
    mockedFindAll.mockRejectedValue(mockError);

    await getEpics(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockedFindAll).toHaveBeenCalledWith({ where: { issueTypeId: 1 } });
    expect(mockResponse.json).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(mockError);
  });

  it('should respond with an empty array if no epics are found', async () => {
    mockedFindAll.mockResolvedValue([]);

    await getEpics(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockedFindAll).toHaveBeenCalledWith({ where: { issueTypeId: 1 } });
    expect(mockResponse.json).toHaveBeenCalledWith([]);
    expect(mockNext).not.toHaveBeenCalled();
  });
});