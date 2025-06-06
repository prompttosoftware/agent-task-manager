/**
 * Represents a task item.
 */
export interface Task {
  /**
   * Unique identifier for the task. Typically auto-generated.
   */
  id: number;

  /**
   * The title or short description of the task.
   */
  title: string;

  /**
   * A more detailed description of the task.
   */
  description: string;

  /**
   * Indicates whether the task has been completed.
   * Defaults to false when a task is created.
   */
  completed: boolean;
}
