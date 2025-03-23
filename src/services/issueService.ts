import { Readable } from 'stream';
import { Issue } from '../types/issue';

// In-memory storage for issues
let issues: Issue[] = [];

export const issueService = {
    async createIssue(issue: Issue): Promise<Issue> {
        // Assign a unique ID (you might use a UUID library in a real application)
        const newIssue = { ...issue, id: Math.random().toString() };
        issues.push(newIssue);
        return newIssue;
    },

    async getIssue(issueId: string): Promise<Issue | undefined> {
        const issue = issues.find(issue => issue.id === issueId);
        return issue;
    },

  async linkIssue(issueId: string, linkedIssueId: string, linkType: string) {
    // In a real application, this would involve database interactions.
    // For this example, we'll just simulate a successful link.
    console.log(`Linking issue ${issueId} to ${linkedIssueId} with type ${linkType}`);
    // Simulate a delay to represent an asynchronous operation
    await new Promise(resolve => setTimeout(resolve, 50));
    return;
  },

  async addAttachment(issueId: string, fileStream: Readable, attachmentDetails: {
    filename: string;
    mimetype: string;
    size: number;
    encoding: string;
  }) {
    // In a real application, this would involve saving the file to a storage system (e.g., cloud storage, file system) and associating it with the issue.
    console.log(`Adding attachment to issue ${issueId}:`, attachmentDetails);
    // You would typically use a library to handle file uploads and storage.
    // For this example, we just simulate the upload.
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate upload time
    console.log("Attachment added successfully");
  }
};
