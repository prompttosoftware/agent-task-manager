import {
  BaseIssue,
  EpicSpecifics,
  SubtaskSpecifics,
  Task,
  Story,
  Bug,
  Epic,
  Subtask,
  AnyIssue,
  DbSchema,
} from './models/issue';

describe('Data Model Tests', () => {
  it('should define BaseIssue correctly', () => {
    const baseIssue: BaseIssue = {
      id: 'uuid',
      key: 'PROJECT-1',
      issueType: 'Task',
      summary: 'Test Summary',
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(baseIssue.id).toBeDefined();
    expect(baseIssue.key).toBeDefined();
    expect(baseIssue.issueType).toBe('Task');
    expect(baseIssue.summary).toBeDefined();
    expect(baseIssue.status).toBe('Todo');
    expect(baseIssue.createdAt).toBeDefined();
    expect(baseIssue.updatedAt).toBeDefined();
  });

  it('should define EpicSpecifics correctly', () => {
    const epicSpecifics: EpicSpecifics = {
      childIssueKeys: ['PROJECT-2', 'PROJECT-3'],
    };
    expect(epicSpecifics.childIssueKeys).toBeDefined();
    expect(epicSpecifics.childIssueKeys.length).toBe(2);
  });

  it('should define SubtaskSpecifics correctly', () => {
    const subtaskSpecifics: SubtaskSpecifics = {
      parentIssueKey: 'PROJECT-4',
    };
    expect(subtaskSpecifics.parentIssueKey).toBeDefined();
  });

  it('should define Task correctly', () => {
    const task: Task = {
      id: 'uuid',
      key: 'PROJECT-5',
      issueType: 'Task',
      summary: 'Task Summary',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(task.issueType).toBe('Task');
  });

  it('should define Story correctly', () => {
    const story: Story = {
      id: 'uuid',
      key: 'PROJECT-6',
      issueType: 'Story',
      summary: 'Story Summary',
      status: 'Done',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(story.issueType).toBe('Story');
  });

  it('should define Bug correctly', () => {
    const bug: Bug = {
      id: 'uuid',
      key: 'PROJECT-7',
      issueType: 'Bug',
      summary: 'Bug Summary',
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(bug.issueType).toBe('Bug');
  });

  it('should define Epic correctly', () => {
    const epic: Epic = {
      id: 'uuid',
      key: 'PROJECT-8',
      issueType: 'Epic',
      summary: 'Epic Summary',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      childIssueKeys: ['PROJECT-9', 'PROJECT-10'],
    };
    expect(epic.issueType).toBe('Epic');
    expect(epic.childIssueKeys).toBeDefined();
  });

  it('should define Subtask correctly', () => {
    const subtask: Subtask = {
      id: 'uuid',
      key: 'PROJECT-11',
      issueType: 'Subtask',
      summary: 'Subtask Summary',
      status: 'Done',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentIssueKey: 'PROJECT-12',
    };
    expect(subtask.issueType).toBe('Subtask');
    expect(subtask.parentIssueKey).toBeDefined();
  });

  it('should define AnyIssue correctly', () => {
    const task: AnyIssue = {
      id: 'uuid',
      key: 'PROJECT-13',
      issueType: 'Task',
      summary: 'AnyIssue Task',
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(task.issueType).toBe('Task');

    const story: AnyIssue = {
      id: 'uuid',
      key: 'PROJECT-14',
      issueType: 'Story',
      summary: 'AnyIssue Story',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(story.issueType).toBe('Story');
  });

  it('should define DbSchema correctly', () => {
    const dbSchema: DbSchema = {
      issues: [],
      issueKeyCounter: 0,
    };
    expect(dbSchema.issues).toBeDefined();
    expect(dbSchema.issueKeyCounter).toBe(0);
  });
});
