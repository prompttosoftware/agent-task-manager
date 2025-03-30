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


/**
 * Retrieves issue creation metadata.
 * @param projectKeys Optional array of project keys to filter metadata.
 * @param issueTypeNames Optional array of issue type names to filter metadata.
 * @returns A promise that resolves to the issue creation metadata.
 */
export async function getIssueCreateMetadata(projectKeys?: string[], issueTypeNames?: string[]) {
  // In a real implementation, this would fetch metadata from a database or Jira API
  // and filter it based on the provided parameters.
  // This is a placeholder implementation.

  const metadata = {
    fields: {
      summary: {
        required: true,
        schema: {
          type: 'string'
        },
        name: 'Summary',
        key: 'summary',
        hasDefaultValue: false,
        operations: ['set']
      },
      description: {
        required: false,
        schema: {
          type: 'string'
        },
        name: 'Description',
        key: 'description',
        hasDefaultValue: false,
        operations: ['set']
      },
      priority: {
        required: true,
        schema: {
          type: 'string',
          allowedValues: ['High', 'Medium', 'Low']
        },
        name: 'Priority',
        key: 'priority',
        hasDefaultValue: true,
        defaultValue: 'Medium',
        operations: ['set']
      },
      assignee: {
        required: false,
        schema: {
          type: 'string'
        },
        name: 'Assignee',
        key: 'assignee',
        hasDefaultValue: false,
        operations: ['set']
      },
      reporter: {
        required: true,
        schema: {
          type: 'string'
        },
        name: 'Reporter',
        key: 'reporter',
        hasDefaultValue: true,
        defaultValue: 'CurrentUser',
        operations: ['set']
      },
      issuetype: {
        required: true,
        schema: {
          type: 'string',
          allowedValues: ['Bug', 'Task', 'Story']
        },
        name: 'Issue Type',
        key: 'issuetype',
        hasDefaultValue: true,
        defaultValue: 'Task',
        operations: ['set']
      }
    },
    projects: [
      {
        key: 'ATM',
        name: 'Agent Task Manager',
        id: '1'
      }
    ],
    issueTypes: [
      {
        id: '1',
        name: 'Bug'
      },
      {
        id: '2',
        name: 'Task'
      },
      {
        id: '3',
        name: 'Story'
      }
    ]
  }

  //Filtering by projectKeys
  if (projectKeys && projectKeys.length > 0) {
    metadata.projects = metadata.projects.filter(project => projectKeys.includes(project.key));
  }

  //Filtering by issueTypeNames
    if (issueTypeNames && issueTypeNames.length > 0) {
    metadata.issueTypes = metadata.issueTypes.filter(issueType => issueTypeNames.includes(issueType.name));
  }

  return metadata;
}