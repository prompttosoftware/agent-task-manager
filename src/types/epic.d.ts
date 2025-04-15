// src/types/epic.d.ts

export interface Epic {
  id?: string; // Add id property
  epicKey: string;
  name: string;
  description: string;
  status: string;
  startDate?: string; // ISO 8601 string
  endDate?: string;   // ISO 8601 string
}

export interface Issue {
  issueKey: string;
  summary: string;
  status: string;
  // Add other issue properties as needed
}

export interface EpicCreateRequest {
  epicKey: string;
  name: string;
  description: string;
  status: string;
  startDate?: string; // ISO 8601 string
  endDate?: string;   // ISO 8601 string
}

export interface EpicUpdateRequest {
  name?: string;
  description?: string;
  status?: string;
  startDate?: string; // ISO 8601 string
  endDate?: string;   // ISO 8601 string
}

export interface ErrorResponse {
  errors: {
    msg: string;
    param: string;
    location: string;
  }[];
}
