// This file contains the service logic for managing issues.

import { Issue } from '../types/issue';
import { db } from '../../db/database'; // Assuming you have a database module

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
