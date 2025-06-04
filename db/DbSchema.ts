import { AnyIssue } from '../types';

export interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}
