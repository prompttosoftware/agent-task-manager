"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const issueController_1 = require("./issueController");
const issueService_1 = require("../services/issueService");
// Mock the service
vitest_1.vi.mock('../services/issueService');
(0, vitest_1.describe)('IssueController', () => {
    let mockRequest;
    let mockResponse;
    (0, vitest_1.beforeEach)(() => {
        mockRequest = {
            params: { boardId: '1' },
        };
        mockResponse = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        // Clear mocks before each test
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should return 200 with issues when the board exists and issues are found', async () => {
        const boardId = 1;
        const mockIssues = [
            {
                id: 1,
                key: 'ATM-1',
                fields: { summary: 'Test Issue', status: { name: 'To Do' } },
            },
        ];
        // Mock the service to return issues
        vitest_1.vi.mocked(issueService_1.getIssuesForBoardService).mockResolvedValue(mockIssues);
        await (0, issueController_1.getIssuesForBoardController)(mockRequest, mockResponse);
        (0, vitest_1.expect)(issueService_1.getIssuesForBoardService).toHaveBeenCalledWith(boardId);
        (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(200);
        (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith(mockIssues);
    });
    (0, vitest_1.it)('should return 404 when board does not exist', async () => {
        const boardId = 999; // Non-existent board ID
        // Mock the service to throw an error (board not found).
        vitest_1.vi.mocked(issueService_1.getIssuesForBoardService).mockRejectedValue(new Error('Board not found'));
        await (0, issueController_1.getIssuesForBoardController)(mockRequest, mockResponse);
        (0, vitest_1.expect)(issueService_1.getIssuesForBoardService).toHaveBeenCalledWith(boardId);
        (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(500);
        (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to fetch issues' });
    });
    (0, vitest_1.it)('should return 500 when service throws an error', async () => {
        // Mock the service to throw an error (internal server error).
        vitest_1.vi.mocked(issueService_1.getIssuesForBoardService).mockRejectedValue(new Error('Internal server error'));
        await (0, issueController_1.getIssuesForBoardController)(mockRequest, mockResponse);
        (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(500);
        (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to fetch issues' });
    });
});
//# sourceMappingURL=issueController.test.js.map