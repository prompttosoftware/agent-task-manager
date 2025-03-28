```markdown
# Agent Task Manager

## Description

A local task management application designed to mimic simplified Jira API responses for local hosting and speed. This project aims to provide a functional API for managing issues, boards, webhooks, and more, using Express.js, TypeScript, and SQLite.

## Features

*   **Issue Management:** Create, read, update, and delete issues. Transition issues between statuses. Find issues based on basic criteria.
*   **Board Management:** Retrieve boards and associated issues.
*   **Webhook Management:** Register, delete, and list webhooks for event notifications.
*   **Issue Linking:** Create, retrieve, and delete issue links.
*   **Attachment Management:** Add and retrieve attachments.
*   **Transition Metadata:** Retrieve available issue transitions and create metadata.
*   **Epic Management:** Retrieve epics.
*   **Update Assignee:** Update the assignee of an issue.

## API Endpoints

The following API endpoints are implemented. Detailed documentation for each endpoint is provided in the respective epic documentation.

### Issues

*   `POST /issues`: Create a new issue.
*   `GET /issues/:issueKey`: Get an issue by issue key.
*   `GET /issues/:issueId`: Get an issue by issue ID.
*   `PUT /issues/:issueId`: Update an existing issue.
*   `DELETE /issues/:issueId`: Delete an issue.
*   `POST /issues/:issueId/transitions`: Transition an issue to a new status.
*   `POST /issues/find`: Find issues based on criteria (exact match).
*   `PUT /issues/:issueId/assignee`: Update the assignee of an issue.

### Boards

*   `GET /boards`: Get all boards.
*   `GET /boards/:boardId/issues`: Get issues for a specific board.

### Webhooks

*   `POST /webhooks`: Register a new webhook.
*   `DELETE /webhooks/:webhookId`: Delete a webhook.
*   `GET /webhooks`: List all registered webhooks.

### Issue Links

*   `POST /issuelinks`: Create a new issue link.
*   `GET /issuelinks/:linkId`: Get an issue link by ID.
*   `DELETE /issuelinks/:linkId`: Delete an issue link.

### Attachments

*   `POST /issues/:issueId/attachments`: Add a new attachment to an issue.
*   `GET /attachments/:attachmentId`: Get an attachment by ID.
*   `GET /issues/:issueId/attachments`: Get all attachments for an issue.

### Transitions and Metadata

*   `GET /transitions/:issueId`: List available transitions for a specific issue.
*   `GET /issues/createMetadata`: Get issue create metadata.

### Epics

*   `GET /epics`: Get all epics.
*   `GET /epics/:epicId`: Get epic details by ID.

## Project Structure

```
agent-task-manager/
├── plan/                     # Contains project plans, divided by epic.
├── src/
│   ├── controllers/          # API endpoint handlers
│   ├── db.ts                 # Database connection and utility functions
│   ├── models/               # Data models (e.g., Issue, Board, User)
│   ├── repositories/         # Data access objects (DAOs) and repositories
│   ├── services/             # Business logic and service layer
│   ├── index.ts              # Main application entry point (Express server)
│   └── ...                   # Other service and utility files
├── logs/                     # Application logs
├── db/                       # Database files (schema.sql)
├── tests/                    # Unit tests using Vitest
├── schema.sql                # Database schema definition
├── .env                      # Environment variables (if applicable)
├── package.json              # Node.js project dependencies and scripts
├── tsconfig.json             # TypeScript compiler configuration
├── README.md                 # This file
└── ...
```

## Prerequisites

*   Node.js (v16 or higher recommended)
*   npm or yarn

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd agent-task-manager
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```
    or
    ```bash
    yarn install
    ```

3.  **Create the database schema:**  The `schema.sql` file in the `db` directory will be used to create the database.  This will happen automatically when the server starts, or can be run manually using a tool like `sqlite3`.

## Running the Application

1.  **Start the development server:**

    ```bash
    npm run dev
    ```

    This command will:
    *   Compile the TypeScript code.
    *   Start the Express.js server.
    *   Restart the server automatically on code changes (using Nodemon).

    Alternatively, you can build and run the application:
    ```bash
    npm run build
    npm run start
    ```

2.  **Access the API:** The application will typically run on `http://localhost:3000` (or a port defined in your environment variables).  Use a tool like `curl`, Postman, or Insomnia to interact with the API endpoints.

## Testing

1.  **Run unit tests:**

    ```bash
    npm run test
    ```
    This command will execute the unit tests using `vitest`.  Test files are located in the `tests` directory.

## Technologies Used

*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web application framework.
*   **TypeScript:** Superset of JavaScript for static typing.
*   **SQLite:**  Lightweight, file-based database.
*   **Vitest:**  Unit testing framework.
*   **Nodemon:** Utility to automatically restart the server on file changes during development.
*   **Concurrently:** Utility to run multiple npm scripts concurrently.

## Contributing

Contributions are welcome. Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them.
4.  Write unit tests for your changes.
5.  Submit a pull request.

## Future Enhancements

*   Advanced search and filtering capabilities.
*   Pagination for issue lists.
*   Issue history tracking.
*   Notifications for issue changes (e.g., email, Slack).
*   Complex workflow engine for transitions.
*   Webhook retries and dead-letter queues.
*   User management.
*   Attachment storage mechanisms other than local file storage.
*   More robust security and authentication.
