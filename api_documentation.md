# API Documentation

This document outlines the request and response formats for each API endpoint, database schema, setup, and deployment instructions, and a user guide.

## 1. Issue Endpoints

### 1.1 Create Issue

*   **Endpoint:** `/api/issue` (POST)
*   **Request Format:**
    ```json
    {
      "summary": "Issue Summary",
      "description": "Issue Description",
      "issueType": "Task",
      "priority": "High",
      "epicKey": "ATM-964"
    }
    ```
*   **Response Format:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "key": "ATM-123",
      "summary": "Issue Summary",
      "status": "Open"
    }
    ```

### 1.2 Get Issue

*   **Endpoint:** `/api/issue/{issueKey}` (GET)
*   **Request Format:** None. The `issueKey` is part of the URL.
*   **Response Format:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "key": "ATM-123",
      "summary": "Issue Summary",
      "description": "Issue Description",
      "issueType": "Task",
      "status": "Open",
      "priority": "High",
      "epicKey": "ATM-964"
    }
    ```

### 1.3 Update Issue

*   **Endpoint:** `/api/issue/{issueKey}` (PUT)
*   **Request Format:**
    ```json
    {
      "summary": "Updated Issue Summary",
      "description": "Updated Issue Description",
      "status": "In Progress",
      "priority": "High",
      "issueType": "Task"
    }
    ```
*   **Response Format:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "key": "ATM-123",
      "summary": "Updated Issue Summary",
      "status": "In Progress"
    }
    ```

### 1.4 Delete Issue

*   **Endpoint:** `/api/issue/{issueKey}` (DELETE)
*   **Request Format:** None. The `issueKey` is part of the URL.
*   **Response Format:**
    ```json
    {
      "message": "Issue ATM-123 deleted successfully"
    }
    ```

## 2. Board Endpoints

### 2.1 Get Boards

*   **Endpoint:** `/api/board` (GET)
*   **Request Format:** None.
*   **Response Format:**
    ```json
    [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Board 1",
        "issues": ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
      }
    ]
    ```

### 2.2 Create Board

*   **Endpoint:** `/api/board` (POST)
*   **Request Format:**
    ```json
    {
      "name": "New Board Name",
      "description": "Board Description"
    }
    ```
*   **Response Format:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "New Board Name"
    }
    ```

### 2.3 Get Board

*   **Endpoint:** `/api/board/{boardId}` (GET)
*   **Request Format:** None. The `boardId` is part of the URL.
*   **Response Format:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Board 1",
      "issues": ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
    }
    ```

### 2.4 Update Board

*   **Endpoint:** `/api/board/{boardId}` (PUT)
*   **Request Format:**
    ```json
    {
      "name": "Updated Board Name",
      "description": "Board Description"
    }
    ```
*   **Response Format:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Updated Board Name"
    }
    ```

### 2.5 Delete Board

*   **Endpoint:** `/api/board/{boardId}` (DELETE)
*   **Request Format:** None. The `boardId` is part of the URL.
*   **Response Format:**
    ```json
    {
      "message": "Board board-1 deleted successfully"
    }
    ```

## 3. Epic Endpoints

### 3.1 Create Epic

*   **Endpoint:** `/api/epic` (POST)
*   **Request Format:**
    ```json
    {
      "summary": "Epic Summary",
      "description": "Epic Description"
    }
    ```
*   **Response Format:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "key": "ATM-964",
      "summary": "Epic Summary"
    }
    ```

### 3.2 Get Epic

*   **Endpoint:** `/api/epic/{epicKey}` (GET)
*   **Request Format:** None. The `epicKey` is part of the URL.
*   **Response Format:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "key": "ATM-964",
      "summary": "Epic Summary",
       "description": "Epic Description"
    }
    ```

### 3.3 Update Epic

*   **Endpoint:** `/api/epic/{epicKey}` (PUT)
*   **Request Format:**
    ```json
    {
      "summary": "Updated Epic Summary",
      "description": "Updated Epic Description"
    }
    ```
*   **Response Format:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "key": "ATM-964",
      "summary": "Updated Epic Summary"
    }
    ```

### 3.4 Delete Epic

*   **Endpoint:** `/api/epic/{epicKey}` (DELETE)
*   **Request Format:** None. The `epicKey` is part of the URL.
*   **Response Format:**
    ```json
    {
      "message": "Epic ATM-964 deleted successfully"
    }
    ```

## 4.  Database Schema

### 4.1 Issues Table

*   **Columns:**
    *   `id` (UUID, primary key)
    *   `issueKey` (VARCHAR)
    *   `summary` (VARCHAR)
    *   `description` (TEXT)
    *   `issueType` (VARCHAR)
    *   `status` (VARCHAR)
    *   `priority` (VARCHAR)
    *   `epicKey` (VARCHAR, foreign key referencing Epics table)
    *   `boardId` (UUID, foreign key referencing Boards table)
    *   `assignee` (VARCHAR, nullable)

### 4.2 Boards Table

*   **Columns:**
    *   `id` (UUID, primary key)
    *   `name` (VARCHAR)
    *   `description` (TEXT, nullable)

### 4.3 Epics Table

*   **Columns:**
    *   `id` (UUID, primary key)
    *   `epicKey` (VARCHAR)
    *   `name` (VARCHAR)
    *   `description` (TEXT, nullable)
    *   `status` (VARCHAR, nullable)
    *   `startDate` (DATE, nullable)
    *   `endDate` (DATE, nullable)

## 5. Setup and Deployment Instructions

1.  **Prerequisites:**
    *   Node.js and npm installed
    *   Docker and Docker Compose (for database setup)

2.  **Installation:**
    *   Clone the repository: `git clone <repository_url>`
    *   Navigate to the project directory: `cd agent-task-manager`
    *   Install dependencies: `npm install`

3.  **Database Setup (using Docker Compose):**
    *   Create a `docker-compose.yml` file in the project root with the following content.  This example uses SQLite, which is suitable for local development and testing.

    ```yaml
    version: "3.8"
    services:
      db:
        image: sqlite:latest
        container_name: agent-task-manager-db
        volumes:
          - ./db.sqlite:/app/db.sqlite # Mounts a volume to persist the database
        ports:
          - "3306:3306" # Expose port, this is not needed for sqlite, but other db may need it
        restart: always
    ```
    *   Start the database container: `docker-compose up -d`
    *   Configure the database connection in the `src/data/db.ts` file to point to the SQLite database file.

    *   **Example with PostgreSQL for Production:**

    Create a `docker-compose.yml` file in the project root with the following content:

    ```yaml
    version: "3.8"
    services:
      db:
        image: postgres:latest
        container_name: agent-task-manager-db
        ports:
          - "5432:5432"
        environment:
          POSTGRES_USER: your_user  # Replace with your desired username
          POSTGRES_PASSWORD: your_password  # Replace with your desired password
          POSTGRES_DB: agent_task_manager
        volumes:
          - postgres_data:/var/lib/postgresql/data
        restart: always
    volumes:
      postgres_data:
    ```

    *   Configure the database connection in the `src/data/db.ts` file to point to the PostgreSQL database. You will need to replace `your_user` and `your_password` with the values you set in `docker-compose.yml`.

4.  **Running the Application:**
    *   Start the development server: `npm run dev`
    *   The application will be available at `http://localhost:3000` (or the port specified in your environment variables).

5.  **Deployment:**
    *   Ensure your database is correctly configured in the deployment environment.  This may involve setting environment variables for the database connection string, user, and password.
    *   Build the project: `npm run build`
    *   Start the application using a process manager like PM2.  Example PM2 config (ecosystem.config.js):

    ```javascript
    module.exports = {
      apps: [{
        name: 'agent-task-manager',
        script: 'dist/index.js',
        instances: 'max',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'production'
        },
      }]
    };
    ```
    *   To run using PM2:
        *   `npm install pm2 -g`
        *   `pm2 start ecosystem.config.js`
        *   `pm2 status`

## 6. User Guide

This section provides a comprehensive user guide, covering the following topics:

### 6.1 Creating and Managing Issues

*   **Creating an Issue:**
    *   Navigate to the "Issues" section of the application.
    *   Click the "Create Issue" button.
    *   Fill in the following fields:
        *   **Summary:** A brief description of the issue.
        *   **Description:** A more detailed explanation of the issue.
        *   **Issue Type:** Select the type of issue (e.g., Task, Bug, Story).
        *   **Priority:** Select the priority of the issue (e.g., High, Medium, Low).
        *   **Epic Key:** (Optional) Associate the issue with an Epic.
    *   Click "Save".
*   **Viewing Issues:**
    *   Issues are displayed in a list format.
    *   Click on an issue to view its details.
*   **Updating an Issue:**
    *   Click on the issue you want to update.
    *   Modify the fields (Summary, Description, Status, Priority, Issue Type).
    *   Click "Save".
*   **Deleting an Issue:**
    *   Click on the issue you want to delete.
    *   Click "Delete". Confirm the deletion when prompted.

### 6.2 Creating and Managing Boards

*   **Creating a Board:**
    *   Navigate to the "Boards" section.
    *   Click the "Create Board" button.
    *   Enter a **Board Name** and optionally a **Description**.
    *   Click "Save".
*   **Viewing Boards:**
    *   Boards are displayed in a list format.
    *   Click on a board to view its details and associated issues.
*   **Updating a Board:**
    *   Click on the board you want to update.
    *   Modify the **Board Name** and/or **Description**.
    *   Click "Save".
*   **Deleting a Board:**
    *   Click on the board you want to delete.
    *   Click "Delete". Confirm the deletion when prompted. Deleting a board *does not* delete the issues associated with it.

### 6.3 Creating and Managing Epics

*   **Creating an Epic:**
    *   Navigate to the "Epics" section.
    *   Click the "Create Epic" button.
    *   Fill in the following fields:
        *   **Summary:** A brief description of the epic.
        *   **Description:** A more detailed explanation of the epic.
    *   Click "Save".
*   **Viewing Epics:**
    *   Epics are displayed in a list format.
    *   Click on an epic to view its details.
*   **Updating an Epic:**
    *   Click on the epic you want to update.
    *   Modify the fields (Summary, Description).
    *   Click "Save".
*   **Deleting an Epic:**
    *   Click on the epic you want to delete.
    *   Click "Delete". Confirm the deletion when prompted. Deleting an epic *does not* delete the issues associated with it.

### 6.4 Assigning Issues

*   Assigning users to issues is not yet implemented.

### 6.5 Filtering and Searching

*   **Filtering Issues:**
    *   The application allows you to filter issues based on:
        *   Status
        *   Issue Type
        *   Priority
        *   Epic
    *   Select the desired filters from the filter menu.
*   **Searching Issues:**
    *   Use the search bar to search for issues by summary or description.

## 7. API Documentation Refinements and Further Details

*   **Authentication:** The API currently does not implement authentication. For production, you should implement authentication mechanisms (e.g., API keys, JWT). Consider using a library like `passport` or implementing your own authentication middleware. Authentication should be applied to all endpoints.
*   **Error Handling:** The API provides basic error responses with HTTP status codes. Implement a global error handler to provide more detailed error messages and codes, including logging of errors. Return specific error codes and messages to the client to assist with debugging.
*   **Input Validation:** Ensure all endpoints properly validate their inputs using the validation schemas. Consider using a library like `express-validator` or `zod` for robust validation.  Validation should be applied to all endpoints.
*   **Rate Limiting:** Implement rate limiting to protect the API from abuse. Libraries such as `express-rate-limit` can be used. Implement rate limiting to all endpoints to protect against abuse.
