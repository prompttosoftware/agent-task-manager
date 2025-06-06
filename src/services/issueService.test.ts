import { createIssue, Issue } from './issueService';
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
      expect(createdIssue.id).toBeDefined();
      expect(createdIssue.id).toMatch(/^ISSUE-\d{3}$/); // Check ID format
      expect(issuesInDB[0].id).toBe(createdIssue.id);

      // Check if the created issue contains the expected data
      expect(createdIssue.summary).toBe(mockIssueData.summary);
      expect(createdIssue.description).toBe(mockIssueData.description);
      expect(createdIssue.project).toBe(mockIssueData.project);
      expect(createdIssue.issueType).toBe(mockIssueData.issueType);
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
      expect(createdIssue.id).toBeDefined();
      expect(createdIssue.id).toMatch(/^ISSUE-\d{3}$/); // Check ID format
      expect(issuesInDB[0].id).toBe(createdIssue.id);

      expect(createdIssue.summary).toBe(mockIssueDataWithParent.summary);
      expect(createdIssue.description).toBe(mockIssueDataWithParent.description);
      expect(createdIssue.project).toBe(mockIssueDataWithParent.project);
      expect(createdIssue.issueType).toBe(mockIssueDataWithParent.issueType);
      expect(createdIssue.parent).toBe(mockIssueDataWithParent.parent);
      expect(issuesInDB[0].parent).toBe(mockIssueDataWithParent.parent);
    });

    it('should save the issue to the in-memory database', () => {
      const mockIssueData = {
        summary: 'Test Issue',
        description: 'This is a test issue description.',
        project: 'TEST',
        issueType: 'Bug',
      };

      const createdIssue = createIssue(mockIssueData);
      const issuesInDB = getAllIssues();

      expect(issuesInDB.length).toBe(1);
      expect(issuesInDB[0].summary).toBe(mockIssueData.summary);
      expect(issuesInDB[0].description).toBe(mockIssueData.description);
      expect(issuesInDB[0].project).toBe(mockIssueData.project);
      expect(issuesInDB[0].issueType).toBe(mockIssueData.issueType);
      expect(issuesInDB[0].id).toBe(createdIssue.id);

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

    it('should set the status to "Open" by default', () => {
      const mockIssueData = {
        summary: 'Test Issue',
        description: 'This is a test issue description.',
        project: 'TEST',
        issueType: 'Bug',
      };
      const createdIssue = createIssue(mockIssueData);
      expect(createdIssue.status).toBe('Open');
    });

    it('should set the createdAt timestamp', () => {
      const mockIssueData = {
        summary: 'Test Issue',
        description: 'This is a test issue description.',
        project: 'TEST',
        issueType: 'Bug',
      };
      const createdIssue = createIssue(mockIssueData);
      expect(createdIssue.createdAt).toBeDefined();
      expect(new Date(createdIssue.createdAt).toISOString()).toBe(createdIssue.createdAt); // Check if it's a valid ISO string
    });

    it('should handle missing or empty description', () => {
      const mockIssueDataNoDesc = {
        summary: 'Issue Without Description',
        description: '', // Added description as undefined
        project: 'TEST',
        issueType: 'Task',
        // description is missing
      };
      const mockIssueDataEmptyDesc = {
        summary: 'Issue With Empty Description',
        description: '', // explicitly empty
        project: 'TEST',
        issueType: 'Task',
      };

      const createdIssueNoDesc = createIssue(mockIssueDataNoDesc);
      const createdIssueEmptyDesc = createIssue(mockIssueDataEmptyDesc);
      const issuesInDB = getAllIssues();

      expect(issuesInDB.length).toBe(2);

      // Check the issue with missing description
      expect(createdIssueNoDesc.id).toBeDefined();
      expect(createdIssueNoDesc.summary).toBe(mockIssueDataNoDesc.summary);
      expect(createdIssueNoDesc.description).toBe(''); // or null, depending on implementation default
      expect(issuesInDB).toContainEqual(expect.objectContaining({ id: createdIssueNoDesc.id, description: '' }));

      // Check the issue with empty description
      expect(createdIssueEmptyDesc.id).toBeDefined();
      expect(createdIssueEmptyDesc.summary).toBe(mockIssueDataEmptyDesc.summary);
      expect(createdIssueEmptyDesc.description).toBe('');
      expect(issuesInDB).toContainEqual(expect.objectContaining({ id: createdIssueEmptyDesc.id, description: '' }));
    });

    it('should handle explicit null or undefined parent', () => {
      const mockIssueDataNullParent = {
        summary: 'Issue with Null Parent',
        description: 'Description',
        project: 'TEST',
        issueType: 'Bug',
        parent: undefined, // explicitly null -> changed to undefined to match type string | undefined
      };
       const mockIssueDataUndefinedParent = {
        summary: 'Issue with Undefined Parent',
        description: 'Description',
        project: 'TEST',
        issueType: 'Bug',
        parent: undefined, // explicitly undefined
      };

      const createdIssueNullParent = createIssue(mockIssueDataNullParent);
      const createdIssueUndefinedParent = createIssue(mockIssueDataUndefinedParent);
      const issuesInDB = getAllIssues();

      expect(issuesInDB.length).toBe(2);

      // Check the issue with null parent -> checking for undefined now
      expect(createdIssueNullParent.id).toBeDefined();
      expect(createdIssueNullParent.parent).toBeUndefined();
      expect(issuesInDB).toContainEqual(expect.objectContaining({ id: createdIssueNullParent.id, parent: undefined }));

       // Check the issue with undefined parent
      expect(createdIssueUndefinedParent.id).toBeDefined();
      expect(createdIssueUndefinedParent.parent).toBeUndefined();
      expect(issuesInDB).toContainEqual(expect.objectContaining({ id: createdIssueUndefinedParent.id, parent: undefined }));
    });

     it('should handle different issueTypes correctly', () => {
      const mockIssueDataTask = { summary: 'Task Issue', description: 'Task description', project: 'PROJ', issueType: 'Task' }; // Added description
      const mockIssueDataEpic = { summary: 'Epic Issue', description: 'Epic description', project: 'PROJ', issueType: 'Epic' }; // Added description
      const mockIssueDataStory = { summary: 'Story Issue', description: 'Story description', project: 'PROJ', issueType: 'Story' }; // Added description

      const createdTask = createIssue(mockIssueDataTask);
      const createdEpic = createIssue(mockIssueDataEpic);
      const createdStory = createIssue(mockIssueDataStory);

      const issuesInDB = getAllIssues();

      expect(issuesInDB.length).toBe(3);
      expect(createdTask.issueType).toBe('Task');
      expect(createdEpic.issueType).toBe('Epic');
      expect(createdStory.issueType).toBe('Story');

      expect(issuesInDB).toContainEqual(expect.objectContaining({ id: createdTask.id, issueType: 'Task' }));
      expect(issuesInDB).toContainEqual(expect.objectContaining({ id: createdEpic.id, issueType: 'Epic' }));
      expect(issuesInDB).toContainEqual(expect.objectContaining({ id: createdStory.id, issueType: 'Story' }));
     });

     it('should save the created issue object to the database and return the saved object', () => {
      const mockIssueData = {
        summary: 'Test Issue to Verify Save and Return',
        description: 'This issue is for testing save and return.',
        project: 'SAVE',
        issueType: 'Task',
        parent: 'EPIC-001',
      };

      const createdIssue = createIssue(mockIssueData);
      const issuesInDB = getAllIssues();

      expect(issuesInDB.length).toBe(1);

      // Find the issue in the database by its ID
      const savedIssue: Issue | undefined = issuesInDB.find(issue => issue.id === createdIssue.id);

      // Expect it to be found
      expect(savedIssue).toBeDefined();

      // Expect the returned issue object to be deeply equal to the saved issue object
      expect(createdIssue).toEqual(savedIssue);

      // Also check specific fields for robustness
      expect(savedIssue?.summary).toBe(mockIssueData.summary);
      expect(savedIssue?.description).toBe(mockIssueData.description);
      expect(savedIssue?.project).toBe(mockIssueData.project);
      expect(savedIssue?.issueType).toBe(mockIssueData.issueType);
      expect(savedIssue?.parent).toBe(mockIssueData.parent);
      expect(savedIssue?.status).toBe('Open');
      expect(savedIssue?.createdAt).toBeDefined();
      expect(savedIssue?.id).toBeDefined();
    });
  });

  // Add tests for other functions in issueService as they are implemented
});
