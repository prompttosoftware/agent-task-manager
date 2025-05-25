// src/dataStore.ts

import { DbSchema, AnyIssue } from './models';

/**
 * In-memory database.
 */
export const db: DbSchema = {
  issues: [],
  issueKeyCounter: 0,
};

/**
 * Adds an issue to the data store.
 * @param issue The issue to add.
 */
export function addIssue(issue: AnyIssue): void {
  db.issues.push(issue);
}

/**
 * Generates the next issue key.
 * Increments the global issue key counter and returns a new key
 * in the format "ATM-X".
 * @returns The next issue key (e.g., "ATM-1", "ATM-2").
 */
export function getNextIssueKey(): string {
  db.issueKeyCounter += 1;
  return `ATM-${db.issueKeyCounter}`;
}

/**
 * Retrieves all issues from the data store.
 * @returns An array of all issues.
 */
export function getAllIssues(): AnyIssue[] {
  return db.issues;
}
