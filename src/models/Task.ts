import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status: 'open' | 'in progress' | 'completed';
}

export const createTask = (title: string, description?: string, dueDate?: Date): Task => {
  return {
    id: uuidv4(),
    title,
    description,
    dueDate,
    status: 'open',
  };
};
