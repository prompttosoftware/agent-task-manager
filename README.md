# Agent Task Manager

## Tagline
Local Task Manager mimicking Jira API for Agent Teams.

## Description
This project is a local task manager designed to mimic a simplified Jira-like API for agent teams. It provides features such as boards, labels, and webhooks. The project is packaged as an npm package named `agent-task-manager`.

## Setup Instructions

### Prerequisites
- Node.js
- npm

### Installation
```bash
npm install agent-task-manager
```

### Running the Server

To run the server, you can use either a programmatic approach or a command-line script.  The following examples are illustrative and depend on the actual entry point of the application.

**Example (Programmatic):**
```javascript
const { startServer } = require('agent-task-manager'); // Assuming this is the export

startServer({ host: 'localhost', port: 3000 });
```

**Example (Command-Line - Placeholder):**
```bash
# Placeholder - create a script to start the server
# Example command (this is just an illustration):
# node ./start-server.js --host localhost --port 3000
```

Configure host and port as needed (e.g., via environment variables or command-line arguments).

## API Documentation

### Issue Resource

#### GET /issues
- **Description:** Retrieves all issues.
- **Method:** GET
- **Parameters:** None
- **Request Body Schema:** None
- **Response Codes:**
  - 200 OK: Returns an array of issue objects.
- **Response Body Schema:**
```json
[
  {
    "id": "string",
    "summary": "string",
    "description": "string",
    "status": "string",
    "labels": ["string"],
    "board": "string",
    "created": "string",
    "updated": "string"
  }
]
```
- **Example Request:**
```bash
curl http://localhost:3000/issues
```
- **Example Response:**
```json
[
    {
        "id": "1",
        "summary": "Implement feature X",
        "description": "Detailed description of the feature",
        "status": "To Do",
        "labels": ["Dev"],
        "board": "To Do",
        "created": "2024-01-01T12:00:00.000Z",
        "updated": "2024-01-02T10:00:00.000Z"
    }
]
```

#### GET /issues/{issueId}
- **Description:** Retrieves a specific issue by ID.
- **Method:** GET
- **Path:** `/issues/{issueId}`
- **Parameters:**
  - `issueId` (path): The ID of the issue.
- **Request Body Schema:** None
- **Response Codes:**
  - 200 OK: Returns the issue object.
  - 404 Not Found: If the issue is not found.
- **Response Body Schema:**
```json
{
  "id": "string",
  "summary": "string",
  "description": "string",
  "status": "string",
  "labels": ["string"],
  "board": "string",
  "created": "string",
  "updated": "string"
}
```
- **Example Request:**
```bash
curl http://localhost:3000/issues/1
```
- **Example Response:**
```json
{
  "id": "1",
  "summary": "Implement feature X",
  "description": "Detailed description of the feature",
  "status": "To Do",
  "labels": ["Dev"],
  "board": "To Do",
  "created": "2024-01-01T12:00:00.000Z",
  "updated": "2024-01-02T10:00:00.000Z"
}
```

#### POST /issues
- **Description:** Creates a new issue.
- **Method:** POST
- **Path:** `/issues`
- **Parameters:** None
- **Request Body Schema:**
```json
{
  "summary": "string",
  "description": "string",
  "status": "string",
  "labels": ["string"],
  "board": "string"
}
```
- **Response Codes:**
  - 201 Created: Returns the created issue object.
  - 400 Bad Request: If the request body is invalid.
- **Response Body Schema:**
```json
{
  "id": "string",
  "summary": "string",
  "description": "string",
  "status": "string",
  "labels": ["string"],
  "board": "string",
  "created": "string",
  "updated": "string"
}
```
- **Example Request:**
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "summary": "Fix bug",
  "description": "Detailed description of the bug",
  "status": "To Do",
  "labels": ["Test"],
  "board": "To Do"
}' http://localhost:3000/issues
```
- **Example Response:**
```json
{
  "id": "2",
  "summary": "Fix bug",
  "description": "Detailed description of the bug",
  "status": "To Do",
  "labels": ["Test"],
  "board": "To Do",
  "created": "2024-01-02T14:00:00.000Z",
  "updated": "2024-01-02T14:00:00.000Z"
}
```

#### PUT /issues/{issueId}
- **Description:** Updates an existing issue.
- **Method:** PUT
- **Path:** `/issues/{issueId}`
- **Parameters:**
  - `issueId` (path): The ID of the issue.
- **Request Body Schema:**
```json
{
  "summary": "string",
  "description": "string",
  "status": "string",
  "labels": ["string"],
  "board": "string"
}
```
- **Response Codes:**
  - 200 OK: Returns the updated issue object.
  - 400 Bad Request: If the request body is invalid.
  - 404 Not Found: If the issue is not found.
- **Response Body Schema:**
```json
{
  "id": "string",
  "summary": "string",
  "description": "string",
  "status": "string",
  "labels": ["string"],
  "board": "string",
  "created": "string",
  "updated": "string"
}
```
- **Example Request:**
```bash
curl -X PUT -H "Content-Type: application/json" -d '{
  "summary": "Fix bug (updated)",
  "description": "Updated bug description",
  "status": "In Progress",
  "labels": ["Test"],
  "board": "In Progress"
}' http://localhost:3000/issues/2
```
- **Example Response:**
```json
{
  "id": "2",
  "summary": "Fix bug (updated)",
  "description": "Updated bug description",
  "status": "In Progress",
  "labels": ["Test"],
  "board": "In Progress",
  "created": "2024-01-02T14:00:00.000Z",
  "updated": "2024-01-02T15:00:00.000Z"
}
```

#### DELETE /issues/{issueId}
- **Description:** Deletes an issue.
- **Method:** DELETE
- **Path:** `/issues/{issueId}`
- **Parameters:**
  - `issueId` (path): The ID of the issue.
- **Request Body Schema:** None
- **Response Codes:**
  - 204 No Content: If the issue is successfully deleted.
  - 404 Not Found: If the issue is not found.
- **Response Body Schema:** None
- **Example Request:**
```bash
curl -X DELETE http://localhost:3000/issues/2
```
- **Example Response:**
```bash
# No content
```

### Board Resource

#### GET /boards
- **Description:** Retrieves all boards.
- **Method:** GET
- **Parameters:** None
- **Request Body Schema:** None
- **Response Codes:**
  - 200 OK: Returns an array of board objects.
- **Response Body Schema:**
```json
[
  {
    "id": "string",
    "name": "string",
    "statusIds": ["string"]
  }
]
```
- **Example Request:**
```bash
curl http://localhost:3000/boards
```
- **Example Response:**
```json
[
  {
    "id": "1",
    "name": "To Do",
    "statusIds": ["1"]
  },
  {
    "id": "2",
    "name": "In Progress",
    "statusIds": ["2"]
  },
  {
    "id": "3",
    "name": "Done",
    "statusIds": ["3"]
  }
]
```

### Webhook Resource

#### POST /webhooks
- **Description:** Registers a new webhook.
- **Method:** POST
- **Path:** `/webhooks`
- **Parameters:** None
- **Request Body Schema:**
```json
{
  "url": "string",
  "eventTypes": ["string"], // e.g., "issue_created", "issue_updated"
  "filter": {
    "issue": {
      "status": ["string"], // e.g., "To Do", "In Progress"
      "labels": ["string"]
    }
  }
}
```
- **Response Codes:**
  - 201 Created: Returns the created webhook object.
  - 400 Bad Request: If the request body is invalid.
- **Response Body Schema:**
```json
{
  "id": "string",
  "url": "string",
  "eventTypes": ["string"],
  "filter": {
    "issue": {
      "status": ["string"],
      "labels": ["string"]
    }
  }
}
```
- **Example Request:**
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "url": "https://example.com/webhook",
  "eventTypes": ["issue_created", "issue_updated"],
  "filter": {
    "issue": {
      "status": ["In Progress"],
      "labels": ["Dev"]
    }
  }
}' http://localhost:3000/webhooks
```
- **Example Response:**
```json
{
  "id": "1",
  "url": "https://example.com/webhook",
  "eventTypes": ["issue_created", "issue_updated"],
  "filter": {
    "issue": {
      "status": ["In Progress"],
      "labels": ["Dev"]
    }
  }
}
```

#### GET /webhooks
- **Description:** Retrieves all registered webhooks.
- **Method:** GET
- **Path:** `/webhooks`
- **Parameters:** None
- **Request Body Schema:** None
- **Response Codes:**
  - 200 OK: Returns an array of webhook objects.
- **Response Body Schema:**
```json
[
  {
    "id": "string",
    "url": "string",
    "eventTypes": ["string"],
    "filter": {
      "issue": {
        "status": ["string"],
        "labels": ["string"]
      }
    }
  }
]
```
- **Example Request:**
```bash
curl http://localhost:3000/webhooks
```
- **Example Response:**
```json
[
  {
    "id": "1",
    "url": "https://example.com/webhook",
    "eventTypes": ["issue_created", "issue_updated"],
    "filter": {
      "issue": {
        "status": ["In Progress"],
        "labels": ["Dev"]
      }
    }
  }
]
```

#### DELETE /webhooks/{webhookId}
- **Description:** Deletes a webhook.
- **Method:** DELETE
- **Path:** `/webhooks/{webhookId}`
- **Parameters:**
  - `webhookId` (path): The ID of the webhook.
- **Request Body Schema:** None
- **Response Codes:**
  - 204 No Content: If the webhook is successfully deleted.
  - 404 Not Found: If the webhook is not found.
- **Response Body Schema:** None
- **Example Request:**
```bash
curl -X DELETE http://localhost:3000/webhooks/1
```
- **Example Response:**
```bash
# No content
```

## Data Storage (In-Memory)

The current implementation utilizes in-memory storage. This means that all data is lost when the server is restarted.  Data persistence is not yet implemented.

## Labels and Boards

### Labels

- `Test`
- `Dev`

### Boards

- `To Do` (Status ID: 1)
- `In Progress` (Status ID: 2)
- `Done` (Status ID: 3)

## Webhooks

### Registering Webhooks

Use the `POST /webhooks` endpoint.  Provide the webhook URL, event types, and filter criteria in the request body (see API documentation above).

### Webhook Event Types

- `issue_created`
- `issue_updated`
- `issue_deleted` (Not yet implemented)

### Filtering

Webhooks can be filtered based on issue status and labels.

### Webhook Payload Structure

When an event occurs, the registered webhook will receive a JSON payload containing details about the event. Example:

```json
{
  "eventType": "issue_created",
  "issue": {
    "id": "1",
    "summary": "New issue",
    "description": "Description",
    "status": "To Do",
    "labels": ["Dev"]
    // ... other issue fields
  }
}
```

### Deleting Webhooks

Use the `DELETE /webhooks/{webhookId}` endpoint.

## License

This project is licensed under the [LICENSE](LICENSE) file.
