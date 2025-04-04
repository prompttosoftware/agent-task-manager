# API Documentation

This document outlines the API endpoints available in the Agent Task Manager.

## Issue Endpoints

### POST /issues

*   **Description:** Creates a new issue.
*   **Request Body:**
    *   `summary`: (string, required) The summary of the issue.
    *   `description`: (string, optional) The description of the issue.
    *   `issueType`: (string, required) The type of the issue.
    *   `project`: (string, required) The project the issue belongs to.
*   **Request Example:**
```json
{
  "summary": "Fix bug",
  "description": "The application crashes when...",
  "issueType": "Bug",
  "project": "ProjectA"
}
```
*   **Response:**
    *   201 Created:  Issue created successfully. Returns the created issue object.
    *   **Response Example:**
```json
{
  "id": "some-unique-id",
  "summary": "Fix bug",
  "description": "The application crashes when...",
  "issueType": "Bug",
  "project": "ProjectA",
  "createdAt": "2024-10-27T10:00:00.000Z"
}
```
    *   400 Bad Request: Validation errors.  Returns an array of error messages.
    *   **Response Example:**
```json
[
  {
    "property": "summary",
    "constraints": {
      "isNotEmpty": "summary should not be empty"
    }
  }
]
```
    *   500 Internal Server Error:  Server error. Returns an error message.

### GET /epics/:epicKey/issues

*   **Description:** Retrieves issues associated with an epic.
*   **Parameters:**
    *   `epicKey`: (string, required) The key of the epic.
*   **Response:**
    *   200 OK: Returns an array of issues.
    *   400 Bad Request: Invalid epic key.
    *   404 Not Found: Epic not found.
    *   500 Internal Server Error: Server error.

### GET /epics/:epicKey

*   **Description:** Retrieves an epic by its key.
*   **Parameters:**
    *   `epicKey`: (string, required) The key of the epic.
*   **Response:**
    *   200 OK: Returns the epic object.
    *   400 Bad Request: Invalid epic key.
    *   404 Not Found: Epic not found.
    *   500 Internal Server Error: Server error.

### GET /epics

*   **Description:** Retrieves all epics.
*   **Response:**
    *   200 OK: Returns an array of epic objects.
    *   500 Internal Server Error: Server error.

### POST /epics

*   **Description:** Creates a new epic.
*   **Request Body:**
    *   `key`: (string, required) The key of the epic.
    *   `name`: (string, required) The name of the epic.
*   **Request Example:**
```json
{
  "key": "EPIC-123",
  "name": "New Epic"
}
```
*   **Response:**
    *   201 Created: Epic created successfully. Returns the created epic object.
    *   400 Bad Request: Validation errors.
    *   500 Internal Server Error: Server error.

### PUT /epics/:epicKey

*   **Description:** Updates an existing epic.
*   **Parameters:**
    *   `epicKey`: (string, required) The key of the epic.
*   **Request Body:**
    *   `key`: (string, optional) The key of the epic. If provided, the key will be updated.
    *   `name`: (string, optional) The name of the epic. If provided, the name will be updated.
*   **Request Example:**
```json
{
  "name": "Updated Epic Name"
}
```
*   **Response:**
    *   200 OK: Epic updated successfully. Returns the updated epic object.
    *   400 Bad Request: Validation errors.
    *   404 Not Found: Epic not found.
    *   500 Internal Server Error: Server error.

### DELETE /epics/:epicKey

*   **Description:** Deletes an epic.
*   **Parameters:**
    *   `epicKey`: (string, required) The key of the epic.
*   **Response:**
    *   204 No Content: Epic deleted successfully.
    *   400 Bad Request: Invalid epic key.
    *   404 Not Found: Epic not found.
    *   500 Internal Server Error: Server error.

### GET /boards/:boardId

*   **Description:** Retrieves a board by its ID.
*   **Parameters:**
    *   `boardId`: (integer, required) The ID of the board.
*   **Response:**
    *   200 OK: Returns the board object.
    *   400 Bad Request: Invalid board ID.
    *   404 Not Found: Board not found.
    *   500 Internal Server Error: Server error.

### DELETE /boards/:boardId

*   **Description:** Deletes a board.
*   **Parameters:**
    *   `boardId`: (integer, required) The ID of the board.
*   **Response:**
    *   204 No Content: Board deleted successfully.
    *   400 Bad Request: Invalid board ID.
    *   404 Not Found: Board not found.
    *   500 Internal Server Error: Server error.

### POST /boards

*   **Description:** Creates a new board.
*   **Request Body:**
    *   `name`: (string, required) The name of the board.
    *   `description`: (string, optional) The description of the board.
*   **Request Example:**
```json
{
  "name": "New Board",
  "description": "This is a new board."
}
```
*   **Response:**
    *   201 Created: Board created successfully. Returns the created board object.
    *   400 Bad Request: Validation errors.
    *   500 Internal Server Error: Server error.

### PUT /boards/:boardId

*   **Description:** Updates an existing board.
*   **Parameters:**
    *   `boardId`: (integer, required) The ID of the board.
*   **Request Body:**
    *   `name`: (string, optional) The name of the board. If provided, the name will be updated.
    *   `description`: (string, optional) The description of the board. If provided, the description will be updated.
*   **Request Example:**
```json
{
  "name": "Updated Board Name"
}
```
*   **Response:**
    *   200 OK: Board updated successfully. Returns the updated board object.
    *   400 Bad Request: Validation errors.
    *   404 Not Found: Board not found.
    *   500 Internal Server Error: Server error.
