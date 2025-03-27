import { Issue } from '../types';
import { boards, issues, issueToBoard } from '../index';

export const getIssuesForBoardService = async (boardId: number): Promise<Issue[]> => {
  const boardIssues: Issue[] = [];

  issueToBoard.forEach((boardIdForIssue, issueKey) => {
    if (boardIdForIssue === boardId) {
      const issue = issues.get(issueKey);
      if (issue) {
        boardIssues.push(issue);
      }
    }
  });

  return boardIssues;
};
