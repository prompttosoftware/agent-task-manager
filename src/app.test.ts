import {
  BaseIssue,
  Task,
  Story,
  Epic,
  Bug,
  Subtask,
  AnyIssue,
  DbSchema as IssueDbSchema, // Rename to avoid conflict with db.ts DbSchema
} from './models/issue';
import {
  loadDatabase,
  saveDatabase,
  DbSchema as DbSchemaFromDb, // Import DbSchema from db.ts
  Issue as IssueFromDb, // Import Issue from db.ts
} from '../db/db'; // Import functions from db.ts
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

// Mock the fs/promises and path modules
jest.mock('fs/promises');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

const MOCK_DB_FILE_PATH = "/usr/src/agent-task-manager/.data/db.json";
const MOCK_DB_DIR_PATH = "/usr/src/agent-task-manager/.data";

/**
 * Basic helper function to check if a string is in a plausible ISO 8601 format.
 * This is not a comprehensive validator but checks for expected structure.
 * @param str The string to check.
 * @returns True if the string appears to be in ISO 8601 format, false otherwise.
 */
const isISO8601 = (str: string): boolean => {
  if (typeof str !== 'string') {
    return false;
  }
  // Regex for basic ISO 8601 check (YYYY-MM-DDTHH:mm:ss.sssZ or offset)
  // This regex covers common variants including time and timezone offset/Z.
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
  if (isoRegex.test(str)) {
      try {
        // Attempt to parse the date string to check for validity (e.g., '2023-02-30' is invalid)
        const date = new Date(str);
        // Check if date is valid (getTime() returns NaN for invalid dates)
        return !isNaN(date.getTime());
      } catch (error) {
        return false;
      }
  }
  return false;
};

describe('Issue Models', () => {

  // Test BaseIssue Interface
  describe('BaseIssue Interface', () => {
    const baseIssueExample: BaseIssue = {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      key: 'PROJ-123',
      issueType: 'Task', // Any valid issue type
      summary: 'This is a summary',
      description: 'This is a detailed description.',
      status: 'Todo', // Any valid status
      createdAt: '2023-10-27T10:00:00.000Z',
      updatedAt: '2023-10-27T10:05:00.000Z',
    };

    it('should have all required fields with correct string types', () => {
      expect(baseIssueExample).toHaveProperty('id');
      expect(typeof baseIssueExample.id).toBe('string');

      expect(baseIssueExample).toHaveProperty('key');
      expect(typeof baseIssueExample.key).toBe('string');

      expect(baseIssueExample).toHaveProperty('issueType');
      expect(typeof baseIssueExample.issueType).toBe('string');

      expect(baseIssueExample).toHaveProperty('summary');
      expect(typeof baseIssueExample.summary).toBe('string');

      expect(baseIssueExample).toHaveProperty('status');
      expect(typeof baseIssueExample.status).toBe('string');

      expect(baseIssueExample).toHaveProperty('createdAt');
      expect(typeof baseIssueExample.createdAt).toBe('string');

      expect(baseIssueExample).toHaveProperty('updatedAt');
      expect(typeof baseIssueExample.updatedAt).toBe('string');
    });

    it('should allow description to be an optional string or undefined', () => {
      expect(baseIssueExample).toHaveProperty('description');
      expect(typeof baseIssueExample.description).toBe('string');

      const baseIssueWithoutDescription: BaseIssue = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        key: 'PROJ-124',
        issueType: 'Bug',
        summary: 'Bug summary',
        status: 'In Progress',
        createdAt: '2023-10-27T11:00:00.000Z',
        updatedAt: '2023-10-27T11:05:00.000Z',
        // description is intentionally missing
      };
      expect(baseIssueWithoutDescription.description).toBeUndefined();
      expect(baseIssueWithoutDescription).not.toHaveProperty('description', undefined); // Jest's toHaveProperty checks for existence *and* value, testing undefined is tricky. toBeUndefined is better here.
    });
  });

  // Test Specific Issue Types (Task, Story, Epic, Bug, Subtask)
  describe('Specific Issue Types', () => {
    // Create example instances for each type
    const taskExample: Task = {
      id: 'task-f1', key: 'TASK-1', issueType: 'Task', summary: 'Task summary', status: 'Todo', createdAt: '2023-10-28T10:00:00.000Z', updatedAt: '2023-10-28T10:00:00.000Z'
    };
    const storyExample: Story = {
      id: 'story-f1', key: 'STORY-1', issueType: 'Story', summary: 'Story summary', status: 'In Progress', createdAt: '2023-10-28T11:00:00.000Z', updatedAt: '2023-10-28T11:00:00.000Z'
    };
    const bugExample: Bug = {
      id: 'bug-f1', key: 'BUG-1', issueType: 'Bug', summary: 'Bug summary', status: 'Done', createdAt: '2023-10-28T12:00:00.000Z', updatedAt: '2023-10-28T12:05:00.000Z'
    };
    const epicExample: Epic = {
      id: 'epic-f1', key: 'EPIC-1', issueType: 'Epic', summary: 'Epic summary', status: 'In Progress', createdAt: '2023-10-28T13:00:00.000Z', updatedAt: '2023-10-28T13:10:00.000Z',
      childIssueKeys: ['TASK-1', 'BUG-1', 'STORY-1']
    };
    const subtaskExample: Subtask = {
      id: 'subtask-f1', key: 'SUB-1', issueType: 'Subtask', summary: 'Subtask summary', status: 'Todo', createdAt: '2023-10-28T14:00:00.000Z', updatedAt: '2023-10-28T14:00:00.000Z',
      parentIssueKey: 'TASK-1'
    };

    it('Task, Story, and Bug should only have BaseIssue properties', () => {
      // In TypeScript, interfaces are structural. We check that they contain
      // the BaseIssue properties and the issueType is correct.
      const baseProps = ['id', 'key', 'issueType', 'summary', 'status', 'createdAt', 'updatedAt'];

      baseProps.forEach(prop => expect(taskExample).toHaveProperty(prop));
      expect(taskExample.issueType).toBe('Task');
      expect((taskExample as any).childIssueKeys).toBeUndefined(); // Ensure specific properties are NOT present
      expect((taskExample as any).parentIssueKey).toBeUndefined();

      baseProps.forEach(prop => expect(storyExample).toHaveProperty(prop));
      expect(storyExample.issueType).toBe('Story');
      expect((storyExample as any).childIssueKeys).toBeUndefined();
      expect((storyExample as any).parentIssueKey).toBeUndefined();

      baseProps.forEach(prop => expect(bugExample).toHaveProperty(prop));
      expect(bugExample.issueType).toBe('Bug');
      expect((bugExample as any).childIssueKeys).toBeUndefined();
      expect((bugExample as any).parentIssueKey).toBeUndefined();
    });

    it('Epic should extend BaseIssue and include childIssueKeys (string[])', () => {
      const baseProps = ['id', 'key', 'issueType', 'summary', 'status', 'createdAt', 'updatedAt'];
      baseProps.forEach(prop => expect(epicExample).toHaveProperty(prop));
      expect(epicExample.issueType).toBe('Epic');

      expect(epicExample).toHaveProperty('childIssueKeys');
      expect(Array.isArray(epicExample.childIssueKeys)).toBe(true);
      epicExample.childIssueKeys.forEach(key => {
        expect(typeof key).toBe('string');
      });
      expect((epicExample as any).parentIssueKey).toBeUndefined(); // Ensure Subtask specific property is NOT present
    });

    it('Subtask should extend BaseIssue and include parentIssueKey (string)', () => {
      const baseProps = ['id', 'key', 'issueType', 'summary', 'status', 'createdAt', 'updatedAt'];
      baseProps.forEach(prop => expect(subtaskExample).toHaveProperty(prop));
      expect(subtaskExample.issueType).toBe('Subtask');

      expect(subtaskExample).toHaveProperty('parentIssueKey');
      expect(typeof subtaskExample.parentIssueKey).toBe('string');
      expect((subtaskExample as any).childIssueKeys).toBeUndefined(); // Ensure Epic specific property is NOT present
    });
  });

  // Test AnyIssue Union Type
  describe('AnyIssue Union Type', () => {
     const taskExample: Task = { id: 'any-task-1', key: 'ANY-T1', issueType: 'Task', summary: 'Any Task', status: 'Todo', createdAt: '2023-10-29T10:00:00.000Z', updatedAt: '2023-10-29T10:00:00.000Z' };
    const storyExample: Story = { id: 'any-story-1', key: 'ANY-S1', issueType: 'Story', summary: 'Any Story', status: 'In Progress', createdAt: '2023-10-29T11:00:00.000Z', updatedAt: '2023-10-29T11:00:00.000Z' };
    const epicExample: Epic = { id: 'any-epic-1', key: 'ANY-E1', issueType: 'Epic', summary: 'Any Epic', status: 'Done', createdAt: '2023-10-29T12:00:00.000Z', updatedAt: '2023-10-29T12:00:00.000Z', childIssueKeys: ['ANY-T1', 'ANY-S1'] };
    const bugExample: Bug = { id: 'any-bug-1', key: 'ANY-B1', issueType: 'Bug', summary: 'Any Bug', status: 'Todo', createdAt: '2023-10-29T13:00:00.000Z', updatedAt: '2023-10-29T13:00:00.000Z' };
    const subtaskExample: Subtask = { id: 'any-subtask-1', key: 'ANY-SUB1', issueType: 'Subtask', summary: 'Any Subtask', status: 'In Progress', createdAt: '2023-10-29T14:00:00.000Z', updatedAt: '2023-10-29T14:00:00.000Z', parentIssueKey: 'ANY-T1' };

    it('should correctly accept instances of all specific issue types', () => {
      // This is primarily a compile-time type check.
      // At runtime, we verify that objects created with specific type structures
      // can be placed into an array typed as AnyIssue and retain their properties.
      const issues: AnyIssue[] = [
        taskExample,
        storyExample,
        epicExample,
        bugExample,
        subtaskExample,
      ];

      expect(issues.length).toBe(5);

      // Check basic properties that exist on BaseIssue
      expect(issues[0].key).toBe('ANY-T1');
      expect(issues[1].key).toBe('ANY-S1');
      expect(issues[2].key).toBe('ANY-E1');
      expect(issues[3].key).toBe('ANY-B1');
      expect(issues[4].key).toBe('ANY-SUB1');

      // Check type-specific properties using type assertion (runtime check)
      expect((issues[2] as Epic).childIssueKeys).toEqual(['ANY-T1', 'ANY-S1']);
      expect((issues[4] as Subtask).parentIssueKey).toBe('ANY-T1');
    });
  });

  // Test Data Validation (Runtime checks based on expected structure/values)
  describe('Data Validation (Runtime Checks)', () => {
    const validIssue: Epic = {
      id: 'valid-id-1',
      key: 'VALID-1',
      issueType: 'Epic',
      summary: 'A valid epic',
      description: 'This is a valid description.',
      status: 'Todo',
      createdAt: '2023-10-30T10:00:00.000Z',
      updatedAt: '2023-10-30T10:05:00.000Z',
      childIssueKeys: ['C-1', 'C-2']
    };

    it('should validate string types for key, summary, and description', () => {
      expect(typeof validIssue.key).toBe('string');
      expect(typeof validIssue.summary).toBe('string');
      if (validIssue.description !== undefined) {
         expect(typeof validIssue.description).toBe('string');
      }
    });

    it('should validate id is a string', () => {
      expect(typeof validIssue.id).toBe('string');
       // A more robust test might validate UUID format, but 'string' is required by the interface.
    });


    it('should validate issueType against allowed values', () => {
      const allowedIssueTypes = ['Task', 'Story', 'Epic', 'Bug', 'Subtask'];
      expect(allowedIssueTypes).toContain(validIssue.issueType);

      // Example of data that does NOT conform to the TypeScript type, but could exist at runtime
      const runtimeDataWithInvalidIssueType: any = {
         id: 'invalid-type-1', key: 'INV-TYPE', issueType: 'Feature', summary: 'Invalid type', status: 'Todo', createdAt: '2023-10-30T11:00:00.000Z', updatedAt: '2023-10-30T11:00:00.000Z'
      };
      expect(allowedIssueTypes).not.toContain(runtimeDataWithInvalidIssueType.issueType);
      // This demonstrates a runtime check you might perform if data comes from an external source.
      // TypeScript itself prevents this at compile time if assigned to `AnyIssue`.
      // const compileErrorExample: AnyIssue = runtimeDataWithInvalidIssueType; // This line would cause a TS error
    });

    it('should validate status against allowed values', () => {
      const allowedStatuses = ['Todo', 'In Progress', 'Done'];
      expect(allowedStatuses).toContain(validIssue.status);

       // Example of data that does NOT conform to the TypeScript type
      const runtimeDataWithInvalidStatus: any = {
         id: 'invalid-status-1', key: 'INV-STATUS', issueType: 'Task', summary: 'Invalid status', status: 'Closed', createdAt: '2023-10-30T12:00:00.000Z', updatedAt: '2023-10-30T12:00:00.000Z'
      };
      expect(allowedStatuses).not.toContain(runtimeDataWithInvalidStatus.status);
       // const compileErrorExample: AnyIssue = runtimeDataWithInvalidStatus; // This line would cause a TS error
    });

    it('should validate date fields are strings and in ISO 8601 format', () => {
      expect(typeof validIssue.createdAt).toBe('string');
      expect(typeof validIssue.updatedAt).toBe('string');

      expect(isISO8601(validIssue.createdAt)).toBe(true);
      expect(isISO8601(validIssue.updatedAt)).toBe(true);

      // Test invalid date formats
      const invalidDateIssue: any = {
         id: 'invalid-date-id', key: 'INVALID-DATE-1', issueType: 'Task', summary: 'Invalid date', status: 'Todo', createdAt: 'not a date string', updatedAt: '2023-10-30' // Not full ISO 8601
      };
      expect(isISO8601(invalidDateIssue.createdAt)).toBe(false);
      expect(isISO8601(invalidDateIssue.updatedAt)).toBe(false);

       const missingTimezoneIssue: any = {
         id: 'invalid-date-id-2', key: 'INVALID-DATE-2', issueType: 'Task', summary: 'Missing timezone', status: 'Todo', createdAt: '2023-11-01T10:00:00', updatedAt: '2023-11-01T10:00:00'
      };
       expect(isISO8601(missingTimezoneIssue.createdAt)).toBe(false);
       expect(isISO8601(missingTimezoneIssue.updatedAt)).toBe(false);
    });

    it('should validate Epic childIssueKeys is an array of strings', () => {
       const validEpic: Epic = {
        id: 'valid-epic-2', key: 'VALID-E2', issueType: 'Epic', summary: 'Valid Epic Children', status: 'Todo', createdAt: '2023-10-30T13:00:00.000Z', updatedAt: '2023-10-30T13:00:00.000Z',
        childIssueKeys: ['KEY-1', 'KEY-2', 'KEY-3']
      };
      expect(Array.isArray(validEpic.childIssueKeys)).toBe(true);
      validEpic.childIssueKeys.forEach(key => {
        expect(typeof key).toBe('string');
      });

      const epicWithInvalidChildren: any = {
         id: 'invalid-epic-children-1', key: 'INV-E-CHILD', issueType: 'Epic', summary: 'Invalid children', status: 'Todo', createdAt: '2023-10-30T14:00:00.000Z', updatedAt: '2023-10-30T14:00:00.000Z',
         childIssueKeys: ['KEY-A', 123, 'KEY-C'] // Contains a non-string
      };
       expect(Array.isArray(epicWithInvalidChildren.childIssueKeys)).toBe(true);
       // Runtime check for array elements
       expect(epicWithInvalidChildren.childIssueKeys.every((item: any) => typeof item === 'string')).toBe(false);
    });

     it('should validate Subtask parentIssueKey is a string', () => {
       const validSubtask: Subtask = {
        id: 'valid-subtask-2', key: 'VALID-S2', issueType: 'Subtask', summary: 'Valid Subtask Parent', status: 'Todo', createdAt: '2023-10-30T15:00:00.000Z', updatedAt: '2023-10-30T15:00:00.000Z',
        parentIssueKey: 'PARENT-ISSUE-KEY'
      };
      expect(typeof validSubtask.parentIssueKey).toBe('string');

       const subtaskWithInvalidParent: any = {
         id: 'invalid-subtask-parent-1', key: 'INV-S-PARENT', issueType: 'Subtask', summary: 'Invalid parent', status: 'Todo', createdAt: '2023-10-30T16:00:00.000Z', updatedAt: '2023-10-30T16:00:00.000Z',
         parentIssueKey: 123 // Not a string
       };
       expect(typeof subtaskWithInvalidParent.parentIssueKey).not.toBe('string');
     });
  });

  // Test Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty strings for key, summary, and description', () => {
       const issueWithEmptyStrings: Task = {
        id: 'edge-case-1',
        key: '', // Empty string key
        issueType: 'Task',
        summary: '', // Empty string summary
        description: '', // Empty string description
        status: 'Todo',
        createdAt: '2023-10-31T10:00:00.000Z',
        updatedAt: '2023-10-31T10:00:00.000Z',
      };
      expect(issueWithEmptyStrings.key).toBe('');
      expect(issueWithEmptyStrings.summary).toBe('');
      expect(issueWithEmptyStrings.description).toBe('');
    });

    it('should handle description being undefined (optional field)', () => {
      const issueWithoutDescription: Task = {
         id: 'edge-case-2', key: 'EDGE-2', issueType: 'Story', summary: 'No desc', status: 'Done', createdAt: '2023-10-31T11:00:00.000Z', updatedAt: '2023-10-31T11:00:00.000Z'
      };
      expect(issueWithoutDescription.description).toBeUndefined();
      expect(issueWithoutDescription).not.toHaveProperty('description', expect.anything()); // Ensure property is not defined
    });

    it('should handle empty childIssueKeys array for Epic', () => {
       const epicWithEmptyChildren: Epic = {
        id: 'edge-case-epic-1', key: 'EDGE-E1', issueType: 'Epic', summary: 'Epic with no children', status: 'Todo', createdAt: '2023-10-31T12:00:00.000Z', updatedAt: '2023-10-31T12:00:00.000Z',
        childIssueKeys: []
      };
      expect(Array.isArray(epicWithEmptyChildren.childIssueKeys)).toBe(true);
      expect(epicWithEmptyChildren.childIssueKeys.length).toBe(0);
    });

     it('should handle empty string for parentIssueKey for Subtask', () => {
        // The interface requires a string, but doesn't specify if it can be empty.
        // Based on typical usage, an empty parentIssueKey might imply an invalid state
        // for a subtask, but the *type* allows it. Testing that the type allows it.
       const subtaskWithEmptyParent: Subtask = {
        id: 'edge-case-subtask-1', key: 'EDGE-S1', issueType: 'Subtask', summary: 'Subtask with empty parent key', status: 'Todo', createdAt: '2023-10-31T13:00:00.000Z', updatedAt: '2023-10-31T13:00:00.000Z',
        parentIssueKey: '' // Empty string parent key
      };
      expect(typeof subtaskWithEmptyParent.parentIssueKey).toBe('string');
      expect(subtaskWithEmptyParent.parentIssueKey).toBe('');
    });

     // Note: Testing missing required fields (id, key, issueType, summary, status, createdAt, updatedAt)
     // is primarily a compile-time validation handled by TypeScript itself.
     // Creating an object literal assigned to the interface type without a required field
     // will result in a TypeScript compilation error before runtime tests execute.
     // Example (would cause TS error):
     // const missingKeyIssue: BaseIssue = { id: 'x', issueType: 'Task', summary: 's', status: 'Todo', createdAt: 'd', updatedAt: 'd' };
  });

  // Test DbSchema Interface
  describe('DbSchema Interface', () => {
     const mockIssues: AnyIssue[] = [
        { id: 'db-issue-1', key: 'DB-1', issueType: 'Task', summary: 'DB Task', status: 'Todo', createdAt: '2023-11-01T10:00:00.000Z', updatedAt: '2023-11-01T10:00:00.000Z' },
        { id: 'db-issue-2', key: 'DB-2', issueType: 'Epic', summary: 'DB Epic', status: 'In Progress', createdAt: '2023-11-01T10:05:00.000Z', updatedAt: '2023-11-01T10:05:00.000Z', childIssueKeys: ['DB-1'] },
        { id: 'db-issue-3', key: 'DB-3', issueType: 'Subtask', summary: 'DB Subtask', status: 'Done', createdAt: '2023-11-01T10:10:00.000Z', updatedAt: '2023-11-01T10:10:00.000Z', parentIssueKey: 'DB-1' }
     ];

     const mockDbSchema: DbSchema = {
      issues: mockIssues,
      issueKeyCounter: 3 // Corresponds to the number of issues + 1, or highest ID logic
    };

    it('should have an issues property which is an array of AnyIssue', () => {
      expect(mockDbSchema).toHaveProperty('issues');
      expect(Array.isArray(mockDbSchema.issues)).toBe(true);

      // Check if elements in the array conform to the AnyIssue structure
      expect(mockDbSchema.issues.length).toBe(3);
      // Verify some properties from different types within the array
      expect(mockDbSchema.issues[0].issueType).toBe('Task');
      expect(mockDbSchema.issues[1].issueType).toBe('Epic');
      expect((mockDbSchema.issues[1] as Epic).childIssueKeys).toEqual(['DB-1']); // Access specific property via assertion
      expect(mockDbSchema.issues[2].issueType).toBe('Subtask');
      expect((mockDbSchema.issues[2] as Subtask).parentIssueKey).toBe('DB-1'); // Access specific property via assertion
    });

    it('should have an issueKeyCounter property which is a number', () => {
      expect(mockDbSchema).toHaveProperty('issueKeyCounter');
      expect(typeof mockDbSchema.issueKeyCounter).toBe('number');
    });

    it('should handle an empty issues array in the schema', () => {
      const emptyDbSchema: DbSchema = {
        issues: [],
        issueKeyCounter: 0
      };
      expect(Array.isArray(emptyDbSchema.issues)).toBe(true);
      expect(emptyDbSchema.issues.length).toBe(0);
      expect(typeof emptyDbSchema.issueKeyCounter).toBe('number');
      expect(emptyDbSchema.issueKeyCounter).toBe(0);
    });
  });
});


// Start of Database Operations tests
describe('Database Operations (db.ts)', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
        // Configure path.dirname mock
        mockPath.dirname.mockReturnValue(MOCK_DB_DIR_PATH);
    });

    // --- loadDatabase Tests ---
    describe('loadDatabase', () => {
        const validDbContent: DbSchemaFromDb = {
            issues: [
                { key: 'TEST-1', summary: 'Test Issue 1', description: 'Desc 1', status: 'open' },
                { key: 'TEST-2', summary: 'Test Issue 2', description: 'Desc 2', status: 'closed' },
            ],
            issueKeyCounter: 2,
        };
        const validJsonString = JSON.stringify(validDbContent, null, 2);

        it('should load database successfully if file exists and is valid JSON', async () => {
            mockFs.readFile.mockResolvedValue(validJsonString);

            const db = await loadDatabase();

            expect(mockFs.readFile).toHaveBeenCalledWith(MOCK_DB_FILE_PATH, 'utf-8');
            // Use the DbSchema type from db.ts for comparison
            expect(db).toEqual(validDbContent);
        });

        it('should initialize database if file does not exist (ENOENT)', async () => {
            const error = new Error("ENOENT: no such file or directory");
            (error as any).code = 'ENOENT'; // Simulate ENOENT error
            mockFs.readFile.mockRejectedValue(error);
            mockFs.mkdir.mockResolvedValue(undefined); // Mock successful directory creation
            mockFs.writeFile.mockResolvedValue(undefined); // Mock successful file writing

            const db = await loadDatabase();

            expect(mockFs.readFile).toHaveBeenCalledWith(MOCK_DB_FILE_PATH, 'utf-8');
            expect(mockPath.dirname).toHaveBeenCalledWith(MOCK_DB_FILE_PATH);
            expect(mockFs.mkdir).toHaveBeenCalledWith(MOCK_DB_DIR_PATH, { recursive: true });
            expect(mockFs.writeFile).toHaveBeenCalledWith(
                MOCK_DB_FILE_PATH,
                JSON.stringify({ issues: [], issueKeyCounter: 0 }, null, 2),
                'utf-8'
            );
            // Should return an empty schema as defined in initializeDatabase
            expect(db).toEqual({ issues: [], issueKeyCounter: 0 });
        });

        it('should initialize database if file contains invalid JSON (SyntaxError)', async () => {
            mockFs.readFile.mockResolvedValue('{"issues": [... invalid json'); // Invalid JSON
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.writeFile.mockResolvedValue(undefined);

            // Suppress console.error for this test
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const db = await loadDatabase();

            expect(mockFs.readFile).toHaveBeenCalledWith(MOCK_DB_FILE_PATH, 'utf-8');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error parsing JSON in db.json"), expect.any(SyntaxError));
            expect(mockPath.dirname).toHaveBeenCalledWith(MOCK_DB_FILE_PATH);
            expect(mockFs.mkdir).toHaveBeenCalledWith(MOCK_DB_DIR_PATH, { recursive: true });
             expect(mockFs.writeFile).toHaveBeenCalledWith(
                MOCK_DB_FILE_PATH,
                JSON.stringify({ issues: [], issueKeyCounter: 0 }, null, 2),
                'utf-8'
            );
            // Should return an empty schema as defined in initializeDatabase
            expect(db).toEqual({ issues: [], issueKeyCounter: 0 });

            consoleErrorSpy.mockRestore(); // Restore console.error
        });

        it('should re-throw other errors during file reading', async () => {
            const error = new Error("Permission denied");
            (error as any).code = 'EACCES'; // Simulate a different error
            mockFs.readFile.mockRejectedValue(error);

            await expect(loadDatabase()).rejects.toThrow("Permission denied");
            expect(mockFs.readFile).toHaveBeenCalledWith(MOCK_DB_FILE_PATH, 'utf-8');
            // Ensure initializeDatabase was NOT called
            expect(mockFs.mkdir).not.toHaveBeenCalled();
            expect(mockFs.writeFile).not.toHaveBeenCalled();
        });

        // Test initialization errors
        it('should re-throw errors during directory creation when initializing', async () => {
            const readFileError = new Error("ENOENT");
            (readFileError as any).code = 'ENOENT';
            mockFs.readFile.mockRejectedValue(readFileError);

            const mkdirError = new Error("mkdir failed");
            mockFs.mkdir.mockRejectedValue(mkdirError);

            await expect(loadDatabase()).rejects.toThrow("mkdir failed");
            expect(mockFs.readFile).toHaveBeenCalled();
            expect(mockFs.mkdir).toHaveBeenCalled();
            expect(mockFs.writeFile).not.toHaveBeenCalled(); // Write should not be called
        });

         it('should re-throw errors during file writing when initializing', async () => {
            const readFileError = new Error("ENOENT");
            (readFileError as any).code = 'ENOENT';
            mockFs.readFile.mockRejectedValue(readFileError);

            mockFs.mkdir.mockResolvedValue(undefined);

            const writeFileError = new Error("write failed");
            mockFs.writeFile.mockRejectedValue(writeFileError);


            await expect(loadDatabase()).rejects.toThrow("write failed");
            expect(mockFs.readFile).toHaveBeenCalled();
            expect(mockFs.mkdir).toHaveBeenCalled();
            expect(mockFs.writeFile).toHaveBeenCalled();
        });
    });

    // --- saveDatabase Tests ---
    describe('saveDatabase', () => {
        it('should save the database object to the file system as JSON', async () => {
             const dbToSave: DbSchemaFromDb = {
                issues: [
                    { key: 'SAVE-1', summary: 'Save Test', description: 'Save desc', status: 'in progress' },
                ],
                issueKeyCounter: 1,
            };
            const expectedJsonString = JSON.stringify(dbToSave, null, 2);

            mockFs.writeFile.mockResolvedValue(undefined); // Mock successful write

            await saveDatabase(dbToSave);

            expect(mockFs.writeFile).toHaveBeenCalledWith(MOCK_DB_FILE_PATH, expectedJsonString, 'utf-8');
        });

         it('should handle and re-throw errors during file writing', async () => {
            const dbToSave: DbSchemaFromDb = { issues: [], issueKeyCounter: 0 };
            const writeError = new Error("Disk full");
            (writeError as any).code = 'ENOSPC'; // Simulate a write error

            mockFs.writeFile.mockRejectedValue(writeError);

            await expect(saveDatabase(dbToSave)).rejects.toThrow("Disk full");
            expect(mockFs.writeFile).toHaveBeenCalled();
        });
    });
});
