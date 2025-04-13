# Agent Task Manager

This is the Agent Task Manager project, designed for local task management.

## Project Structure

The project structure is as follows:

```
agent-task-manager/
├── data/               # Contains the SQLite database file.
│   └── task_manager.db
├── src/                # Source code directory.
│   ├── api/            # API related code.
│   │   ├── controllers/ # API controllers.
│   │   ├── routes/      # API routes.
│   │   └── ...
│   ├── config/         # Configuration files.
│   ├── data/           # Database related code.
│   ├── middleware/     # Middleware functions.
│   ├── services/       # Business logic and services.
│   ├── signoff/        # Signoff related code
│   ├── types/          # Type definitions.
│   └── validators/     # Input validation.
├── api_issue_controller_test_script.sh
├── api_test_script.sh
├── jest.config.js      # Jest configuration file.
├── LICENSE             # License file.
├── package-lock.json   # npm package lock file.
├── package.json        # npm package file.
├── PULL_REQUEST_DESCRIPTION.md # Pull request description template.
├── README_pm2.md       # PM2 setup and usage instructions.
└── README.md           # This README file.
```

## API Endpoints

### Issues

*   `GET /api/issues/search?query={query}` - Searches issues by title and description.
*   `GET /api/issues/{issueKey}` - Retrieves a specific issue by key.
*   `GET /api/issues/board/{boardId}` - Retrieves issues associated with a board.
*   `POST /api/issues` - Creates a new issue.
*   `PUT /api/issues/{issueKey}` - Updates an existing issue.
*   `DELETE /api/issues/{issueKey}` - Deletes an issue.
*   `POST /api/issues/{issueKey}/attachments` - Adds an attachment to an issue.
*   `POST /api/issues/{fromIssueKey}/link` - Links two issues.
*   `POST /api/issues/{issueKey}/assign` - Assigns an issue to a user.
*   `POST /api/issues/{issueKey}/transition` - Transitions an issue to a new status.
*   `GET /api/issues/createmeta` - Gets the metadata required to create an issue.
*   `GET /api/issues/{issueKey}/transitions` - Gets the available transitions for an issue.

### Boards

*   `GET /api/boards` - Retrieves all boards.
*   `GET /api/boards/{boardId}` - Retrieves a specific board.
*   `POST /api/boards` - Creates a new board.
*   `PUT /api/boards/{boardId}` - Updates an existing board.
*   `DELETE /api/boards/{boardId}` - Deletes a board.

### Epics

*   `GET /api/epics` - Retrieves all epics.
*   `GET /api/epics/{epicKey}` - Retrieves a specific epic.
*   `POST /api/epics` - Creates a new epic.
*   `PUT /api/epics/{epicKey}` - Updates an existing epic.
*   `DELETE /api/epics/{epicKey}` - Deletes an epic.

## Database Schema

The application uses an SQLite database. The schema includes the following tables:

### Issues

*   `issueKey` (TEXT, PRIMARY KEY)
*   `title` (TEXT)
*   `description` (TEXT)
*   `boardId` (TEXT)
*   `status` (TEXT)
*   `reporter` (TEXT)
*   `assignee` (TEXT)
*   `createdAt` (TEXT)
*   `updatedAt` (TEXT)

### Boards

*   `boardId` (TEXT, PRIMARY KEY)
*   `name` (TEXT)
*   `description` (TEXT)
*   `createdAt` (TEXT)
*   `updatedAt` (TEXT)

### Epics

*   `epicKey` (TEXT, PRIMARY KEY)
*   `name` (TEXT)
*   `description` (TEXT)
*   `createdAt` (TEXT)
*   `updatedAt` (TEXT)

## Setup and Deployment

1.  **Prerequisites:**

    *   Node.js and npm installed.
    *   SQLite3 installed.

2.  **Installation:**

    *   Clone the repository.
    *   Run `npm install` to install dependencies.

3.  **Running the Application:**

    *   Run `npm start` to start the application in development mode.
    *   The application will be available at `http://localhost:3000`.

4.  **Deployment:**

    *   For production, you can build the project using `npm run build`.
    *   Use a process manager like `pm2` to run the built application. See `README_pm2.md` for details.
    *   Ensure the database file (`data/task_manager.db`) is accessible.

##  Testing

*   Run `npm test` to execute unit tests.

## Technologies Used

*   Node.js
*   Express.js
*   SQLite3
*   TypeScript

## Monitoring

This project uses `pm2` for basic monitoring.  `pm2` ensures the process is running and provides logging capabilities. See `README_pm2.md` for details on setting up and using `pm2`.

## Development

### Dependencies

The project uses the following dependencies:

*   express
*   sqlite3
*   typescript
*   @types/express
*   @types/node
*   uuid
*   multer
*   express-validator

### Scripts

*   `npm start`: Starts the application in development mode.
*   `npm run build`: Builds the TypeScript code.
*   `npm test`: Runs the unit tests.
*   `npm run lint`: Runs ESLint for code style checking.

