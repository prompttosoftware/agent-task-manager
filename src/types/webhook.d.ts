export interface WebhookPayload {
    event: string;
    data: IssueCreatedData | IssueUpdatedData;
    // Add other common properties if needed, e.g., timestamp, source, etc.
  }

  export interface IssueCreatedData {
    issue: {
      key: string;
      fields: {
        summary: string;
        description?: string;
      };
    };
  }

  export interface IssueUpdatedData {
    issue: {
      key: string;
      fields: {
        summary?: string;
        description?: string;
      };
    };
  }