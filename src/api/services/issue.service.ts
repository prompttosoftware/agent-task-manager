// src/api/services/issue.service.ts

import { Issue } from '../types/issue';
import { db } from '../../data/db';

export const getIssuesForBoard = async (boardId: string): Promise<Issue[]> => {
  console.log(`[IssueService] getIssuesForBoard called for boardId: ${boardId}`);
  try {
    const issues = await db.query<Issue[]>('SELECT * FROM issues WHERE boardId = $1', [boardId]);
    console.log(`[IssueService] Retrieved ${issues.rows.length} issues for boardId: ${boardId}`);
    return issues.rows;
  } catch (error) {
    console.error('[IssueService] Error fetching issues for board:', error);
    throw new Error('Failed to fetch issues for board');
  }
};

export const addIssue = async (issue: any): Promise<Issue> => {
  console.log('[IssueService] addIssue called with:', issue);
  try {
    const result = await db.query<Issue>(
      'INSERT INTO issues (issueKey, summary, description, boardId) VALUES ($1, $2, $3, $4) RETURNING *',
      [issue.issueKey, issue.summary, issue.description, issue.boardId]
    );
    console.log('[IssueService] Issue added successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('[IssueService] Error adding issue:', error);
    throw new Error('Failed to add issue');
  }
};

export const updateIssue = async (issueKey: string, issue: any): Promise<Issue | null> => {
  console.log(`[IssueService] updateIssue called for issueKey: ${issueKey} with data:`, issue);
  try {
    const result = await db.query<Issue>(
      'UPDATE issues SET summary = $1, description = $2 WHERE issueKey = $3 RETURNING *',
      [issue.summary, issue.description, issueKey]
    );
    if (result.rowCount === 0) {
      console.warn(`[IssueService] Issue not found for update with issueKey: ${issueKey}`);
      return null;
    }
    console.log(`[IssueService] Issue updated successfully for issueKey: ${issueKey}`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('[IssueService] Error updating issue:', error);
    throw new Error('Failed to update issue');
  }
};

export const deleteIssue = async (issueKey: string): Promise<void> => {
  console.log(`[IssueService] deleteIssue called for issueKey: ${issueKey}`);
  try {
    await db.query('DELETE FROM issues WHERE issueKey = $1', [issueKey]);
    console.log(`[IssueService] Issue deleted successfully for issueKey: ${issueKey}`);
  } catch (error) {
    console.error('[IssueService] Error deleting issue:', error);
    throw new Error('Failed to delete issue');
  }
};

export const updateAssignee = async (issueKey: string, assignee: string): Promise<Issue | null> => {
  console.log(`[IssueService] updateAssignee called for issueKey: ${issueKey} with assignee: ${assignee}`);
  try {
    const result = await db.query<Issue>(
      'UPDATE issues SET assignee = $1 WHERE issueKey = $2 RETURNING *',
      [assignee, issueKey]
    );
    if (result.rowCount === 0) {
      console.warn(`[IssueService] Issue not found for assignee update with issueKey: ${issueKey}`);
      return null;
    }
    console.log(`[IssueService] Assignee updated successfully for issueKey: ${issueKey}`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('[IssueService] Error updating assignee:', error);
    throw new Error('Failed to update assignee');
  }
};
