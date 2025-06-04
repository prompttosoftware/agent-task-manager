import { AnyIssue } from '../models';

export const DB_FILE_PATH = "/usr/src/agent-task-manager/.data/db.json";

export interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}
