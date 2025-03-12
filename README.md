# Agent Task Manager

## Installation

1.  Clone the repository: `git clone <repository_url>`
2.  Navigate to the project directory: `cd agent-task-manager`
3.  Install dependencies: `npm install`

## Usage

1.  Start the server: `npm start`
2.  Access the API endpoints. See API documentation below.

## API Documentation

### Webhooks

*   `POST /webhooks` - Creates a new webhook.
*   `GET /webhooks` - Retrieves all webhooks.
*   `GET /webhooks/{webhookId}` - Retrieves a specific webhook by ID.
*   `PUT /webhooks/{webhookId}` - Updates a specific webhook.
*   `DELETE /webhooks/{webhookId}` - Deletes a specific webhook.

### Issues

*   `POST /issues` - Creates a new issue.
*   `GET /issues` - Retrieves all issues.
*   `GET /issues/{issueId}` - Retrieves a specific issue by ID.
*   `PUT /issues/{issueId}` - Updates a specific issue.
*   `DELETE /issues/{issueId}` - Deletes a specific issue.
*   `POST /issues/{issueId}/attachments` - Adds an attachment to an issue.
*   `GET /issues/{issueId}/transitions` - Lists available transitions for an issue.
*   `POST /issues/{issueId}/transitions` - Transitions an issue.

### Boards

*   `GET /boards` - Retrieves all boards.
*   `GET /boards/{boardId}` - Retrieves a specific board by ID.
*   `PUT /boards/{boardId}` - Updates a specific board.
*   `POST /boards/{boardId}/issues` - Adds an issue to a board.
*   `DELETE /boards/{boardId}/issues/{issueId}` - Removes an issue from a board.

