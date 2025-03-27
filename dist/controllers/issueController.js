"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIssuesForBoardController = void 0;
const issueService_1 = require("../services/issueService");
const getIssuesForBoardController = async (req, res) => {
    const boardId = parseInt(req.params.boardId, 10);
    try {
        const issues = await (0, issueService_1.getIssuesForBoardService)(boardId);
        res.json(issues);
    }
    catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
};
exports.getIssuesForBoardController = getIssuesForBoardController;
//# sourceMappingURL=issueController.js.map