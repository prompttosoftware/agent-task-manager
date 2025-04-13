export interface WebhookEvent {
  type: string;
  eventTime: string; // ISO 8601 timestamp
}

export interface IssueEvent {
  id: string;
  key: string;
}

export interface IssueCreatedEvent extends WebhookEvent {
  type: 'issue.created';
  issue: IssueEvent;
}

export interface IssueUpdatedEvent extends WebhookEvent {
  type: 'issue.updated';
  issue: IssueEvent;
  changelog: {
    items: {
      field: string;
      fieldtype: string;
      from?: string;
      fromString?: string;
      to?: string;
      toString?: string;
    }[];
  };
}

export interface IssueDeletedEvent extends WebhookEvent {
  type: 'issue.deleted';
  issue: IssueEvent;
}

export interface CommentCreatedEvent extends WebhookEvent {
  type: 'comment.created';
  comment: {
      id: string;
      body: string;
      author: {
          accountId: string;
          displayName: string;
      };
      created: string; // ISO 8601 timestamp
      updated: string; // ISO 8601 timestamp
  };
  issue: IssueEvent;
}

export interface CommentUpdatedEvent extends WebhookEvent {
  type: 'comment.updated';
  comment: {
      id: string;
      body: string;
      author: {
          accountId: string;
          displayName: string;
      };
      created: string; // ISO 8601 timestamp
      updated: string; // ISO 8601 timestamp
  };
  issue: IssueEvent;
}

export interface CommentDeletedEvent extends WebhookEvent {
  type: 'comment.deleted';
  comment: {
      id: string;
  };
  issue: IssueEvent;
}
