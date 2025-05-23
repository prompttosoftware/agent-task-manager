import { v4 as uuidv4 } from 'uuid';
import { AnyIssue, Task, Story, Epic, Bug, Subtask, DbSchema } from './models';

describe('models', () => {
  it('AnyIssue type should accept all concrete issue types (Task, Story, Epic, Bug, Subtask)', () => {
    const now = new Date().toISOString();

    // Create instances of each concrete type, ensuring they conform to their interfaces
    const taskIssue: Task = {
      id: uuidv4(),
      key: 'TASK-1',
      issueType: 'Task',
      summary: 'Complete documentation',
      status: 'Todo',
      createdAt: now,
      updatedAt: now,
      description: 'test',
    };

    const storyIssue: Story = {
      id: uuidv4(),
      key: 'STORY-1',
      issueType: 'Story',
      summary: 'Implement user authentication',
      status: 'In Progress',
      createdAt: now,
      updatedAt: now,
      description: 'test',
    };

    const epicIssue: Epic = {
      id: uuidv4(),
      key: 'EPIC-1',
      issueType: 'Epic',
      summary: 'Improve performance',
      status: 'Done',
      createdAt: now,
      updatedAt: now,
      childIssueKeys: ['TASK-1', 'STORY-1'],
      description: 'test',
    };

    const bugIssue: Bug = {
      id: uuidv4(),
      key: 'BUG-1',
      issueType: 'Bug',
      summary: 'Homepage broken on mobile',
      status: 'Todo',
      createdAt: now,
      updatedAt: now,
      description: 'test',
    };

    const subtaskIssue: Subtask = {
      id: uuidv4(),
      key: 'SUB-1',
      issueType: 'Subtask',
      summary: 'Write unit tests for authentication',
      status: 'In Progress',
      createdAt: now,
      updatedAt: now,
      parentIssueKey: 'STORY-1',
      description: 'test',
    };

    // Declare a variable of type AnyIssue
    let anyIssue: AnyIssue | undefined = undefined;

    // Attempt to assign each concrete type instance to the AnyIssue variable.
    // The primary verification is that these assignments compile without TypeScript errors.
    // We add runtime assertions to make the test runner pass and provide feedback.

    anyIssue = taskIssue;
    expect(anyIssue).toBeDefined();
    expect(anyIssue.issueType).toBe('Task');

    anyIssue = storyIssue;
    expect(anyIssue).toBeDefined();
    expect(anyIssue.issueType).toBe('Story');

    anyIssue = epicIssue;
    expect(anyIssue).toBeDefined();
    expect(anyIssue.issueType).toBe('Epic');
    // Check an epic-specific property, requiring type assertion
    expect((anyIssue as Epic).childIssueKeys).toEqual(['TASK-1', 'STORY-1']);

    anyIssue = bugIssue;
    expect(anyIssue).toBeDefined();
    expect(anyIssue.issueType).toBe('Bug');

    anyIssue = subtaskIssue;
    expect(anyIssue).toBeDefined();
    expect(anyIssue.issueType).toBe('Subtask');
    // Check a subtask-specific property, requiring type assertion
    expect((anyIssue as Subtask).parentIssueKey).toBe('STORY-1');

    // If the code compiles and reaches this point without type errors during assignment,
    // the test implicitly confirms that AnyIssue is a valid union of all specified types.
  });
});
