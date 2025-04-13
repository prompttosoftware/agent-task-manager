# API Documentation

This document outlines the request and response formats for each API endpoint.

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
      "id": "12345",
      "key": "ATM-123",
      "summary": "Issue Summary",
      "status": "Open"
    }
    ```

### 1.2 Get Issue

*   **Endpoint:** `/api/issue/{issueKey}` (GET)
*   **Request Format:**
    None. The `issueKey` is part of the URL.
*   **Response Format:**
    ```json
    {
      "id": "12345",
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
      "status": "In Progress"
    }
    ```
*   **Response Format:**
    ```json
    {
      "id": "12345",
      "key": "ATM-123",
      "summary": "Updated Issue Summary",
      "status": "In Progress"
    }
    ```

### 1.4 Delete Issue

*   **Endpoint:** `/api/issue/{issueKey}` (DELETE)
*   **Request Format:**
    None. The `issueKey` is part of the URL.
*   **Response Format:**
    ```json
    {
      "message": "Issue ATM-123 deleted successfully"
    }
    ```

## 2. Board Endpoints

### 2.1 Get Boards

*   **Endpoint:** `/api/board` (GET)
*   **Request Format:**
    None.
*   **Response Format:**
    ```json
    [
      {
        "id": "board-1",
        "name": "Board 1",
        "issues": ["ATM-123", "ATM-456"]
      }
    ]
    ```

### 2.2 Create Board

*   **Endpoint:** `/api/board` (POST)
*   **Request Format:**
    ```json
    {
      "name": "New Board Name"
    }
    ```
*   **Response Format:**
    ```json
    {
      "id": "board-2",
      "name": "New Board Name"
    }
    ```

### 2.3 Get Board

*   **Endpoint:** `/api/board/{boardId}` (GET)
*   **Request Format:**
    None. The `boardId` is part of the URL.
*   **Response Format:**
    ```json
    {
      "id": "board-1",
      "name": "Board 1",
      "issues": ["ATM-123", "ATM-456"]
    }
    ```

### 2.4 Update Board

*   **Endpoint:** `/api/board/{boardId}` (PUT)
*   **Request Format:**
    ```json
    {
      "name": "Updated Board Name"
    }
    ```
*   **Response Format:**
    ```json
    {
      "id": "board-1",
      "name": "Updated Board Name"
    }
    ```

### 2.5 Delete Board

*   **Endpoint:** `/api/board/{boardId}` (DELETE)
*   **Request Format:**
    None. The `boardId` is part of the URL.
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
      "id": "epic-1",
      "key": "ATM-964",
      "summary": "Epic Summary"
    }
    ```

### 3.2 Get Epic

*   **Endpoint:** `/api/epic/{epicKey}` (GET)
*   **Request Format:**
    None. The `epicKey` is part of the URL.
*   **Response Format:**
    ```json
    {
      "id": "epic-1",
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
      "id": "epic-1",
      "key": "ATM-964",
      "summary": "Updated Epic Summary"
    }
    ```

### 3.4 Delete Epic

*   **Endpoint:** `/api/epic/{epicKey}` (DELETE)
*   **Request Format:**
    None. The `epicKey` is part of the URL.
*   **Response Format:**
    ```json
    {
      "message": "Epic ATM-964 deleted successfully"
    }
    ```
