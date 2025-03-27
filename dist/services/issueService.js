"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIssuesForBoardService = void 0;
const index_1 = require("../index");
const getIssuesForBoardService = async (boardId) => {
    const boardIssues = [];
    index_1.issueToBoard.forEach((boardIdForIssue, issueKey) => {
        if (boardIdForIssue === boardId) {
            const issue = index_1.issues.get(issueKey);
            if (issue) {
                boardIssues.push(issue);
            }
        }
    });
    return boardIssues;
};
exports.getIssuesForBoardService = getIssuesForBoardService;
//# sourceMappingURL=issueService.js.map