import { Task } from '../models/task';
import { Database } from '../db/database';

export class TaskService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAllTasks(): Promise<Task[]> {
    return this.db.getAllTasks();
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    return this.db.getTaskById(id);
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    return this.db.createTask(task);
  }

  async updateTask(id: number, updates: Partial<Omit<Task, 'id'>>): Promise<Task | undefined> {
    return this.db.updateTask(id, updates);
  }

  async deleteTask(id: number): Promise<void> {
    return this.db.deleteTask(id);
  }
}
