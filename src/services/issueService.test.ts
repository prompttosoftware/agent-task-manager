import { IssueService } from './issueService';
import { AnyIssue, BaseIssue, Epic, Subtask } from '../models/BaseIssue';
import { dbState, saveDb } from '../db/db'; // Import the real db and saveDb
import * as uuid from 'uuid'; // Import the uuid module

// Mock the uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'), // Return a fixed UUID for predictable testing
}));

// Mock the saveDb function
jest.mock('../db/db', () => ({
  ...jest.requireActual('../db/db'), // Import and preserve the actual dbState
  saveDb: jest.fn(),
}));

describe('IssueService', () => {
  let issueService: IssueService;

  beforeEach(() => {
    // Reset the mock database state and counter before each test
    dbState.issues = [];
    dbState.issueKeyCounter = 0;
    // Clear mock calls before each test
    jest.clearAllMocks();

    issueService = new IssueService();
  });

  describe('createIssue', () => {
    it('1. should create an Epic issue with correct properties', async () => {
      const issueData = {
        issueTypeName: 'Epic' as BaseIssue['issueType'],
        summary: 'Implement user authentication',
        description: 'As a user, I want to log in...',
        childIssueKeys: ['ISSUE-2', 'ISSUE-3'], // Optional input
      };

      const createdIssue = await issueService.createIssue(issueData);

      // Get the current date/time to compare timestamps (allow for slight variation)
      const now = new Date();

      // Assert properties of the returned issue
      expect(createdIssue).toHaveProperty('id', 'mock-uuid');
      expect(createdIssue).toHaveProperty('key', 'ISSUE-1'); // Starts from 1 because counter is incremented
      expect(createdIssue).toHaveProperty('issueType', 'Epic');
      expect(createdIssue).toHaveProperty('summary', issueData.summary);
      expect(createdIssue).toHaveProperty('description', issueData.description);
      expect(createdIssue).toHaveProperty('status', 'Todo'); // Default status
      // Check if timestamps are recent (within a small window)
      expect(new Date(createdIssue.createdAt).getTime()).toBeLessThanOrEqual(now.getTime());
      expect(new Date(createdIssue.updatedAt).getTime()).toBeLessThanOrEqual(now.getTime());
      // Check Epic-specific properties
      expect((createdIssue as Epic).childIssueKeys).toEqual(issueData.childIssueKeys);

      // Assert that the issue was added to the mock database state
      expect(dbState.issues).toHaveLength(1);
      expect(dbState.issues[0]).toEqual(createdIssue); // Ensure the saved object is the same

      // Assert that the issue key counter was incremented
      expect(dbState.issueKeyCounter).toBe(1);

      // Assert that saveDb was called
      expect(saveDb).toHaveBeenCalledTimes(1);
      // Optionally, check if saveDb was called with the expected state
      expect(saveDb).toHaveBeenCalledWith(dbState);
    });

    it('2. should create a Subtask issue with correct properties including parentIssueKey', async () => {
      const issueData = {
        issueTypeName: 'Subtask' as BaseIssue['issueType'],
        summary: 'Create login form',
        description: 'Design and implement the HTML form.',
        parentIssueKey: 'ISSUE-100', // Required for Subtask
      };

      const createdIssue = await issueService.createIssue(issueData);
      const now = new Date();

      // Assert properties of the returned issue
      expect(createdIssue).toHaveProperty('id', 'mock-uuid');
      expect(createdIssue).toHaveProperty('key', 'ISSUE-1');
      expect(createdIssue).toHaveProperty('issueType', 'Subtask');
      expect(createdIssue).toHaveProperty('summary', issueData.summary);
      expect(createdIssue).toHaveProperty('description', issueData.description);
      expect(createdIssue).toHaveProperty('status', 'Todo');
      expect(new Date(createdIssue.createdAt).getTime()).toBeLessThanOrEqual(now.getTime());
      expect(new Date(createdIssue.updatedAt).getTime()).toBeLessThanOrEqual(now.getTime());
      // Check Subtask-specific properties
      expect((createdIssue as Subtask).parentIssueKey).toBe(issueData.parentIssueKey);

      // Assert that the issue was added to the mock database state
      expect(dbState.issues).toHaveLength(1);
      expect(dbState.issues[0]).toEqual(createdIssue);

      // Assert that the issue key counter was incremented
      expect(dbState.issueKeyCounter).toBe(1);

      // Assert that saveDb was called
      expect(saveDb).toHaveBeenCalledTimes(1);
      expect(saveDb).toHaveBeenCalledWith(dbState);
    });

    it('3. should create a Task issue with correct properties', async () => {
      const issueData = {
        issueTypeName: 'Task' as BaseIssue['issueType'],
        summary: 'Refactor database connection',
        description: 'Improve the data access layer.',
      };

      const createdIssue = await issueService.createIssue(issueData);
      const now = new Date();

      // Assert properties of the returned issue (base properties only)
      expect(createdIssue).toHaveProperty('id', 'mock-uuid');
      expect(createdIssue).toHaveProperty('key', 'ISSUE-1');
      expect(createdIssue).toHaveProperty('issueType', 'Task');
      expect(createdIssue).toHaveProperty('summary', issueData.summary);
      expect(createdIssue).toHaveProperty('description', issueData.description);
      expect(createdIssue).toHaveProperty('status', 'Todo');
      expect(new Date(createdIssue.createdAt).getTime()).toBeLessThanOrEqual(now.getTime());
      expect(new Date(createdIssue.updatedAt).getTime()).toBeLessThanOrEqual(now.getTime());
      // Ensure no type-specific properties were added unintentionally
      expect(createdIssue).not.toHaveProperty('childIssueKeys');
      expect(createdIssue).not.toHaveProperty('parentIssueKey');


      // Assert that the issue was added to the mock database state
      expect(dbState.issues).toHaveLength(1);
      expect(dbState.issues[0]).toEqual(createdIssue);

      // Assert that the issue key counter was incremented
      expect(dbState.issueKeyCounter).toBe(1);

      // Assert that saveDb was called
      expect(saveDb).toHaveBeenCalledTimes(1);
      expect(saveDb).toHaveBeenCalledWith(dbState);
    });


    it('4. should throw an error if issueTypeName is missing', async () => {
      const issueData = {
        // issueTypeName is missing
        summary: 'This should fail',
        description: 'Missing type',
      };

      // Expect the promise to be rejected with an error
      await expect(issueService.createIssue(issueData as any)).rejects.toThrow("Issue type and summary are required.");

      // Assert that no issue was added to the mock database state
      expect(dbState.issues).toHaveLength(0);

      // Assert that saveDb was NOT called
      expect(saveDb).not.toHaveBeenCalled();
    });

    it('5. should throw an error if summary is missing', async () => {
      const issueData = {
        issueTypeName: 'Task' as BaseIssue['issueType'],
        // summary is missing
        description: 'Missing summary',
      };

      // Expect the promise to be rejected with an error
      await expect(issueService.createIssue(issueData as any)).rejects.toThrow("Issue type and summary are required.");

      // Assert that no issue was added to the mock database state
      expect(dbState.issues).toHaveLength(0);

      // Assert that saveDb was NOT called
      expect(saveDb).not.toHaveBeenCalled();
    });

    it('6. should throw an error when creating a Subtask with a missing parentIssueKey', async () => {
      const issueData = {
        issueTypeName: 'Subtask' as BaseIssue['issueType'],
        summary: 'This subtask should fail',
        description: 'Missing parent key',
        // parentIssueKey is missing
      };

      // Expect the promise to be rejected with an error
      await expect(issueService.createIssue(issueData as any)).rejects.toThrow("Subtask issues require a parentIssueKey.");

      // Assert that no issue was added to the mock database state
      expect(dbState.issues).toHaveLength(0);

      // Assert that saveDb was NOT called
      expect(saveDb).not.toHaveBeenCalled();
    });

    it('7. should throw an error for an unknown issue type', async () => {
      const issueData = {
        issueTypeName: 'UnknownType' as any, // Using 'any' to simulate invalid input
        summary: 'Issue with unknown type',
      };

      await expect(issueService.createIssue(issueData)).rejects.toThrow("Unknown issue type: UnknownType");

      expect(dbState.issues).toHaveLength(0);
      expect(saveDb).not.toHaveBeenCalled();
    });

    it('8. should create an Epic with default empty childIssueKeys if not provided', async () => {
        const issueData = {
            issueTypeName: 'Epic' as BaseIssue['issueType'],
            summary: 'Epic without initial children',
            description: 'Testing default children array',
            // childIssueKeys is intentionally missing
          };

          const createdIssue = await issueService.createIssue(issueData);

          expect(createdIssue).toHaveProperty('issueType', 'Epic');
          expect((createdIssue as Epic).childIssueKeys).toEqual([]); // Should default to empty array

          expect(dbState.issues).toHaveLength(1);
          expect(dbState.issues[0]).toEqual(createdIssue);
          expect(saveDb).toHaveBeenCalledTimes(1);
    });

  });
});
