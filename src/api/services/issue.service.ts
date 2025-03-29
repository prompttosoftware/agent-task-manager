// This file contains the service logic for managing issues.

import { Issue } from '../types/issue';
import { db } from '../../db/database'; // Assuming you have a database module
import { IssueLink } from '../types/issue';

/**
 * Deletes an issue.
 * @param issueKey The key of the issue to delete.
 * @returns A promise that resolves when the issue is deleted.
 */
export async function deleteIssue(issueKey: string): Promise<void> {
  try {
    // Delete the issue from the database
    await db.deleteIssue(issueKey);
    console.log(`Issue with key ${issueKey} deleted successfully.`);
  } catch (error) {
    // Handle errors, such as the issue not existing or permission issues.
    console.error(`Error deleting issue with key ${issueKey}:`, error);
    throw new Error(`Failed to delete issue: ${issueKey}.  ${(error as Error).message}`); // Re-throw to be handled by the controller
  }
}

/**
 * Checks if an issue exists.
 * @param issueKey The key of the issue to check.
 * @returns A promise that resolves to true if the issue exists, false otherwise.
 */
export async function issueExists(issueKey: string): Promise<boolean> {
  try {
    const issue = await db.getIssue(issueKey);
    return !!issue;
  } catch (error) {
    console.error(`Error checking if issue exists with key ${issueKey}:`, error);
    return false; // Or throw the error, depending on your needs
  }
}

/**
 * Creates an issue link.
 * @param issueLink The issue link object.
 * @returns A promise that resolves when the issue link is created.
 */
export async function createIssueLink(issueLink: IssueLink): Promise<void> {
  try {
    // Implement the logic to create the issue link in the database
    await db.createIssueLink(issueLink);
    console.log(`Issue link created successfully: ${JSON.stringify(issueLink)}`);
  } catch (error) {
    console.error(`Error creating issue link:`, error);
    throw new Error(`Failed to create issue link.  ${(error as Error).message}`); // Re-throw to be handled by the controller
  }
}
