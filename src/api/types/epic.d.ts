// src/api/types/epic.d.ts

export interface Epic {
  id: number;
  key: string;
  name: string;
  self: string;
  // Add other fields as per Jira's Epic response
  // fields: { ... }; // Add fields based on the Jira response
  createdAt: string;
}

export interface EpicCreateRequest {
  key: string;
  name: string;
}

export interface EpicUpdateRequest {
  key?: string;
  name?: string;
}

export interface EpicIssue {
    id: string;
    key: string;
    self: string;
    // Add other fields as per Jira's Issue response
    fields: {
      summary: string;
      status: {
        name: string;
        id: string;
        statusCategory: {
          key: string;
        };
      };
      issuetype: {
        name: string;
        iconUrl: string;
      };
    };
}
