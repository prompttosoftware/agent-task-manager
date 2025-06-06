import { createIssue } from './issueService';
import { getAllIssues, clearDatabase } from './inMemoryDatabase';

describe('issueService', () => {
  afterEach(() => {
    clearDatabase();
  });

  describe('createIssue', () => {
    it('should create and return a new object with a unique ID', () => {
      const mockIssueData = {
        summary: 'Test Issue',
        description: 'This is a test issue description.',
        project: 'TEST',
        issueType: 'Bug',
      };

      const createdIssue = createIssue(mockIssueData);
      const issuesInDB = getAllIssues();
      expect(issuesInDB.length).toBe(1);
      expect(issuesInDB[0].id).toBeDefined();
      expect(issuesInDB[0].id).toMatch(/^ISSUE-\d{3}$/); // Check ID format

      // Check if the created issue contains the expected data
      expect(issuesInDB[0].summary).toBe(mockIssueData.summary);
      expect(issuesInDB[0].description).toBe(mockIssueData.description);
      expect(issuesInDB[0].project).toBe(mockIssueData.project);
      expect(issuesInDB[0].issueType).toBe(mockIssueData.issueType);
    });

    it('should handle issue data with an optional parent field', () => {
      const mockIssueDataWithParent = {
        summary: 'Subtask Issue',
        description: 'This is a subtask description.',
        project: 'TEST',
        issueType: 'Subtask',
        parent: 'test-123',
      };

      const createdIssue = createIssue(mockIssueDataWithParent);
      const issuesInDB = getAllIssues();

      expect(issuesInDB.length).toBe(1);
      expect(issuesInDB[0].id).toBeDefined();
      expect(issuesInDB[0].id).toMatch(/^ISSUE-\d{3}$/); // Check ID format

      expect(issuesInDB[0].summary).toBe(mockIssueDataWithParent.summary);
      expect(issuesInDB[0].description).toBe(mockIssueDataWithParent.description);
      expect(issuesInDB[0].project).toBe(mockIssueDataWithParent.project);
      expect(issuesInDB[0].issueType).toBe(mockIssueDataWithParent.issueType);
      expect(issuesInDB[0].parent).toBe(mockIssueDataWithParent.parent);
    });

     it('should save the issue to the in-memory database', () => {
      const mockIssueData = {
        summary: 'Test Issue',
        description: 'This is a test issue description.',
        project: 'TEST',
        issueType: 'Bug',
      };

      createIssue(mockIssueData);
      const issuesInDB = getAllIssues();

      expect(issuesInDB.length).toBe(1);
      expect(issuesInDB[0].summary).toBe(mockIssueData.summary);
      expect(issuesInDB[0].description).toBe(mockIssueData.description);
      expect(issuesInDB[0].project).toBe(mockIssueData.project);
      expect(issuesInDB[0].issueType).toBe(mockIssueData.issueType);
    });

    it('should generate unique IDs for multiple issues', () => {
      const mockIssueData1 = {
        summary: 'Test Issue 1',
        description: 'Description 1',
        project: 'PROJ1',
        issueType: 'Bug',
      };
      const mockIssueData2 = {
        summary: 'Test Issue 2',
        description: 'Description 2',
        project: 'PROJ2',
        issueType: 'Task',
      };

      const issue1 = createIssue(mockIssueData1);
      const issue2 = createIssue(mockIssueData2);

      const issuesInDB = getAllIssues();

      expect(issuesInDB.length).toBe(2);
      expect(issue1.id).not.toBe(issue2.id);
      expect(issue1.id).toMatch(/^ISSUE-\d{3}$/);
      expect(issue2.id).toMatch(/^ISSUE-\d{3}$/);

      expect(issuesInDB[0].summary).toBe(mockIssueData1.summary);
      expect(issuesInDB[1].summary).toBe(mockIssueData2.summary);
    });

    it('should correctly assign the generated ID to the created issue', () => {
      const mockIssueData = {
        summary: 'Test Issue',
        description: 'This is a test issue description.',
        project: 'TEST',
        issueType: 'Bug',
      };

      const createdIssue = createIssue(mockIssueData);
      expect(createdIssue.id).toBeDefined();
      expect(createdIssue.id).toMatch(/^ISSUE-\d{3}$/);
    });

    // Add more test cases as needed, e.g., with different combinations of fields
  });

  // Add tests for other functions in issueService as they are implemented
});
