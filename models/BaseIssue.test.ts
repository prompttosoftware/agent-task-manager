import {
  BaseIssue,
  Task,
  Story,
  Epic,
  Bug,
  Subtask,
  AnyIssue,
  DbSchema,
  EpicSpecifics,
  SubtaskSpecifics,
  IssueType,
} from './BaseIssue'; // Import types from the source file

// Define common properties for example data used across different issue types.
// Using 'as const' helps TypeScript infer literal types for strings.
const commonIssueProps = {
  id: 'test-id-common',
  key: 'KEY-1',
  summary: 'Common Issue Title',
  status: 'Todo' as const, // Assuming 'Todo', 'In Progress', 'Done' are possible statuses
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // Add other common properties from BaseIssue if they exist (e.g., description, assigneeId)
  // description: 'This is a test issue description.',
  // assigneeId: 'user-assigned',
  // reporterId: 'user-reporter',
};

describe('Issue Type Interfaces and Types', () => {

  // --- Test Individual Issue Type Interfaces ---
  describe('Individual Issue Type Interfaces', () => {

    // Test Task Interface properties and issueType
    test('Task interface conforms to structure and has correct issueType', () => {
      // Create an object literal that should conform to the Task interface.
      // Assigning it to a variable typed as 'Task' leverages TypeScript's compile-time checks.
      const task: Task = {
        ...commonIssueProps, // Include base properties
        id: 'task-123', // Specific ID for this example
        key: 'TASK-123',
        issueType: "Task", // Must match the specific type
        summary: 'Implement user login feature', // Specific title
        // Add task-specific properties here if they exist in Task interface
        // e.g., storyPoints: 5,
      };

      // Runtime check: Verify the 'issueType' property's value is correct
      expect(task.issueType).toBe("Task");

      // Runtime check: Verify presence and basic type/value of inherited base properties
      expect(task).toHaveProperty('id', 'task-123');
      expect(task).toHaveProperty('key', 'TASK-123');
      expect(task).toHaveProperty('summary', 'Implement user login feature');
      expect(task).toHaveProperty('status', 'Todo');
      expect(task.createdAt).toBeInstanceOf(String);
      expect(task.updatedAt).toBeInstanceOf(String);

      // If the code compiles without TypeScript errors for the 'task' variable assignment,
      // it implicitly confirms that the object literal conforms to the Task interface structure.
    });

    // Test Story Interface properties and issueType
    test('Story interface conforms to structure and has correct issueType', () => {
      const story: Story = {
        ...commonIssueProps,
        id: 'story-456',
        key: 'STORY-456',
        issueType: "Story",
        summary: 'As a user, I want to view my profile',
        // Add story-specific properties
      };

      expect(story.issueType).toBe("Story");
      expect(story.id).toBe('story-456');
      expect(story.key).toBe('STORY-456');
      expect(story.summary).toBe('As a user, I want to view my profile');
    });

    // Test Epic Interface properties and issueType
    test('Epic interface conforms to structure and has correct issueType', () => {
      const epic: Epic = {
        ...commonIssueProps,
        id: 'epic-789',
        key: 'EPIC-789',
        issueType: "Epic",
        summary: 'Authentication System Revamp',
        childIssueKeys: ['TASK-1', 'TASK-2'],
        // Add epic-specific properties
      };

      expect(epic.issueType).toBe("Epic");
      expect(epic.id).toBe('epic-789');
      expect(epic.key).toBe('EPIC-789');
      expect(epic.summary).toBe('Authentication System Revamp');
      expect(epic).toHaveProperty('childIssueKeys');
      expect(epic.childIssueKeys).toEqual(['TASK-1', 'TASK-2']);
    });

    // Test Bug Interface properties and issueType
    test('Bug interface conforms to structure and has correct issueType', () => {
      const bug: Bug = {
        ...commonIssueProps,
        id: 'bug-101',
        key: 'BUG-101',
        issueType: "Bug",
        summary: 'Password reset link is broken',
        // Add other bug-specific properties
      };

      expect(bug.issueType).toBe("Bug");
      expect(bug.id).toBe('bug-101');
      expect(bug.key).toBe('BUG-101');
      expect(bug.summary).toBe('Password reset link is broken');
    });

    // Test Subtask Interface properties and issueType
    test('Subtask interface conforms to structure and has correct issueType', () => {
      const subtask: Subtask = {
        ...commonIssueProps,
        id: 'subtask-112',
        key: 'SUBTASK-112',
        issueType: "Subtask",
        summary: 'Write unit tests for password reset component',
        parentIssueKey: 'TASK-123', // Assuming Subtask has a 'parentIssueId' property
        // Add other subtask-specific properties
      };

      expect(subtask.issueType).toBe("Subtask");
      expect(subtask.id).toBe('subtask-112');
      expect(subtask.key).toBe('SUBTASK-112');
      expect(subtask.summary).toBe('Write unit tests for password reset component');
      expect(subtask.parentIssueKey).toBe('TASK-123'); // Check specific property
    });
  });

  // --- Test AnyIssue Union Type ---
  describe('AnyIssue Union Type', () => {

    test('AnyIssue correctly includes all specific issue types', () => {
      // Create example objects for each specific issue type.
      const taskExample: Task = { ...commonIssueProps, id: 'any-task', key: 'ANY-TASK', issueType: "Task", summary: 'Task Summary' };
      const storyExample: Story = { ...commonIssueProps, id: 'any-story', key: 'ANY-STORY', issueType: "Story", summary: 'Story Summary' };
      const epicExample: Epic = { ...commonIssueProps, id: 'any-epic', key: 'ANY-EPIC', issueType: "Epic", summary: 'Epic Summary', childIssueKeys: [] };
      const bugExample: Bug = { ...commonIssueProps, id: 'any-bug', key: 'ANY-BUG', issueType: "Bug", summary: 'Bug Summary' };
      const subtaskExample: Subtask = { ...commonIssueProps, id: 'any-subtask', key: 'ANY-SUBTASK', issueType: "Subtask", summary: 'Subtask Summary', parentIssueKey: 'any-task' };

      // Assigning instances of each specific type to a variable declared as AnyIssue.
      // If this compiles, it means AnyIssue includes all these types.
      const issueOne: AnyIssue = taskExample;
      const issueTwo: AnyIssue = storyExample;
      const issueThree: AnyIssue = epicExample;
      const issueFour: AnyIssue = bugExample;
      const issueFive: AnyIssue = subtaskExample;

      // Placing instances of all specific types into an array typed as AnyIssue[].
      // This is another crucial compile-time check for the union's correctness.
      const issuesCollection: AnyIssue[] = [
        issueOne,
        issueTwo,
        issueThree,
        issueFour,
        issueFive,
      ];

      // Runtime check: Verify that the array contains elements and their runtime types
      // (via the issueType discriminant) match the expected types.
      expect(issuesCollection.length).toBe(5);
      const issueTypesFound = issuesCollection.map(issue => issue.issueType);
      expect(issueTypesFound).toEqual(
        expect.arrayContaining([
          "Task",
          "Story",
          "Epic",
          "Bug",
          "Subtask",
        ])
      );
    });
  });

  // --- Test DbSchema Interface ---
  describe('DbSchema Interface', () => {

    test('DbSchema interface is correctly defined with an array of AnyIssue', () => {
      // Create some example issues of different types that would typically be stored.
      const issueA: Task = { ...commonIssueProps, id: 'db-issue-A', key: 'DB-ISSUE-A', issueType: "Task", summary: 'Task Summary' };
      const issueB: Bug = { ...commonIssueProps, id: 'db-issue-B', key: 'DB-ISSUE-B', issueType: "Bug", summary: 'Bug Summary' };
      const issueC: Story = { ...commonIssueProps, id: 'db-issue-C', key: 'DB-ISSUE-C', issueType: "Story", summary: 'Story Summary' };

      // Create an object literal that conforms to the DbSchema interface.
      // Assigning this object to a variable typed as 'DbSchema' performs the compile-time check.
      const databaseSchema: DbSchema = {
        issues: [issueA, issueB, issueC], // The 'issues' property must be an array of AnyIssue
        lastUpdated: new Date().toISOString(), // Assuming DbSchema has other properties like lastUpdated
        // Add other potential properties of DbSchema here if defined in BaseIssue.ts
        // e.g., users: [], projects: [], version: 1.0
      };

      // Runtime checks: Verify the structure and content type of DbSchema properties.
      expect(databaseSchema).toHaveProperty('issues');
      expect(Array.isArray(databaseSchema.issues)).toBe(true);
      expect(databaseSchema.issues.length).toBe(3);

      // Verify that elements within the 'issues' array conform to types included in AnyIssue
      // by checking their 'issueType' property.
      const typesInDb = databaseSchema.issues.map(issue => issue.issueType);
      expect(typesInDb).toEqual(expect.arrayContaining([
        "Task",
        "Bug",
        "Story",
      ]));

      // Check other properties defined in DbSchema
      expect(databaseSchema).toHaveProperty('lastUpdated');
      expect(databaseSchema.lastUpdated).toBeInstanceOf(String);

      // If the code compiles without TypeScript errors for the 'databaseSchema' variable assignment,
      // it confirms that the object literal conforms to the DbSchema interface,
      // specifically verifying that the 'issues' property accepts an array of AnyIssue.
    });
  });
});
