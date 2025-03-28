# Agent Task Manager

## Introduction

This document outlines the project plan for the Agent Task Manager, a simplified task management system. The project is built with Node.js, Typescript, Express, and SQLite.  The system aims to provide core Jira-like functionality for managing issues, attachments, boards, and webhooks.

## Epics and Deliverables

The project is divided into several epics, each addressing a specific area of functionality.  Each epic has a defined objective, tasks, and deliverables.

### Epic: Project Setup and Core API

*   **Objective:** Set up the basic project structure, configure Node.js, Typescript, Express, and SQLite, and establish the foundation for API endpoints.
*   **Tasks:**
    1.  Initialize Node.js project: Use `npm init -y` to create `package.json`.
    2.  Install dependencies: `npm install express typescript @types/express sqlite3 @types/sqlite3 vitest @types/node ts-node nodemon`
    3.  Configure Typescript: Create `tsconfig.json` with appropriate settings (e.g., outDir, rootDir, target, module, strict, esModuleInterop).
    4.  Configure Express: Create `src/index.ts` as the main entry point. Set up a basic Express server. Define a simple health check endpoint (e.g., `/health`).
    5.  Configure SQLite: Install `sqlite3`. Create a database connection in `src/db.ts`. Define basic database schema (initially, maybe just a placeholder table or tables for issues and boards).
    6.  Configure Vitest: Install `vitest` and `@types/node`. Configure `vitest.config.ts`. Write a basic test for the health check endpoint in `src/index.test.ts`.
    7.  Configure Nodemon: Add a `dev` script in `package.json` to use nodemon for development.
*   **Deliverables:**
    *   `package.json` with dependencies.
    *   `tsconfig.json` for Typescript configuration.
    *   `src/index.ts` with basic Express server and health check endpoint.
    *   `src/db.ts` for SQLite connection.
    *   Basic database schema definition.
    *   `vitest.config.ts` for Vitest configuration.
    *   `src/index.test.ts` with health check endpoint test.
    *   `package.json` with `dev` script for nodemon.
*   **Notes:**
    *   Use Typescript for all backend code.
    *   Use SQLite for local data storage.
    *   Ensure the project structure is clean and organized.
    *   Focus on setting up the core infrastructure in this epic.

### Epic: Issue Management

*   **Objective:** Implement API endpoints for managing issues, including creating, retrieving, updating, and deleting issues. Handle different issue types and issue links.
*   **Tasks:**
    1.  Define Issue Data Model: Create a Typescript interface or class to represent an issue. Include fields based on Jira API and user request (issue type, summary, description, status, assignee, links, attachments, etc.). Decide on data types for each field.
    2.  Implement Create Issue Endpoint: Create a POST endpoint `/issue`. Validate request body. Create a new issue in the SQLite database. Return Jira-like JSON response.
    3.  Implement Get Issue Endpoint: Create a GET endpoint `/issue/{issueId}`. Fetch issue from SQLite database by ID. Return Jira-like JSON response.
    4.  Implement Find Issue Endpoint: Create a GET endpoint `/issue?query={searchTerms}` (or similar, decide on query parameters). Search issues in SQLite database based on search terms (summary, description, etc.). Return Jira-like JSON response (list of issues).
    5.  Implement Update Issue Endpoint: Create a PUT endpoint `/issue/{issueId}`. Validate request body. Update issue in SQLite database. Return Jira-like JSON response.
    6.  Implement Delete Issue Endpoint: Create a DELETE endpoint `/issue/{issueId}`. Delete issue from SQLite database. Return success response.
    7.  Implement Issue Link Functionality: Decide how issue links will be stored and represented in the database. Implement logic for creating, retrieving, and managing issue links within the issue endpoints.
    8.  Implement Issue Type Handling: Ensure issue type is correctly handled during issue creation and retrieval. Potentially use an enum or similar for issue types (Task, Subtask, Story, Bug, Epic).
    9.  Write Unit Tests: Write Vitest unit tests for all issue management endpoints and functionalities.
*   **Deliverables:**
    *   Typescript data model for Issue.
    *   API endpoints for create, get, find, update, and delete issue.
    *   Issue link functionality.
    *   Issue type handling.
    *   Unit tests for issue management.
*   **Notes:**
    *   Ensure endpoints return JSON responses that mimic Jira API structure.
    *   Pay attention to error handling and validation for all endpoints.
    *   Consider pagination for list endpoints if necessary (though not explicitly requested initially).

### Epic: Issue Create Metadata

*   **Objective:** Implement API endpoint to retrieve issue create metadata, mimicking Jira's get issue create metadata endpoint.
*   **Tasks:**
    1.  Define Issue Create Metadata Structure: Determine the structure of the JSON response for issue create metadata.  Refer to Jira API documentation for structure.  Include essential fields like issue types, projects (though we will likely simplify projects to a single project for this task manager), and potentially fields. For now, focus on issue types. We have: Task, Subtask, Story, Bug, Epic.
    2.  Implement Get Issue Create Metadata Endpoint: Create a GET endpoint `/issue/createmeta`. This endpoint should return static JSON data representing issue create metadata. Include issue types (Task, Subtask, Story, Bug, Epic) and their allowed fields (summary, description, etc.). Keep it simple and directly related to the Issue Data Model we defined earlier. No need to fetch from database for this simplified version; return hardcoded metadata.
    3.  Write Unit Tests: Write Vitest unit tests for the get issue create metadata endpoint.
*   **Deliverables:**
    *   API endpoint for getting issue create metadata.
    *   Static JSON structure for issue create metadata.
    *   Unit tests for issue create metadata endpoint.
*   **Notes:**
    *   Mimic Jira API response structure for issue create metadata.
    *   Keep the metadata simple and focused on issue types and essential fields.
    *   No database interaction is needed for this epic, metadata is static.

### Epic: Epics Management (Get Epics)

*   **Objective:** Implement API endpoint to retrieve a list of epics. This is a simplified version, as we are not fully implementing Jira Epics functionality, but just the ability to retrieve issues of type 'Epic'.
*   **Tasks:**
    1.  Implement Get Epics Endpoint: Create a GET endpoint `/epics`. This endpoint should retrieve all issues from the database that have the issue type 'Epic'. Return a Jira-like JSON response containing a list of epics.
    2.  Update Issue Data Model and Create Issue Endpoint (if needed): Ensure that the Issue Data Model and Create Issue Endpoint correctly handle the 'Epic' issue type. This should already be covered in the 'Issue Management' epic, but double check.
    3.  Write Unit Tests: Write Vitest unit tests for the get epics endpoint.
*   **Deliverables:**
    *   API endpoint for getting epics.
    *   Functionality to retrieve issues of type 'Epic'.
    *   Unit tests for get epics endpoint.
*   **Notes:**
    *   This is a simplified 'Get Epics' functionality. Full Jira Epic features are not being implemented.
    *   Ensure the endpoint returns JSON responses that mimic Jira API structure where applicable.
    *   Pay attention to error handling and validation for the endpoint.

### Epic: Board Management

*   **Objective:** Implement API endpoints for managing boards and retrieving issues for a specific board.
*   **Tasks:**
    1.  Define Board Data Model: Create a Typescript interface or class to represent a board. Include fields based on Jira API and user request (board name, board type - To Do, In Progress, Done, status categories, etc.). Decide on data types for each field.
    2.  Implement Get Boards Endpoint (if needed): Decide if a "get all boards" endpoint is needed. For now, assume no, and focus on getting issues for a specific board. We can add this later if necessary.
    3.  Implement Get Issues for Board Endpoint: Create a GET endpoint `/board/{boardName}/issues`. Fetch issues from SQLite database that are associated with the specified board name. Use board names like 'To Do', 'In Progress', 'Done'. Issues should be associated with boards via a `statusCategory` field. Return Jira-like JSON response (list of issues).
    4.  Define Board Status Categories: Clearly define the status categories and their mapping to board names:
        *   To Do: open (11)
        *   In Progress: indeterminate (21)
        *   Done: done (31)
        Hardcode these mappings in the application logic initially.
    5.  Update Issue Data Model to include Status Category: Add a `statusCategory` field to the Issue data model (string or enum).
    6.  Update Create Issue Endpoint to handle Status Category: Ensure the create issue endpoint can accept and store the `statusCategory`.
    7.  Write Unit Tests: Write Vitest unit tests for the get issues for board endpoint.
*   **Deliverables:**
    *   Typescript data model for Board (initially minimal).
    *   API endpoint for get issues for board.
    *   Definition of board status categories and their mappings.
    *   Updated Issue data model with status category.
    *   Updated create issue endpoint to handle status category.
    *   Unit tests for board issue retrieval.
*   **Notes:**
    *   Focus on the 'get issues for board' functionality as requested.
    *   Keep board management simple initially.
    *   Ensure endpoints return JSON responses that mimic Jira API structure.
    *   Pay attention to error handling and validation for all endpoints.

### Epic: Attachment Management

*   **Objective:** Implement API endpoints for adding attachments to issues and retrieving attachments (though retrieval is not explicitly requested, it's implied).
*   **Tasks:**
    1.  Define Attachment Data Model: Create a Typescript interface or class to represent an attachment. Include fields: filename, file content (or path to file if storing in file system), issue ID, creation timestamp, mimetype, etc. Decide on how to store file content - directly in SQLite (BLOB) or in file system with path in SQLite. For simplicity, let's store file paths in SQLite and assume files are stored in a designated folder.
    2.  Implement Add Attachment Endpoint: Create a POST endpoint `/issue/{issueId}/attachment`. Request body should handle file upload (multipart/form-data). Store the uploaded file in a designated folder (e.g., `/usr/src/app/attachments`). Create an attachment record in SQLite, storing the file path and linking it to the issue ID. Return Jira-like JSON response with attachment metadata.
    3.  Implement Get Attachment (Optional, but good to include): Create a GET endpoint `/issue/{issueId}/attachment/{attachmentId}`. Fetch attachment metadata from SQLite. Read the file from the stored file path. Return the file content as a download (or JSON with file metadata and base64 encoded content - for simplicity, let's return file metadata and a download link if feasible, or just metadata if not). For now, let's just return metadata. Downloading file content is out of scope for now.
    4.  Update Issue Data Model to include Attachments: Add a field to the Issue data model to store a list of attachment IDs or attachment objects.
    5.  Write Unit Tests: Write Vitest unit tests for attachment upload and retrieval (metadata).
*   **Deliverables:**
    *   Typescript data model for Attachment.
    *   API endpoint for adding attachments to issues.
    *   API endpoint for retrieving attachment metadata.
    *   Updated Issue data model to include attachments.
    *   Unit tests for attachment management.
*   **Notes:**
    *   For simplicity, store attachment files in a folder and file paths in SQLite.
    *   Focus on metadata retrieval for attachments initially. File download can be added later if needed.
    *   Ensure endpoints return JSON responses that mimic Jira API structure where applicable.
    *   Pay attention to error handling and validation for all endpoints, especially file uploads.

### Epic: Issue Transitions and Assignee Updates

*   **Objective:** Implement API endpoints for transitioning issues between statuses and updating issue assignees.
*   **Tasks:**
    1.  Implement List Transitions Endpoint: Create a GET endpoint `/transitions`. This endpoint should return a static list of possible transitions. For now, these are implicit based on the board status categories: To Do -> In Progress, In Progress -> Done. We can expand on this later if needed, but for now, a simplified static list is sufficient. Return Jira-like JSON response listing available transitions.
    2.  Implement Transition Issue Endpoint: Create a POST endpoint `/issue/{issueId}/transitions`. Request body should specify the transition to perform (e.g., 'In Progress', 'Done'). Validate the requested transition is valid for the current issue status. Update the issue status in the SQLite database based on the transition. Consider triggering webhooks if issue status changes (issue updated event). Return Jira-like JSON response indicating success or failure.
    3.  Implement Update Assignee Endpoint: Create a PUT endpoint `/issue/{issueId}/assignee`. Request body should contain the assignee key. Validate the assignee key format (for now, just assume it's a string). Update the issue assignee in the SQLite database. Return Jira-like JSON response indicating success or failure.
    4.  Write Unit Tests: Write Vitest unit tests for all transition and assignee update endpoints and functionalities.
*   **Deliverables:**
    *   API endpoint for listing transitions.
    *   API endpoint for transitioning issues.
    *   API endpoint for updating issue assignee.
    *   Unit tests for issue transitions and assignee updates.
*   **Notes:**
    *   Keep transitions simple and based on board status categories for this iteration.
    *   Ensure endpoints return JSON responses that mimic Jira API structure where applicable.
    *   Pay attention to error handling and validation for all endpoints.
    *   Consider webhook triggering for issue status changes.
    *   For assignee, we are just using a key for now, no user management is required in this simplified task manager.

### Epic: Webhook Management

*   **Objective:** Implement webhook functionality to notify specified URLs when defined events occur, similar to Jira webhooks.
*   **Tasks:**
    1.  Define Webhook Data Model: Create a Typescript interface or class to represent a webhook. Include fields: webhook URL, event types to trigger on, secret (for security - optional for now but good to consider), id, etc. Decide on data types for each field. Consider what events should trigger webhooks (issue created, issue updated, issue deleted, issue transitioned, etc.). Start with issue created and issue updated.
    2.  Implement Register Webhook Endpoint: Create a POST endpoint `/webhook`. Validate request body (webhook URL, event types). Store webhook configuration in SQLite database. Return success response.
    3.  Implement Delete Webhook Endpoint: Create a DELETE endpoint `/webhook/{webhookId}`. Delete webhook configuration from SQLite database. Return success response.
    4.  Implement List Webhooks Endpoint: Create a GET endpoint `/webhook`. Retrieve all registered webhooks from SQLite database. Return Jira-like JSON response (list of webhooks).
    5.  Implement Webhook Event Handling: Modify issue creation, update, and delete logic to trigger webhook events. When an event occurs (e.g., issue created), fetch relevant webhooks from the database. For each webhook, send an HTTP POST request to the webhook URL with event data (Jira-like JSON payload). Consider background processing for webhook calls to avoid blocking API response. (For now, keep it simple and do it in the main thread, can improve later). Implement retry mechanism for failed webhook calls (optional for now).
    6.  Decide on Webhook Event Payload Structure: Define the JSON payload structure for webhook events. Mimic Jira webhook payloads structure. Include relevant issue data and event type in the payload.
    7.  Write Unit Tests: Write Vitest unit tests for webhook registration, deletion, listing, and event triggering. Mock HTTP requests to webhook URLs in tests.
*   **Deliverables:**
    *   Typescript data model for Webhook.
    *   API endpoints for register, delete, and list webhooks.
    *   Webhook event triggering and handling logic.
    *   Webhook event payload structure.
    *   Unit tests for webhook functionality.
*   **Notes:**
    *   Ensure endpoints return JSON responses that mimic Jira API structure where applicable (list webhooks).
    *   Pay attention to error handling and validation for all endpoints.
    *   Security considerations for webhooks (secret, HTTPS) can be added in later iterations.
    *   Start with basic event types (issue created, issue updated) and expand later.

## Technology Stack

*   Node.js
*   Typescript
*   Express
*   SQLite
*   Vitest
*   nodemon

## Development Process

*   Follow Agile methodologies.
*   Implement tasks in small, iterative cycles.
*   Prioritize tasks based on user value.
*   Regularly test and refactor code.
*   Use version control (e.g., Git) to manage code changes.

## Project Timeline (Example)

*   **Phase 1 (Project Setup & Core Functionality):** Epics: Project Setup and Core API, Issue Management, Issue Create Metadata, Epics Management (Get Epics). (Estimated Time: 2-3 weeks)
*   **Phase 2 (Advanced Features):** Epics: Board Management, Attachment Management, Issue Transitions and Assignee Updates, Webhook Management. (Estimated Time: 2-4 weeks)

## Testing

*   Write unit tests for all API endpoints and core functionalities.
*   Use Vitest for unit testing.
*   Focus on testing happy paths and edge cases.

## Error Handling and Validation

*   Implement proper error handling for all API endpoints.
*   Validate request bodies to ensure data integrity.
*   Return informative error messages in JSON format.

## Future Enhancements (Potential)

*   User authentication and authorization.
*   More sophisticated issue linking.
*   Advanced search and filtering capabilities.
*   Integration with external services.
*   More comprehensive Jira API compatibility.
