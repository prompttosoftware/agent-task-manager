// src/services/issueService.ts

import * as dataService from './dataService';
import { Issue } from '../data/inMemoryStorage';

export const createIssue = (issue: Issue): Issue => {
  return dataService.createIssue(issue);
};

export const getIssueByKey = (key: string): Issue | undefined => {
  return dataService.getIssueByKey(key);
};

export const getAllIssues = (): Issue[] => {
  return dataService.getAllIssues();
};

export const updateIssue = (key: string, updatedFields: Partial<Issue>): Issue | undefined => {
    return dataService.updateIssue(key, updatedFields);
}

export const deleteIssue = (key: string): boolean => {
  return dataService.deleteIssue(key);
};

export const linkIssues = async (inwardKey: string, outwardKey: string): Promise<void> => {
    if (!inwardKey || !outwardKey) {
        throw new Error('Invalid issue keys');
    }

    const inwardIssue = dataService.getIssueByKey(inwardKey);
    const outwardIssue = dataService.getIssueByKey(outwardKey);

    if (!inwardIssue || !outwardIssue) {
        throw new Error('Issue not found');
    }

    dataService.addIssueLink(inwardKey, outwardKey);
};
