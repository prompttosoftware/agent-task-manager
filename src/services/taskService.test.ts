import { createTask } from './taskService'; // Import only the necessary function(s)
import { Task } from '../models/Task';

describe('TaskService', () => {
  // No service instance variable needed
  // No beforeEach block needed
  // No 'should be defined' test needed

  it('should create a task', () => {
    const taskData: Omit<Task, 'id'> = {
      title: 'Test Task',
      description: 'This is a test task',
      status: 'open',
      dueDate: new Date(),
    };
    // Call the imported function directly with correct arguments
    // The service createTask expects title, description (optional), and dueDate string (optional)
    const createdTask = createTask(taskData.title, taskData.description, taskData.dueDate ? taskData.dueDate.toISOString() : undefined);
    expect(createdTask.title).toBe(taskData.title);
  });
});
