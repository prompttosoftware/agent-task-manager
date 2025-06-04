import { BaseIssue, Task, Story, Epic, Bug, Subtask, AnyIssue, DbSchema } from './models';

describe('Issue Tracking Data Models', () => {

  // Internal helper to generate base properties object (no type annotation needed, let TS infer)
  // Excludes issueType initially to allow specific functions to set the literal type last
  const generateBaseIssueProps = () => ({
    id: 'issue-' + Math.random().toString(36).substr(2, 9), // Simple mock ID
    key: 'PROJ-' + Math.floor(Math.random() * 1000), // Simple mock key
    summary: 'Example summary',
    description: 'Example description',
    status: 'Todo' as const, // Default status
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Helper function to create a valid BaseIssue instance (returns BaseIssue)
  // Use generateBaseIssueProps and add a default issueType - NOTE: issueType removed as requested, will cause type error if overrides don't provide it
  const createMockBaseIssue = (overrides?: Partial<BaseIssue>): BaseIssue => ({
    ...generateBaseIssueProps(),
    issueType: 'Task', // Add a default issueType from the union
    ...overrides,
  });

  // Helper function to create specific issue types
  // Construct the specific type object directly
  const createMockTask = (overrides?: Partial<Task>): Task => {
    const base = generateBaseIssueProps();
    // Build Task object explicitly to ensure literal type inference
    const task: Task = {
      id: base.id,
      key: base.key,
      summary: base.summary,
      description: base.description,
      status: base.status,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      issueType: 'Task', // Explicit literal type
    };
    return {
      ...task,
      ...overrides,
    };
  };

  const createMockStory = (overrides?: Partial<Story>): Story => {
    const base = generateBaseIssueProps();
    // Build Story object explicitly to ensure literal type inference
    const story: Story = {
      id: base.id,
      key: base.key,
      summary: base.summary,
      description: base.description,
      status: base.status,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      issueType: 'Story', // Explicit literal type
    };
    return {
      ...story,
      ...overrides,
    };
  };

  const createMockEpic = (overrides?: Partial<Epic>): Epic => {
    const base = generateBaseIssueProps();
    // Build Epic object explicitly to ensure literal type inference and specific properties
    const epic: Epic = {
      id: base.id,
      key: base.key,
      summary: base.summary,
      description: base.description,
      status: base.status,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      issueType: 'Epic', // Explicit literal type
      childIssueKeys: [], // Epic-specific default
    };
    return {
      ...epic,
      ...overrides,
    };
  };

  const createMockBug = (overrides?: Partial<Bug>): Bug => {
    const base = generateBaseIssueProps();
    // Build Bug object explicitly to ensure literal type inference
    const bug: Bug = {
      id: base.id,
      key: base.key,
      summary: base.summary,
      description: base.description,
      status: base.status,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      issueType: 'Bug', // Explicit literal type
    };
    return {
      ...bug,
      ...overrides,
    };
  };

  const createMockSubtask = (overrides?: Partial<Subtask>): Subtask => {
    const base = generateBaseIssueProps();
    // Build Subtask object explicitly to ensure literal type inference and specific properties
    const subtask: Subtask = {
      id: base.id,
      key: base.key,
      summary: base.summary,
      description: base.description,
      status: base.status,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      issueType: 'Subtask', // Explicit literal type
      parentIssueKey: 'PROJ-EPIC-DEFAULT', // Subtask-specific default
    };
    return {
      ...subtask,
      ...overrides,
    };
  };

  // Helper function to create a valid DbSchema instance
  const createMockDbSchema = (overrides?: Partial<DbSchema>): DbSchema => ({
    issues: [
      createMockTask({ key: 'PROJ-1', id: 'id-1' }),
      createMockEpic({ key: 'PROJ-2', id: 'id-2', childIssueKeys: ['PROJ-3'] }),
      createMockSubtask({ key: 'PROJ-3', id: 'id-3', parentIssueKey: 'PROJ-2' }),
      createMockBug({ key: 'PROJ-4', id: 'id-4', status: 'In Progress' }),
    ],
    issueKeyCounter: 4,
    ...overrides,
  });


  describe('BaseIssue Interface', () => {
    it('should define the BaseIssue structure with required properties', () => {
      const baseIssue: BaseIssue = createMockBaseIssue();

      expect(baseIssue).toBeDefined();
      expect(baseIssue).toHaveProperty('id');
      expect(baseIssue).toHaveProperty('key');
      expect(baseIssue).toHaveProperty('issueType');
      expect(baseIssue).toHaveProperty('summary');
      expect(baseIssue).toHaveProperty('status');
      expect(baseIssue).toHaveProperty('createdAt');
      expect(baseIssue).toHaveProperty('updatedAt');

      expect(typeof baseIssue.id).toBe('string');
      expect(typeof baseIssue.key).toBe('string');
      // Check union type for issueType
      const validIssueTypes: BaseIssue['issueType'][] = ["Task", "Story", "Epic", "Bug", "Subtask"];
      expect(validIssueTypes).toContain(baseIssue.issueType);
      expect(typeof baseIssue.summary).toBe('string');
      // Check union type for status
      const validStatuses: BaseIssue['status'][] = ["Todo", "In Progress", "Done"];
      expect(validStatuses).toContain(baseIssue.status);
      expect(typeof baseIssue.createdAt).toBe('string'); // Stored as ISO8601 string
      expect(typeof baseIssue.updatedAt).toBe('string'); // Stored as ISO8601 string
      // Optional description
      expect(baseIssue.description === undefined || typeof baseIssue.description === 'string').toBe(true);
    });
  });

  describe('Specific Issue Interfaces', () => {
    it('Task should inherit from BaseIssue and have correct type', () => {
      const task: Task = createMockTask();
      expect(task.issueType).toBe('Task');
      expect(task).toHaveProperty('id'); // Inherited
      expect(task).toHaveProperty('key'); // Inherited
      // Ensure it doesn't have specifics from other types
      expect(task).not.toHaveProperty('childIssueKeys');
      expect(task).not.toHaveProperty('parentIssueKey');
    });

    it('Story should inherit from BaseIssue and have correct type', () => {
      const story: Story = createMockStory();
      expect(story.issueType).toBe('Story');
      expect(story).toHaveProperty('id'); // Inherited
      expect(story).toHaveProperty('key'); // Inherited
      // Ensure it doesn't have specifics from other types
      expect(story).not.toHaveProperty('childIssueKeys');
      expect(story).not.toHaveProperty('parentIssueKey');
    });

    it('Bug should inherit from BaseIssue and have correct type', () => {
      const bug: Bug = createMockBug();
      expect(bug.issueType).toBe('Bug');
      expect(bug).toHaveProperty('id'); // Inherited
      expect(bug).toHaveProperty('key'); // Inherited
      // Ensure it doesn't have specifics from other types
      expect(bug).not.toHaveProperty('childIssueKeys');
      expect(bug).not.toHaveProperty('parentIssueKey');
    });

    it('Epic should inherit from BaseIssue, have correct type, and EpicSpecifics', () => {
      const epic: Epic = createMockEpic();
      expect(epic.issueType).toBe('Epic');
      expect(epic).toHaveProperty('id'); // Inherited
      expect(epic).toHaveProperty('key'); // Inherited
      expect(epic).toHaveProperty('childIssueKeys'); // EpicSpecifics
      expect(Array.isArray(epic.childIssueKeys)).toBe(true);
      // Ensure it doesn't have specifics from other types
      expect(epic).not.toHaveProperty('parentIssueKey');
    });

    it('Subtask should inherit from BaseIssue, have correct type, and SubtaskSpecifics', () => {
      const subtask: Subtask = createMockSubtask();
      expect(subtask.issueType).toBe('Subtask');
      expect(subtask).toHaveProperty('id'); // Inherited
      expect(subtask).toHaveProperty('key'); // Inherited
      expect(subtask).toHaveProperty('parentIssueKey'); // SubtaskSpecifics
      expect(typeof subtask.parentIssueKey).toBe('string');
      // Ensure it doesn't have specifics from other types
      expect(subtask).not.toHaveProperty('childIssueKeys');
    });
  });

  describe('AnyIssue Type', () => {
    it('should represent a union of all specific issue types', () => {
      const task: AnyIssue = createMockTask();
      const story: AnyIssue = createMockStory();
      const epic: AnyIssue = createMockEpic();
      const bug: AnyIssue = createMockBug();
      const subtask: AnyIssue = createMockSubtask();

      expect(task.issueType).toBe('Task');
      expect(story.issueType).toBe('Story');
      expect(epic.issueType).toBe('Epic');
      expect(bug.issueType).toBe('Bug');
      expect(subtask.issueType).toBe('Subtask');

      // Check properties common to AnyIssue (BaseIssue)
      expect(task).toHaveProperty('id');
      expect(story).toHaveProperty('id');
      expect(epic).toHaveProperty('id');
      expect(bug).toHaveProperty('id');
      expect(subtask).toHaveProperty('id');

      // Check properties specific to types are accessible if type-checked or cast (though we won't do extensive runtime type checking here)
      // We can check if an Epic instance *has* the epic-specific property at runtime.
      expect((epic as Epic).childIssueKeys).toBeDefined();
      expect((subtask as Subtask).parentIssueKey).toBeDefined();
    });
  });


  describe('DbSchema Interface', () => {
    it('should define the DbSchema structure with expected collections', () => {
      const dbSchema: DbSchema = createMockDbSchema();

      expect(dbSchema).toBeDefined();
      expect(dbSchema).toHaveProperty('issues');
      expect(dbSchema).toHaveProperty('issueKeyCounter');

      // Check if issues is an array
      expect(Array.isArray(dbSchema.issues)).toBe(true);
      expect(typeof dbSchema.issueKeyCounter).toBe('number');
      expect(dbSchema.issueKeyCounter).toBeGreaterThanOrEqual(0);


      // Check if elements within issues conform to expected types (runtime check based on structure)
      if (dbSchema.issues.length > 0) {
        const firstIssue = dbSchema.issues[0]; // This is an AnyIssue
        expect(firstIssue).toHaveProperty('id'); // BaseIssue property
        expect(firstIssue).toHaveProperty('key'); // BaseIssue property
        expect(firstIssue).toHaveProperty('issueType'); // BaseIssue property

        // Check a specific type within the array
        const epicIssue = dbSchema.issues.find(issue => issue.issueType === 'Epic');
        expect(epicIssue).toBeDefined();
        expect((epicIssue as Epic)?.childIssueKeys).toBeDefined(); // Check Epic-specific property

        const subtaskIssue = dbSchema.issues.find(issue => issue.issueType === 'Subtask');
        expect(subtaskIssue).toBeDefined();
        expect((subtaskIssue as Subtask)?.parentIssueKey).toBeDefined(); // Check Subtask-specific property
      }

    });

    it('should handle empty issues collection within DbSchema', () => {
        const dbSchema: DbSchema = createMockDbSchema({ issues: [] });

        expect(Array.isArray(dbSchema.issues)).toBe(true);
        expect(dbSchema.issues.length).toBe(0);
        expect(typeof dbSchema.issueKeyCounter).toBe('number');
      });
  });
});
