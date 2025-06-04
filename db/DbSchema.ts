import { AnyIssue } from '../models';

export interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}
