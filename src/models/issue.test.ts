import { Task, Story, Bug, Epic, Subtask, BaseIssue, DbSchema } from './issue';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sample Task object for testing.
 */
const sampleTask: Task = {
  id: uuidv4(),
  key: 'TASK-1',
  issueType: 'Task',
  summary: 'Sample Task',
  status: 'Todo',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Sample Story object for testing.
 */
const sampleStory: Story = {
  id: uuidv4(),
  key: 'STORY-1',
  issueType: 'Story',
  summary: 'Sample Story',
  status: 'In Progress',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Sample Bug object for testing.
 */
const sampleBug: Bug = {
  id: uuidv4(),
  key: 'BUG-1',
  issueType: 'Bug',
  summary: 'Sample Bug',
  status: 'Done',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Sample Epic object for testing.
 */
const sampleEpic: Epic = {
  id: uuidv4(),
  key: 'EPIC-1',
  issueType: 'Epic',
  summary: 'Sample Epic',
  status: 'Todo',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  childIssueKeys: ['TASK-1', 'TASK-2'],
};

/**
 * Sample Subtask object for testing.
 */
const sampleSubtask: Subtask = {
  id: uuidv4(),
  key: 'SUBTASK-1',
  issueType: 'Subtask',
  summary: 'Sample Subtask',
  status: 'Todo',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  parentIssueKey: 'TASK-1',
};

describe('Issue Model Tests', () => {
  it('should create a sample Task', () => {
    expect(sampleTask.key).toBe('TASK-1');
  });

  it('should create a sample Story', () => {
    expect(sampleStory.issueType).toBe('Story');
  });

  it('should create a sample Bug', () => {
    expect(sampleBug.status).toBe('Done');
  });

  it('should create a sample Epic', () => {
      expect(sampleEpic.childIssueKeys).toEqual(['TASK-1', 'TASK-2']);
  });

  it('should create a sample Subtask', () => {
      expect(sampleSubtask.parentIssueKey).toBe('TASK-1');
  });

  it('should ensure test is running', () => {
    expect(true).toBe(true);
  });
});
