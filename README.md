# Agent Task Manager

## 1. Overview

This project is a local task manager designed to mimic a simplified version of the Jira REST API. It's built using Node.js, TypeScript, Express, and SQLite. The primary goal is to provide a fast and locally hosted task management solution, focusing on the core functionalities of issue creation, management, and basic board views.

## 2. Core Technologies

*   **Backend:** Node.js
*   **Framework:** Express.js
*   **Language:** TypeScript
*   **Database:** SQLite
*   **Process Manager (Recommended):** PM2 or nodemon for development

## 3. Design Decisions

*   **API Base Path:** `/rest/api/3/` (Mimicking Jira v3)
*   **Host:** Configurable, defaults to `http://localhost:3000` (Port 3000 is a common default)
*   **Authentication:** None (Simplified for local use)
*   **Project Scope:** Single implicit project. All issues belong to this project. Key generation will use a fixed prefix (e.g., `TASK-`).
*   **Board Scope:** Single implicit board defined by the statuses: To Do (11), In Progress (21), Done (31).
*   **User Representation:** Assignees are represented by simple string keys (e.g., `user123`). No user management system.
*   **Issue Key Generation:** Sequential numbering prefixed by project key (e.g., `TASK-1`, `TASK-2`). Need a mechanism to track the last used index.
*   **Error Handling:** Return appropriate HTTP status codes (400, 404, 500) with JSON error messages similar to Jira (`{ \"errorMessages\": [\"...\"], \"errors\": {} }`).
*   **Custom Fields:**
    *   Epic Link (for linking issues to Epics): `customfield_10010`
    *   Epic Name (for Epic issues): `customfield_10011`

## 4. Database Schema (SQLite)

*   **Statuses Table:** (Seed with initial data)
    *   `id`: INTEGER PRIMARY KEY
    *   `name`: TEXT NOT NULL UNIQUE
    *   `category`: TEXT NOT NULL CHECK(category IN ('open', 'indeterminate', 'done'))
*   **Issues Table:**
    *   `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    *   `key`: TEXT UNIQUE NOT NULL (e.g., "TASK-1")
    *   `type`: TEXT NOT NULL CHECK(type IN ('Task', 'Subtask', 'Story', 'Bug', 'Epic'))
    *   `summary`: TEXT NOT NULL
    *   `description`: TEXT
    *   `status_id`: INTEGER NOT NULL DEFAULT 11 REFERENCES Statuses(id)
    *   `assignee_key`: TEXT NULL
    *   `epic_id`: INTEGER NULL REFERENCES Issues(id) ON DELETE SET NULL
    *   `epic_name`: TEXT NULL (Specific to Epic type, stored denormalized or via join)
    *   `parent_id`: INTEGER NULL REFERENCES Issues(id) ON DELETE CASCADE
    *   `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
    *   `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
*   **IssueLinks Table:**
    *   `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    *   `source_issue_id`: INTEGER NOT NULL REFERENCES Issues(id) ON DELETE CASCADE
    *   `target_issue_id`: INTEGER NOT NULL REFERENCES Issues(id) ON DELETE CASCADE
    *   `link_type`: TEXT NOT NULL DEFAULT 'Relates'
*   **Attachments Table:**
    *   `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    *   `issue_id`: INTEGER NOT NULL REFERENCES Issues(id) ON DELETE CASCADE
    *   `filename`: TEXT NOT NULL
    *   `mime_type`: TEXT NOT NULL
    *   `content`: BLOB NOT NULL
    *   `size`: INTEGER NOT NULL
    *   `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
*   **Webhooks Table:**
    *   `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    *   `url`: TEXT NOT NULL
    *   `events`: TEXT NOT NULL (JSON array of strings: 'issue_created', 'issue_updated', 'issue_deleted')
    *   `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
*   **Metadata Table:** (For tracking things like last issue index)
    *   `key`: TEXT PRIMARY KEY
    *   `value`: TEXT NOT NULL

## 5. API Endpoints & Functionality

**(All paths prefixed with `/rest/api/3`)**

1.  **`POST /issue`**: Add new issue
    *   Request Body: Simplified Jira format (see Turn 3 research), requires `fields.summary`, `fields.issuetype.name`. Project assumed. `description`, `assignee.key`, `parent.key`, `customfield_10010` (Epic Key), `customfield_10011` (Epic Name) are optional.
    *   Generates unique `key` (e.g., `TASK-N`).
    *   Sets default status to 'To Do' (11).
    *   Triggers `issue_created` webhook.
    *   Response: 201 Created with new issue JSON.
2.  **`GET /issue/{issueIdOrKey}`**: Get Issue
    *   Finds issue by DB `id` or `key`.
    *   Response: 200 OK with detailed issue JSON (mimicking Jira structure, including `fields`, `status`, `issuetype`, `assignee`, `attachment`, `issuelinks`, `parent`, `customfield_10010` (Epic Link), `customfield_10011` (Epic Name)).
3.  **`GET /search?jql=status={statusIdOrName}`**: Get issues for board/status
    *   Parses simple `jql` query (only `status = X`).
    *   Finds status ID by name if name is provided.
    *   Response: 200 OK with Jira-like search results structure containing an array of issue JSONs matching the status.
    *   ```json
        {
          "startAt": 0,
          "maxResults": 50,
          "total": 1,
          "issues": [ /* Issue JSON objects */ ]
        }
        ```
4.  **`GET /issue/{issueIdOrKey}/transitions`**: List transitions
    *   Finds the issue.
    *   Determines allowed transitions based on current status (To Do -> In Progress; In Progress -> To Do, Done; Done -> To Do, In Progress).
    *   Response: 200 OK with simplified transitions list:
    *   ```json
        {
          "expand": "transitions",
          "transitions": [
            { "id": "21", "name": "In Progress", "to": { "id": "21", "name": "In Progress", /*...*/ } },
            { "id": "31", "name": "Done", "to": { "id": "31", "name": "Done", /*...*/ } }
          ]
        }
        ```
5.  **`POST /issue/{issueIdOrKey}/transitions`**: Transition issue
    *   Request Body: `{ "transition": { "id": targetStatusId } }`
    *   Validates if the transition is allowed from the current status.
    *   Updates issue `status_id` and `updated_at`.
    *   Triggers `issue_updated` webhook.
    *   Response: 204 No Content.
6.  **`POST /issue/{issueIdOrKey}/attachments`**: Add attachment
    *   Requires `multipart/form-data` request with a file.
    *   Stores file metadata and content (blob) in `Attachments` table, linking to the issue.
    *   Updates issue `updated_at`.
    *   Triggers `issue_updated` webhook.
    *   Response: 200 OK with attachment JSON details.
7.  **`POST /issueLink`**: Issue link
    *   Request Body: `{ "type": { "name": "Relates" }, "inwardIssue": { "key": "TASK-1" }, "outwardIssue": { "key": "TASK-2" } }` (Only 'Relates' type supported initially).
    *   Finds both issues by key.
    *   Creates entry in `IssueLinks` table.
    *   Updates `updated_at` for both issues.
    *   Triggers `issue_updated` webhook for both issues.
    *   Response: 201 Created.
8.  **`PUT /issue/{issueIdOrKey}/assignee`**: Update assignee with key
    *   Request Body: `{ "name": "user_key" }` (Use `name` field like Jira, even though it's a key here).
    *   Updates `assignee_key` and `updated_at` for the issue.
    *   Triggers `issue_updated` webhook.
    *   Response: 204 No Content.
9.  **`DELETE /issue/{issueIdOrKey}`**: Delete issue
    *   Deletes the issue and associated data (attachments, links - handled by CASCADE).
    *   Triggers `issue_deleted` webhook.
    *   Response: 204 No Content.
10. **`POST /webhook`**: Register webhook
    *   Request Body: `{ "url": "http://example.com/webhook", "events": ["issue_created", "issue_updated"] }`
    *   Stores webhook details in `Webhooks` table.
    *   Response: 201 Created with webhook JSON (including generated ID).
11. **`DELETE /webhook/{webhookId}`**: Delete webhook
    *   Deletes webhook by ID.
    *   Response: 204 No Content.
12. **`GET /webhook`**: List webhooks
    *   Response: 200 OK with an array of webhook JSONs.
13. **`GET /issue/createmeta`**: Get issue create metadata
    *   Response: 200 OK with static JSON defining the implicit project and available issue types (Task, Subtask, Story, Bug, Epic).
14. **`GET /epic`**: Get epics
    *   Finds all issues where `type` is 'Epic'.
    *   Response: 200 OK with Jira-like search results structure containing an array of Epic issue JSONs.

## 6. Webhook Implementation

*   Create a service/module responsible for handling webhooks.
*   After relevant actions (create, update, delete issue), this service retrieves all registered webhooks matching the event type.
*   For each matching webhook, asynchronously send a POST request to the registered URL.
*   Webhook Payload: Simplified Jira webhook format, containing event type and relevant issue data.
    *   Example (`issue_created`): `{ "timestamp": 1678886400000, "webhookEvent": "jira:issue_created", "issue": { /* Issue JSON */ } }`
*   Use a robust HTTP client (like `axios` or `node-fetch`) and handle potential errors during webhook calls (timeouts, non-2xx responses) gracefully without blocking the main API response.

## 7. Project Structure (Example)

```
/agent-task-manager
|-- src/
|   |-- api/
|   |   |-- routes/
|   |   |   |-- issueRoutes.ts
|   |   |   |-- webhookRoutes.ts
|   |   |   |-- epicRoutes.ts
|   |   |   |-- metadataRoutes.ts
|   |   |-- controllers/
|   |   |   |-- issueController.ts
|   |   |   |-- webhookController.ts
|   |   |   |-- ...
|   |   |-- middleware/
|   |   |   |-- errorHandler.ts
|   |   |   |-- requestLogger.ts
|   |-- config/
|   |   |-- index.ts
|   |   |-- db.ts
|   |-- services/
|   |   |-- databaseService.ts
|   |   |-- webhookService.ts
|   |   |-- issueKeyService.ts
|   |-- models/
|   |   |-- issue.ts
|   |   |-- webhook.ts
|   |   |-- ... (DB interfaces/types)
|   |-- utils/
|   |   |-- jsonTransformer.ts (To format responses like Jira)
|   |-- app.ts       # Express app setup
|   |-- server.ts    # Server startup
|-- data/
|   |-- database.sqlite # SQLite file
|   |-- migrations/  # Optional: DB migration scripts
|   |-- seeds/       # Optional: Initial data (statuses)
|-- logs/
|   |-- plan/
|   |   |-- plan.txt
|   |-- epic/
|-- .gitignore
|-- package.json
|-- tsconfig.json
|-- README.md
|-- LICENSE
```

## 8. Tasks & Epics (Next Step)

Break down the implementation based on this plan into distinct Epics and associated tasks.
```
