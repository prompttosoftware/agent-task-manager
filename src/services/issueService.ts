/**
 * Represents the structure of an issue.
 */
interface IssueData {
  id?: string; // Add id to the interface
  summary: string;
  description: string;
  project: string;
  issueType: string;
  parent?: string; // Add parent key
  // Add other potential issue properties here as needed
}

import { saveIssue } from './inMemoryDatabase';

let issueCounter = 0; // Simple counter for unique IDs

/**
 * Creates a new issue based on the provided data.
 *
 * @param issueData The data for the issue to be created.
 * @returns The created issue data.
 */
export function createIssue(issueData: IssueData): IssueData {
  issueCounter++;
  const id = `ISSUE-${issueCounter.toString().padStart(3, '0')}`; // Generate unique ID

  const issueToSave = {
    ...issueData,
    id,
  };

  const savedIssue = saveIssue(issueToSave);
  console.log('Simulating issue creation with data:', issueToSave); // use the issueToSave, not the original issueData

  return savedIssue;
}
