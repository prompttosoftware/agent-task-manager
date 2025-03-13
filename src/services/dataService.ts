// src/services/dataService.ts

import { issues, boards, webhooks, Issue, Board, Webhook } from '../data/inMemoryStorage';

// Issue Service Functions

export const createIssue = (issue: Issue): Issue => {
  issue.id = String(issues.length + 1);
  issues.push(issue);
  return issue;
};

export const getIssueByKey = (key: string): Issue | undefined => {
  return issues.find((issue) => issue.key === key);
};

export const getAllIssues = (): Issue[] => {
  return issues;
};

export const updateIssue = (key: string, updatedFields: Partial<Issue>): Issue | undefined => {
  const issueIndex = issues.findIndex((issue) => issue.key === key);
  if (issueIndex === -1) {
    return undefined;
  }
  issues[issueIndex] = { ...issues[issueIndex], ...updatedFields };
  return issues[issueIndex];
};

export const deleteIssue = (key: string): boolean => {
  const issueIndex = issues.findIndex((issue) => issue.key === key);
  if (issueIndex === -1) {
    return false;
  }
  issues.splice(issueIndex, 1);
  return true;
};


// Board Service Functions

export const initializeBoards = () => {
    if (boards.length > 0) return; // Prevent re-initialization
    const defaultBoard: Board = {
        id: "1",
        name: "Default Board",
        columns: [
            { name: "To Do", statusIds: ["11"] },
            { name: "In Progress", statusIds: ["21"] },
            { name: "Done", statusIds: ["31"] },
        ],
    };
    boards.push(defaultBoard);
}

export const getBoardById = (id: string): Board | undefined => {
  return boards.find((board) => board.id === id);
};

export const getAllBoards = (): Board[] => {
    return boards;
}

// Webhook Service Functions

export const registerWebhook = (webhook: Webhook): Webhook => {
  webhook.id = `webhook-${webhooks.length + 1}`;
  webhooks.push(webhook);
  return webhook;
};

export const listWebhooks = (): Webhook[] => {
  return webhooks;
};

export const deleteWebhook = (id: string): boolean => {
  const webhookIndex = webhooks.findIndex((webhook) => webhook.id === id);
  if (webhookIndex === -1) {
    return false;
  }
  webhooks.splice(webhookIndex, 1);
  return true;
};

export const triggerWebhook = (eventName: string, data: any): void => {
  const matchingWebhooks = webhooks.filter((webhook) => webhook.events.includes(eventName));

  matchingWebhooks.forEach((webhook) => {
    // In a real implementation, you would make an HTTP request to the webhook URL
    console.log(`Triggering webhook ${webhook.name} for event ${eventName}`, { webhook, data });
  });
};
