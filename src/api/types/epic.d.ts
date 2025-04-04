// src/api/types/epic.d.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export interface Epic {
  id: number;
  key: string;
  name: string;
  self: string; // URL to the epic in Jira
  // Add other fields as per Jira's Epic response
  createdAt: string;
  // Add other common fields as needed
}

// Validation DTOs (used for server-side validation)
class EpicCreateDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export interface EpicCreateRequest {
  key: string;
  name: string;
}


export interface EpicResponse extends Epic {
  // Fields from Jira API response
  id: number;
  key: string;
  self: string;
  name: string;
  description?: string; // Example field from Jira
  fields?: {
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
    summary: string;
  };
  // Add other fields based on the Jira API response
  // For example:
  //  id: number;
  //  key: string;
  //  name: string;
  //  self: string;
  //  createdAt: string;
  //  fields?: any; // Or a more specific type based on the Jira response
}

export interface EpicListResponse extends Array<EpicResponse> {}


class EpicUpdateDto {
  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export interface EpicUpdateRequest {
  key?: string;
  name?: string;
}

export interface EpicIssue {
  id: string;
  key: string;
  self: string;
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
export interface EpicIssuesResponse extends Array<EpicIssue> {}
