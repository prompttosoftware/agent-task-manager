// src/api/services/issue.service.ts

import { Issue } from '../types/issue';
import { db } from '../../data/db';

export const getIssuesForBoard = async (boardId: string): Promise<Issue[]> => {  
  try {
    const issues = await db.query<Issue[]>('SELECT * FROM issues WHERE boardId = $1', [boardId]);
    return issues.rows;
  } catch (error) {
    console.error('Error fetching issues for board:', error);
    throw new Error('Failed to fetch issues for board');
  }
};

export const addIssue = async (issue: any): Promise<Issue> => {
  try {
    const result = await db.query<Issue>(
      'INSERT INTO issues (issueKey, summary, description, boardId) VALUES ($1, $2, $3, $4) RETURNING *',
      [issue.issueKey, issue.summary, issue.description, issue.boardId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding issue:', error);
    throw new Error('Failed to add issue');
  }
};

export const updateIssue = async (issueKey: string, issue: any): Promise<Issue | null> => {
  try {
    const result = await db.query<Issue>(
      'UPDATE issues SET summary = $1, description = $2 WHERE issueKey = $3 RETURNING *',
      [issue.summary, issue.description, issueKey]
    );
    if (result.rowCount === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating issue:', error);
    throw new Error('Failed to update issue');
  }
};

export const deleteIssue = async (issueKey: string): Promise<void> => {
  try {
    await db.query('DELETE FROM issues WHERE issueKey = $1', [issueKey]);
  } catch (error) {
    console.error('Error deleting issue:', error);
    throw new Error('Failed to delete issue');
  }
};

export const updateAssignee = async (issueKey: string, assignee: string): Promise<Issue | null> => {
  try {
    const result = await db.query<Issue>(
      'UPDATE issues SET assignee = $1 WHERE issueKey = $2 RETURNING *',
      [assignee, issueKey]
    );
    if (result.rowCount === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating assignee:', error);
    throw new Error('Failed to update assignee');
  }
};
