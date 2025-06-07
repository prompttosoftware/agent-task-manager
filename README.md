# Local Jira-like Task Manager

## Introduction

The Agent Task Manager is a local, high-performance task management application designed to mimic a simplified Atlassian Jira API. It provides a fast and reliable mock API server for local development and testing environments where a dependency on the live Jira API is undesirable or impractical.  This application is a self-contained backend service built on Node.js, Express, and TypeScript, serving JSON responses that are structurally aligned with the Jira REST API for a predefined set of features. It uses a local SQLite database for persistence, making it zero-configuration and easy to run on any developer machine.

## Project Structure

```
/
├── .env                  # Local environment variables
├── .env.example          # Example environment file
├── .gitignore
├── jest.config.ts        # Jest configuration
├── package.json
├── tsconfig.json
├── src/
│   ├── app.ts            # Express app setup, middleware, and router binding
│   ├── server.ts         # Server startup logic (http.createServer)
│   ├── config/           # Environment configuration loader
│   ├── types/            # Core TypeScript interfaces (e.g., JiraAPI, custom types)
│   ├── api/
│   │   ├── index.ts      # Main API router (aggregates all v2 routes)
│   │   ├── controllers/  # Request/response handlers (e.g., issue.controller.ts)
│   │   └── routes/       # Route definitions (e.g., issue.routes.ts)
│   ├── services/         # Business logic (e.g., issue.service.ts, attachment.service.ts)
│   ├── db/
│   │   ├── data-source.ts    # TypeORM DataSource configuration
│   │   ├── entities/         # TypeORM entity classes (e.g., issue.entity.ts)
│   │   └── migrations/       # Database migration scripts
│   ├── middleware/       # Custom Express middleware (e.g., error handling, logging)
│   └── utils/            # Helper functions (e.g., key generation, response formatters)
├── tests/
│   ├── fixtures/         # Test data (e.g., seed data for test DB)
│   ├── integration/      # End-to-end API tests
│   └── unit/             # Unit tests for services and utils
└── uploads/              # Storage for issue attachments (.gitignored)
```

## Technologies

*   **Backend Framework:** Node.js with Express.js
*   **Language:** TypeScript
*   **Database:** SQLite (via `sqlite3` package)
*   **ORM:** TypeORM
*   **Configuration:** `dotenv`
*   **File Uploads:** `multer`
*   **Testing:** Jest, `supertest`
*   **Logging:** `pino`
*   **Linting/Formatting:** ESLint and Prettier
*   **Development Utility:** `ts-node-dev`
*   **Validation:** Zod

## Database Schema

A local SQLite database is used. TypeORM entities define the schema, and migrations manage schema changes.

### user Table

Stores user information.

*   `id` (Primary Key, integer, auto-increment)
*   `userKey` (string, unique, indexed) - e.g., "jdoe"
*   `displayName` (string) - e.g., "John Doe"
*   `emailAddress` (string, unique)

### issue Table

Central table for tasks, stories, etc.

*   `id` (Primary Key, integer, auto-increment)
*   `issueKey` (string, unique, indexed) - e.g., "TASK-1"
*   `summary` (string)
*   `description` (text, nullable)
*   `statusId` (integer, indexed) - Refers to a hardcoded Status map
*   `issueTypeId` (integer, indexed) - Refers to a hardcoded IssueType map
*   `assigneeId` (integer, nullable, Foreign Key to `user.id`)
*   `reporterId` (integer, nullable, Foreign Key to `user.id`)
*   `parentId` (integer, nullable, Foreign Key to `issue.id` for sub-tasks)
*   `epicId` (integer, nullable, Foreign Key to `issue.id` for issues belonging to an epic)
*   `createdAt` (datetime, default current_timestamp)
*   `updatedAt` (datetime, on update current_timestamp)

### attachment Table

Stores metadata for file attachments.

*   `id` (Primary Key, integer, auto-increment)
*   `issueId` (integer, Foreign Key to `issue.id`, indexed)
*   `filename` (string) - Original client-side filename
*   `storedFilename` (string, unique) - UUID-based name on disk
*   `mimetype` (string)
*   `size` (integer, in bytes)
*   `authorId` (integer, nullable, Foreign Key to `user.id`)
*   `createdAt` (datetime, default current_timestamp)

### issue_link Table

Stores relationships between issues.

*   `id` (Primary Key, integer, auto-increment)
*   `linkTypeId` (integer) - Refers to a hardcoded LinkType map
*   `inwardIssueId` (integer, Foreign Key to `issue.id`)
*   `outwardIssueId` (integer, Foreign Key to `issue.id`)

### Static Data

The following Jira concepts are managed as static maps within the application:

*   **Statuses:**
    *   `11`: { name: "To Do", statusCategory: { key: "new" } }
    *   `21`: { name: "In Progress", statusCategory: { key: "indeterminate" } }
    *   `31`: { name: "Done", statusCategory: { key: "done" } }
*   **Issue Types:**
    *   `1`: { name: "Bug" }
    *   `2`: { name: "Story" }
    *   `3`: { name: "Task" }
    *   `4`: { name: "Sub-task" }
    *   `5`: { name: "Epic" }
*   **Issue Link Types:**
    *   `1000`: { name: "Blocks", inward: "is blocked by", outward: "blocks" }
    *   `1001`: { name: "Relates", inward: "relates to", outward: "relates to" }

## API Endpoints

All endpoints are versioned and prefixed with `/rest/api/2`. The host is configurable via environment variables.

### 4.1. Get Issue (`GET /issue/{issueKey}`)

*   **Functionality:** Retrieves issue details by key (e.g., "TASK-123").
*   **Response:** Jira issue object format.
*   **Error Handling:** 404 Not Found if `issueKey` does not exist.

### 4.2. Create New Issue (`POST /issue`)

*   **Functionality:** Creates a new issue.
*   **Request:** `{"fields": {"summary": "...", "issuetype": {"id": "3"}, "reporter": {"key": "jdoe"}, ...}}`
*   **Response (201 Created):** `{"id": "10002", "key": "TASK-2", "self": "http://localhost:3000/rest/api/2/issue/10002"}`
*   **Error Handling:** 400 Bad Request for invalid data, 404 Not Found if user does not exist.

### 4.3. Delete Issue (`DELETE /issue/{issueKey}`)

*   **Functionality:** Permanently deletes an issue.
*   **Response:** 204 No Content on success.
*   **Error Handling:** 404 Not Found if the issue does not exist.

### 4.4. Transition Issue (`POST /issue/{issueKey}/transitions`)

*   **Functionality:** Changes the status of an issue.
*   **Request:** `{"transition": {"id": "21"}}`
*   **Response:** 204 No Content.
*   **Error Handling:** 400 Bad Request if the transition ID is invalid, 404 Not Found if the issue doesn't exist.

### 4.5. List Transitions (`GET /issue/{issueKey}/transitions`)

*   **Functionality:** Lists possible statuses an issue can be transitioned to.
*   **Response (200 OK):** `{"expand": "...", "transitions": [{"id": "21", "name": "In Progress"}, ...]}`
*   **Error Handling:** 404 Not Found if the issue does not exist.

### 4.6. Find Issues (Search) (`GET /search`)

*   **Functionality:** Searches for issues based on query parameters.
*   **Query Parameters:** `status` (ID), `issuetype` (ID), `assignee` (userKey).
*   **Response (200 OK):** Mimics Jira search results: `{"total": 5, "issues": [ { /* full issue object */ }, ... ]}`

### 4.7. Add Attachment (`POST /issue/{issueKey}/attachments`)

*   **Functionality:** Attaches files to an issue.
*   **Request:** `multipart/form-data` with a `file` field.
*   **Response (200 OK):** Array of attachment metadata.
*   **Error Handling:** 404 Not Found if issue doesn't exist. 400 Bad Request if no files are provided. 413 Payload Too Large if files exceed a configured size limit.

### 4.8. Issue Link (`POST /rest/api/2/issueLink`)

*   **Functionality:** Creates a directional link between two issues.
*   **Request:** `{"type": {"name": "Blocks"}, "inwardIssue": {"key": "TASK-2"}, "outwardIssue": {"key": "TASK-1"}}`
*   **Response:** 201 Created (empty body).
*   **Error Handling:** 404 Not Found if either issue key is invalid. 400 Bad Request for invalid link type name.

### 4.9. Update Assignee (`PUT /issue/{issueKey}/assignee`)

*   **Functionality:** Changes or sets the assignee.
*   **Request:** `{"key": "new-assignee-key"}` or `{"key": null}` to unassign.
*   **Response:** 204 No Content.
*   **Error Handling:** 404 Not Found if the issue or user does not exist.

### 4.10. Get Issue Create Metadata (`GET /issue/createmeta`)

*   **Functionality:** Provides information for creating an issue.
*   **Response (200 OK):** Static JSON detailing projects, issue types, and fields.

## Non-Functional Requirements

### Security

*   **Authentication/Authorization:** Out of scope.  All endpoints are open on the local network.
*   **Input Validation:**  Strict validation using `zod` for all requests.
*   **SQL Injection:** Mitigated by TypeORM's query builder.
*   **File Uploads:**  `multer` for size limits and UUID-based filenames.
*   **Dependencies:**  `npm audit` and potential Snyk/Dependabot for vulnerability monitoring.

### Performance & Scalability

*   **Performance:** Low latency is a primary goal. Database queries are optimized, and indexes are created.
*   **Scalability:** Designed for single-user or small-team local use. No horizontal scaling is planned.

### Monitoring & Logging

*   **Logging:** Structured JSON logging using `pino`.
*   **Log Levels:** `info`, `warn`, `error`.
*   **Log Output:** Written to `stdout`.

## Development & Deployment

### Initial Setup

1.  Clone the repository.
2.  `npm install`.
3.  Create `.env` from `.env.example`.
4.  `npm run db:migrate`.
5.  (Optional) `npm run db:seed`.

### Running the Application

*   **Development:** `npm run dev` (auto-recompilation).
*   **Production Build:** `npm run build`.
*   **Production Start:** `npm start`.

### Testing

*   **Unit Tests:** `npm run test:unit`.
*   **Integration Tests:** `npm run test:integration`.
*   **All Tests:** `npm test`.
*   **Code Coverage:** Minimum of 90%.
