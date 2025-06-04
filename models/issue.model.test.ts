import {
  IssueStatus, // Corrected import: Assuming IssueStatus is a named export
  BaseIssue,
  Bug,
  Epic,
  Story,
  Subtask,
  Task,
  AnyIssue,
  DbSchema,
} from './issue.model'; // Assuming issue.model.ts is in the same directory

describe('Issue Models', () => {

  // Helper function to create common base issue properties
  const createBaseIssue = (id: string, title: string, description?: string) => ({
    id,
    key: `ISSUE-${id}`, // Example key
    issueType: 'Task', // Dummy value, will be overridden in specific tests
    summary: title,
    description,
    status: 'Todo' as IssueStatus, // Default status using enum
    createdAt: new Date('2023-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2023-01-01T10:00:00.000Z').toISOString(),
  });

  describe('Bug Interface', () => {
    const mockBug: Bug = {
      ...createBaseIssue('bug-123', 'App crashes on startup', 'Detailed description of the bug.'),
      issueType: 'Bug',
    };

    test('should conform to Bug structure and property types', () => {
      expect(mockBug).toBeDefined();
      expect(typeof mockBug.id).toBe('string');
      expect(typeof mockBug.key).toBe('string');
      expect(mockBug.issueType).toBe('Bug'); // Verify literal value
      expect(typeof mockBug.summary).toBe('string');
      expect(mockBug.description === undefined || typeof mockBug.description === 'string').toBe(true);
      expect(mockBug.status).toBe(IssueStatus.Todo);
      expect(typeof mockBug.createdAt).toBe('string');
      expect(typeof mockBug.updatedAt).toBe('string');
    });

    test('should handle optional description property', () => {
      const bugWithoutDescription: Bug = {
        ...createBaseIssue('bug-124', 'Another bug'),
        issueType: 'Bug',
      };
      expect(bugWithoutDescription.description).toBeUndefined();
    });
  });

  describe('Story Interface', () => {
    const mockStory: Story = {
      ...createBaseIssue('story-456', 'As a user, I want to...', 'Detailed story description'),
      issueType: 'Story',
      status: 'InProgress' as IssueStatus, // Change status here using enum
    };

    test('should conform to Story structure and property types', () => {
      expect(mockStory).toBeDefined();
      expect(typeof mockStory.id).toBe('string');
      expect(typeof mockStory.key).toBe('string');
      expect(mockStory.issueType).toBe('Story'); // Verify literal value
      expect(typeof mockStory.summary).toBe('string');
      expect(mockStory.description === undefined || typeof mockStory.description === 'string').toBe(true);
      expect(mockStory.status).toBe(IssueStatus.InProgress); // Update expectation
      expect(typeof mockStory.createdAt).toBe('string');
      expect(typeof mockStory.updatedAt).toBe('string');
    });

    test('should handle optional description property', () => {
      const storyWithoutDescription: Story = {
        ...createBaseIssue('story-457', 'Another story'),
        issueType: 'Story',
      };
      expect(storyWithoutDescription.description).toBeUndefined();
    });
  });

  describe('Task Interface', () => {
    const mockTask: Task = {
      ...createBaseIssue('task-789', 'Refactor authentication', 'Improve auth module.'),
      issueType: 'Task',
      status: 'Done' as IssueStatus, // Change status here using enum
    };

    test('should conform to Task structure and property types', () => {
      expect(mockTask).toBeDefined();
      expect(typeof mockTask.id).toBe('string');
      expect(typeof mockTask.key).toBe('string');
      expect(mockTask.issueType).toBe('Task'); // Verify literal value
      expect(typeof mockTask.summary).toBe('string');
      expect(mockTask.description === undefined || typeof mockTask.description === 'string').toBe(true);
      expect(mockTask.status).toBe(IssueStatus.Done); // Update expectation
      expect(typeof mockTask.createdAt).toBe('string');
      expect(typeof mockTask.updatedAt).toBe('string');
    });

    test('should handle optional description property', () => {
      const taskWithoutDescription: Task = {
        ...createBaseIssue('task-790', 'Write unit tests'),
        issueType: 'Task',
      };
      expect(taskWithoutDescription.description).toBeUndefined();
    });
  });

  describe('Epic Interface', () => {
    const mockEpic: Epic = {
      ...createBaseIssue('epic-111', 'Implement new design', 'Epic description'),
      issueType: 'Epic',
      childIssueKeys: ['ISSUE-task-1', 'ISSUE-story-1'],
    };

    test('should conform to Epic structure and property types', () => {
      expect(mockEpic).toBeDefined();
      expect(typeof mockEpic.id).toBe('string');
      expect(typeof mockEpic.key).toBe('string');
      expect(mockEpic.issueType).toBe('Epic');
      expect(typeof mockEpic.summary).toBe('string');
      expect(mockEpic.description === undefined || typeof mockEpic.description === 'string').toBe(true);
      expect(mockEpic.status).toBe(IssueStatus.Todo);
      expect(typeof mockEpic.createdAt).toBe('string');
      expect(typeof mockEpic.updatedAt).toBe('string');
      expect(Array.isArray(mockEpic.childIssueKeys)).toBe(true);
      expect(mockEpic.childIssueKeys.length).toBe(2);
      expect(typeof mockEpic.childIssueKeys[0]).toBe('string');
    });

     test('should handle optional description property', () => {
        const epicWithoutDescription: Epic = {
            ...createBaseIssue('epic-112', 'Another epic'),
            issueType: 'Epic',
            childIssueKeys: ['ISSUE-task-2'],
        };
        expect(epicWithoutDescription.description).toBeUndefined();
    });
  });

  describe('Subtask Interface', () => {
    const mockSubtask: Subtask = {
      ...createBaseIssue('subtask-222', 'Implement login', 'Subtask description'),
      issueType: 'Subtask',
      parentIssueKey: 'ISSUE-epic-1',
    };

    test('should conform to Subtask structure and property types', () => {
      expect(mockSubtask).toBeDefined();
      expect(typeof mockSubtask.id).toBe('string');
      expect(typeof mockSubtask.key).toBe('string');
      expect(mockSubtask.issueType).toBe('Subtask');
      expect(typeof mockSubtask.summary).toBe('string');
      expect(mockSubtask.description === undefined || typeof mockSubtask.description === 'string').toBe(true);
      expect(mockSubtask.status).toBe(IssueStatus.Todo);
      expect(typeof mockSubtask.createdAt).toBe('string');
      expect(typeof mockSubtask.updatedAt).toBe('string');
      expect(typeof mockSubtask.parentIssueKey).toBe('string');
    });

    test('should handle optional description property', () => {
      const subtaskWithoutDescription: Subtask = {
        ...createBaseIssue('subtask-223', 'Implement register'),
        issueType: 'Subtask',
        parentIssueKey: 'ISSUE-epic-1',
      };
      expect(subtaskWithoutDescription.description).toBeUndefined();
    });
  });

  describe('AnyIssue Union Type', () => {
    const mockBug: Bug = {
      ...createBaseIssue('bug-any-1', 'Bug for AnyIssue test'),
      issueType: 'Bug',
      status: 'Todo' as IssueStatus, // Explicitly set status using enum
    };

    const mockStory: Story = {
      ...createBaseIssue('story-any-2', 'Story for AnyIssue test'),
      issueType: 'Story',
      status: 'InProgress' as IssueStatus, // Explicitly set status using enum
    };

    const mockTask: Task = {
      ...createBaseIssue('task-any-3', 'Task for AnyIssue test'),
      issueType: 'Task',
      status: 'Done' as IssueStatus, // Explicitly set status using enum
    };

    const mockEpic: Epic = {
      ...createBaseIssue('epic-any-4', 'Epic for AnyIssue test'),
      issueType: 'Epic',
      status: 'Todo' as IssueStatus, // Explicitly set status using enum
      childIssueKeys: ['ISSUE-task-1', 'ISSUE-story-1'],
    };

    const mockSubtask: Subtask = {
      ...createBaseIssue('subtask-any-5', 'Subtask for AnyIssue test'),
      issueType: 'Subtask',
      status: 'InProgress' as IssueStatus, // Explicitly set status using enum
      parentIssueKey: 'ISSUE-epic-1',
    };

    test('should correctly combine all issue types', () => {
      const issue1: AnyIssue = mockBug;
      const issue2: AnyIssue = mockStory;
      const issue3: AnyIssue = mockTask;
      const issue4: AnyIssue = mockEpic;
      const issue5: AnyIssue = mockSubtask;


      expect(issue1).toBeDefined();
      expect(issue2).toBeDefined();
      expect(issue3).toBeDefined();
      expect(issue4).toBeDefined();
      expect(issue5).toBeDefined();

      // Verify common properties exist and have expected types
      expect(typeof issue1.id).toBe('string');
      expect(typeof issue2.key).toBe('string');
      expect(typeof issue3.summary).toBe('string');
      expect(typeof issue4.createdAt).toBe('string');
      expect(typeof issue5.updatedAt).toBe('string');
      expect(issue1.status).toBe(IssueStatus.Todo); // Corresponds to mockBug
      expect(issue2.status).toBe(IssueStatus.InProgress); // Corresponds to mockStory
      expect(issue3.status).toBe(IssueStatus.Done); // Corresponds to mockTask
      expect(issue4.status).toBe(IssueStatus.Todo); // Corresponds to mockEpic
      expect(issue5.status).toBe(IssueStatus.InProgress); // Corresponds to mockSubtask

      // Verify type-specific properties are accessible (though requires casting/guards in real code)
      expect((issue4 as Epic).childIssueKeys).toBeDefined();
      expect((issue5 as Subtask).parentIssueKey).toBeDefined();

    });

    test('should have the correct issueType literal values for different types within the union', () => {
      const issues: AnyIssue[] = [
        mockBug,
        mockStory,
        mockTask,
        mockEpic,
        mockSubtask,
      ];

      expect(issues.length).toBe(5);

      expect(issues[0].issueType).toBe('Bug');
      expect(issues[1].issueType).toBe('Story');
      expect(issues[2].issueType).toBe('Task');
      expect(issues[3].issueType).toBe('Epic');
      expect(issues[4].issueType).toBe('Subtask');
    });
  });

  describe('DbSchema Interface', () => {
    const mockDbSchema: DbSchema = {
      issues: [
        {
          ...createBaseIssue('task-1', 'Task in DB'),
          issueType: 'Task',
        },
      ],
      issueKeyCounter: 1,
    };

    test('should conform to DbSchema structure and property types', () => {
      expect(mockDbSchema).toBeDefined();
      expect(Array.isArray(mockDbSchema.issues)).toBe(true);
      expect(typeof mockDbSchema.issueKeyCounter).toBe('number');

      const firstIssue = mockDbSchema.issues[0];
      expect(typeof firstIssue.id).toBe('string');
      expect(typeof firstIssue.key).toBe('string');
      expect(typeof firstIssue.issueType).toBe('Task');
      expect(typeof firstIssue.summary).toBe('string');
      expect(typeof firstIssue.createdAt).toBe('string');
      expect(typeof firstIssue.updatedAt).toBe('string');
    });
  });
});
