import {
  BaseIssue,
  Task,
  Story,
  Epic,
  Bug,
  Subtask,
  AnyIssue,
  IssueStatus,
  IssueType,
} from '../../models/BaseIssue';

describe('BaseIssue Model and Related Types', () => {

  // Helper function to create valid base data
  const createBaseIssueData = (type: IssueType, overrides?: Partial<BaseIssue>): BaseIssue => ({
    id: `test-${type.toLowerCase()}-id-123`,
    key: `TEST-${Math.floor(Math.random() * 1000)}`,
    issueType: type,
    summary: `Test ${type} summary`,
    status: 'Todo' as IssueStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  // 1. Test that each concrete issue type can be created with valid data and issueType is correct
  describe('Concrete Issue Types', () => {

    test('Task can be created and has correct issueType', () => {
      const taskData: Task = createBaseIssueData('Task');
      // Assigning to Task type ensures structural compatibility
      const task: Task = taskData;

      expect(task).toBeDefined();
      expect(task.issueType).toBe('Task');
      expect(task.id).toBe(taskData.id);
      expect(task.key).toBe(taskData.key);
      expect(task.summary).toBe(taskData.summary);
      expect(task.status).toBe(taskData.status);
      expect(task.createdAt).toBe(taskData.createdAt);
      expect(task.updatedAt).toBe(taskData.updatedAt);
      // Should not have Epic or Subtask specific properties
      expect((task as any).childIssueKeys).toBeUndefined();
      expect((task as any).parentIssueKey).toBeUndefined();
    });

    test('Story can be created and has correct issueType', () => {
      const storyData: Story = createBaseIssueData('Story');
      const story: Story = storyData;

      expect(story).toBeDefined();
      expect(story.issueType).toBe('Story');
      expect(story.id).toBe(storyData.id);
      // Should not have Epic or Subtask specific properties
      expect((story as any).childIssueKeys).toBeUndefined();
      expect((story as any).parentIssueKey).toBeUndefined();
    });

    test('Epic can be created, has correct issueType and EpicSpecifics', () => {
      const epicData: Epic = {
        ...createBaseIssueData('Epic'),
        childIssueKeys: ['CHILD-1', 'CHILD-2'],
      };
      const epic: Epic = epicData;

      expect(epic).toBeDefined();
      expect(epic.issueType).toBe('Epic');
      expect(epic.id).toBe(epicData.id);
      expect(epic.childIssueKeys).toEqual(['CHILD-1', 'CHILD-2']);
      // Should not have Subtask specific properties
      expect((epic as any).parentIssueKey).toBeUndefined();
    });

    test('Bug can be created and has correct issueType', () => {
      const bugData: Bug = createBaseIssueData('Bug');
      const bug: Bug = bugData;

      expect(bug).toBeDefined();
      expect(bug.issueType).toBe('Bug');
      expect(bug.id).toBe(bugData.id);
      // Should not have Epic or Subtask specific properties
      expect((bug as any).childIssueKeys).toBeUndefined();
      expect((bug as any).parentIssueKey).toBeUndefined();
    });

    test('Subtask can be created, has correct issueType and SubtaskSpecifics', () => {
      const subtaskData: Subtask = {
        ...createBaseIssueData('Subtask'),
        parentIssueKey: 'PARENT-123',
      };
      const subtask: Subtask = subtaskData;

      expect(subtask).toBeDefined();
      expect(subtask.issueType).toBe('Subtask');
      expect(subtask.id).toBe(subtaskData.id);
      expect(subtask.parentIssueKey).toBe('PARENT-123');
      // Should not have Epic specific properties
      expect((subtask as any).childIssueKeys).toBeUndefined();
    });
  });

  // 2. Test that the AnyIssue union type correctly accepts all concrete issue types
  describe('AnyIssue Union Type', () => {
    test('AnyIssue accepts all concrete issue types', () => {
      const task: Task = createBaseIssueData('Task');
      const story: Story = createBaseIssueData('Story');
      const epic: Epic = { ...createBaseIssueData('Epic'), childIssueKeys: [] };
      const bug: Bug = createBaseIssueData('Bug');
      const subtask: Subtask = { ...createBaseIssueData('Subtask'), parentIssueKey: 'PARENT-KEY' };

      // Assigning to AnyIssue type checks if the union accepts these types
      const anyTask: AnyIssue = task;
      const anyStory: AnyIssue = story;
      const anyEpic: AnyIssue = epic;
      const anyBug: AnyIssue = bug;
      const anySubtask: AnyIssue = subtask;

      // Simply asserting they are defined is sufficient to show they were accepted by the type
      expect(anyTask).toBeDefined();
      expect(anyStory).toBeDefined();
      expect(anyEpic).toBeDefined();
      expect(anyBug).toBeDefined();
      expect(anySubtask).toBeDefined();

      // Further checks could involve type guarding if needed for runtime logic, but the union type itself is verified by the assignment above.
    });
  });

  // 3. Test the optional properties (description)
  describe('Optional Properties', () => {
    test('Issue can be created with an optional description', () => {
      const issueWithDescription: BaseIssue = createBaseIssueData('Task', {
        description: 'This is a detailed description.',
      });

      expect(issueWithDescription.description).toBe('This is a detailed description.');
    });

    test('Issue can be created without an optional description', () => {
      const issueWithoutDescription: BaseIssue = createBaseIssueData('Story');

      // description should be undefined or not exist
      expect(issueWithoutDescription.description).toBeUndefined();
    });
  });

  // 4. Test that required fields are enforced
  // Note: Since these are TypeScript interfaces, enforcement is compile-time.
  // These tests demonstrate that objects with required fields conform to the type.
  // Runtime validation would require a library like Zod, which is not used here.
  describe('Required Fields Enforcement (Compile-time)', () => {
    test('Issue requires all base fields', () => {
      const validIssue: BaseIssue = {
        id: 'required-id',
        key: 'REQ-1',
        issueType: 'Task',
        summary: 'Required summary',
        status: 'Done',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // The fact that this object can be assigned to BaseIssue type
      // without TypeScript errors demonstrates that all required fields are present
      // and conform to the expected types.
      expect(validIssue).toBeDefined();
      expect(validIssue.id).toBe('required-id');
      expect(validIssue.key).toBe('REQ-1');
      expect(validIssue.issueType).toBe('Task');
      expect(validIssue.summary).toBe('Required summary');
      expect(validIssue.status).toBe('Done');
      expect(typeof validIssue.createdAt).toBe('string');
      expect(typeof validIssue.updatedAt).toBe('string');

      // If any required field were missing or had an incorrect type,
      // the TypeScript compiler would raise an error at build time.
      // Example (commented out because it's a compile-time error demonstration):
      /*
      // This would cause a TS error: Property 'summary' is missing in type...
      const invalidIssueMissingField: BaseIssue = {
        id: 'invalid-id',
        key: 'INV-1',
        issueType: 'Bug',
        status: 'Todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      */

      /*
      // This would cause a TS error: Type 'number' is not assignable to type 'string'.
      const invalidIssueIncorrectType: BaseIssue = {
        id: 123, // incorrect type
        key: 'INV-2',
        issueType: 'Story',
        summary: 'Incorrect type test',
        status: 'In Progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      */
    });

    test('Epic requires EpicSpecifics', () => {
      const validEpic: Epic = {
        ...createBaseIssueData('Epic'),
        childIssueKeys: ['C1', 'C2'], // Required for Epic
      };

      expect(validEpic).toBeDefined();
      expect(validEpic.issueType).toBe('Epic');
      expect(validEpic.childIssueKeys).toEqual(['C1', 'C2']);

      // Example of missing required specific field (compile-time error):
      /*
      // This would cause a TS error: Property 'childIssueKeys' is missing...
      const invalidEpicMissingSpecific: Epic = createBaseIssueData('Epic');
      */
    });

    test('Subtask requires SubtaskSpecifics', () => {
      const validSubtask: Subtask = {
        ...createBaseIssueData('Subtask'),
        parentIssueKey: 'PARENT-XYZ', // Required for Subtask
      };

      expect(validSubtask).toBeDefined();
      expect(validSubtask.issueType).toBe('Subtask');
      expect(validSubtask.parentIssueKey).toBe('PARENT-XYZ');

      // Example of missing required specific field (compile-time error):
      /*
      // This would cause a TS error: Property 'parentIssueKey' is missing...
      const invalidSubtaskMissingSpecific: Subtask = createBaseIssueData('Subtask');
      */
    });
  });
});
