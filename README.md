# Agent Task Manager

## Description

The Agent Task Manager is a project designed to implement a simplified task management system with API endpoints, a database, and webhook functionality. It aims to provide a core set of features similar to Jira but on a smaller scale.

## Epics and Progress

The following table summarizes the implemented epics and their status:

| Epic                                     | Status      | Tasks Completed                                                                                                                                                                                                      | Next Epic                                    |
| :--------------------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| Epic 1: Database Setup                   | Implemented | Database schema defined, `better-sqlite3` library installed, database connection module created.                                                                                                                    | Epic 10: Implementation - API Endpoints Issues |
| Epic 2: API Endpoints - Issues           | Implemented | API endpoints for issue-related operations implemented (GET /issues/search, GET /issues/:issueKey, GET /boards/:boardId/issues, POST /issues, PUT /issues/:issueKey, DELETE /issues/:issueKey, POST /issues/:issueKey/transitions, POST /issues/:issueKey/attachments, POST /issuelinks, PUT /issues/:issueKey/assignee, GET /issue/createmeta, GET /issues/:issueKey/transitions).                                                                                                                                                                                                       | Epic 11: Implementation - API Endpoints Boards |
| Epic 3: API Endpoints - Boards           | Implemented | API endpoints for board-related operations implemented (GET /boards/:boardId, GET /boards, POST /boards, PUT /boards/:boardId, DELETE /boards/:boardId).                                                                                                                                                                                                              | Epic 12: Implementation - API Endpoints Webhooks |
| Epic 4: API Endpoints - Webhooks          | Implemented | API endpoints for webhook-related operations implemented (POST /webhooks, DELETE /webhooks/:webhookId, GET /webhooks).                                                                                                                                                                                                                       | Epic 13: Implementation - API Endpoints Epics |
| Epic 5: API Endpoints - Epics            | Implemented | API endpoints for epic-related operations implemented (GET /epics/:epicKey, GET /epics, POST /epics, PUT /epics/:epicKey, DELETE /epics/:epicKey, GET /epics/:epicKey/issues).                                                                                                                                                                                                                 | Epic 14: Implementation - Webhook Processing |
| Epic 6: Development Environment Setup    | Implemented | Project initialized, dependencies installed, Typescript, ESLint, Prettier, and npm scripts configured. Basic project structure created.                                                                           | Epic 10: Implementation - API Endpoints Issues |
| Epic 7: Webhook Processing              | Implemented | Webhook processing mechanism implemented, including in-memory queue, and webhook triggering from issue service functions.                                                                                                           | Epic 15: Testing and Integration            |
| Epic 8: Implementation - Database Setup | Implemented | Implemented the database setup plan including creating the directory and the file for database                                                                                                            | Epic 10: Implementation - API Endpoints Issues |
| Epic 9: Implementation - Development Environment Setup | Implemented | Implemented the development environment setup, including project setup, dependencies installed, and configuration.                                                                                                     | Epic 10: Implementation - API Endpoints Issues |
| Epic 10: Implementation - API Endpoints Issues | Implemented | Implemented the API endpoints and related files for issues.                                                                                                                                                                  | Epic 11: Implementation - API Endpoints Boards |
| Epic 11: Implementation - API Endpoints Boards | Implemented | Implemented the API endpoints and related files for boards.                                                                                                                                                                  | Epic 12: Implementation - API Endpoints Webhooks |
| Epic 12: Implementation - API Endpoints Webhooks | Implemented | Implemented the API endpoints and related files for webhooks.                                                                                                                                                                  | Epic 13: Implementation - API Endpoints Epics |
| Epic 13: Implementation - API Endpoints Epics | Implemented | Implemented the API endpoints and related files for epics.                                                                                                                                                                  | Epic 14: Implementation - Webhook Processing |
| Epic 14: Implementation - Webhook Processing | Implemented | Implemented the webhook processing logic.                                                                                                                                                                  | Epic 15: Testing and Integration |
| Epic 15: Testing and Integration           | Implemented | Unit tests, integration tests and manual testing completed.  | Epic 16: Deployment and Configuration |
| Epic 16: Deployment and Configuration    | Implemented | Deployment strategy, configuration management, and startup scripts/processes defined.   | Epic 17: Final Testing and Refinement |
| Epic 17: Final Testing and Refinement      | Implemented | Comprehensive testing, bug fixing, documentation update, and code refinement completed. | Epic 18: Project Completion |
| Epic 18: Project Completion               | Implemented | Final code review, documentation finalization, project sign-off, clean-up and organization.          | N/A                                      |

## Technologies Used

*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web application framework for Node.js.
*   **TypeScript:** Superset of JavaScript for static typing.
*   **better-sqlite3:** SQLite library for Node.js.
*   **vitest:** Testing framework.
*   **npm:** Package manager for Node.js.

## Project Structure

```
Agent-Task-Manager/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── board.routes.ts
│   │   │   ├── epic.routes.ts
│   │   │   ├── issue.routes.ts
│   │   │   └── webhook.routes.ts
│   │   ├── controllers/
│   │   │   ├── board.controller.ts
│   │   │   ├── epic.controller.ts
│   │   │   ├── issue.controller.ts
│   │   │   └── webhook.controller.ts
│   ├── services/
│   │   ├── board.service.ts
│   │   ├── epic.service.ts
│   │   ├── issue.service.ts
│   │   └── webhook.service.ts
│   ├── types/
│   │   ├── board.d.ts
│   │   ├── epic.d.ts
│   │   ├── issue.d.ts
│   │   └── webhook.d.ts
│   ├── db/
│   │   └── database.ts
│   └── index.ts
├── dist/           # Compiled output
├── data/           # Database file
│   └── task_manager.db
├── tests/
│   ├── board.test.ts
│   ├── epic.test.ts
│   ├── issue.test.ts
│   └── webhook.test.ts
├── logs/
├── .eslintrc.js
├── .prettierrc.js
├── tsconfig.json
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

*   Node.js (version 18 or higher recommended)
*   npm (Node Package Manager)

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    cd <project_directory>
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

### Running the Application

1.  Build the project:

    ```bash
    npm run build
    ```

2.  Run the development server:

    ```bash
    npm run dev
    ```

    This will start the server using `ts-node-dev`, which automatically restarts the server on code changes.

    Alternatively, start the application with:
    ```bash
    npm start
    ```

### Testing

Run the tests using:

```bash
npm test
```

### API Documentation

API documentation is available in the `src/api` directory.  Consider using tools like Swagger/OpenAPI for auto-generating documentation in a future iteration.

## Configuration

The application is configured using environment variables.

*   `PORT`: The port the server will listen on (default: 3000).
*   `DATABASE_PATH`: The path to the SQLite database file (default: `./data/task_manager.db`).

Set environment variables before running the application.  Example:

```bash
PORT=4000 npm run dev
```

## Further Development

*   **Implement User Authentication and Authorization:** Add user accounts and role-based access control.
*   **Advanced Webhook Features:** Implement retry mechanisms, error handling, and more sophisticated queueing mechanisms for webhooks.
*   **Performance Optimization:** Optimize database queries and API endpoints for performance.
*   **Implement Frontend:** Create a user interface for easier interaction with the application.
*   **Add more advanced features:**  Add subtasks, comments, and other Jira-like features.
*   **Refine Testing:** Add E2E tests.

## Contributing

Contributions are welcome. Please submit pull requests with clear descriptions of your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (if one exists, but in this local context it is not critical).