# API Documentation - /issues/search

## Endpoint

```
GET /issues/search
```

## Description

Searches for issues based on the provided criteria.

## Request Parameters

The following query parameters can be used to filter the search results:

*   `keywords` (string, optional): Keywords to search for in the issue summary and description.
*   `status` (string, optional): Filters issues by their status.
*   `assignee` (string, optional): Filters issues by the assignee's username or ID.
*   `priority` (string, optional): Filters issues by their priority.
*   `reporter` (string, optional): Filters issues by the reporter's username or ID.
*   `page` (number, optional, default: 1): The page number for pagination.
*   `pageSize` (number, optional, default: 10): The number of issues to return per page.

## Response

### Status Codes

*   200 OK: The request was successful.
*   500 Internal Server Error: An unexpected error occurred.

### Response Body

The response body is a JSON object with the following structure:

```json
{
  "issues": [
    {
      "id": number,
      "issue_key": string,
      "summary": string,
      "description": string,
      "status": string,
      "assignee": string,
      "priority": string,
      "reporter": string,
      "created_at": string,
      "updated_at": string
    },
    ...
  ],
  "total": number
}
```

*   `issues` (array): An array of issue objects matching the search criteria. Each issue object contains the following fields:
    *   `id` (number): The unique identifier of the issue.
    *   `issue_key` (string): The issue key (e.g., ATM-123).
    *   `summary` (string): The summary of the issue.
    *   `description` (string): The description of the issue.
    *   `status` (string): The status of the issue.
    *   `assignee` (string): The assignee of the issue.
    *   `priority` (string): The priority of the issue.
    *   `reporter` (string): The reporter of the issue.
    *   `created_at` (string): The timestamp when the issue was created.
    *   `updated_at` (string): The timestamp when the issue was last updated.
*   `total` (number): The total number of issues that match the search criteria, considering all pages.
