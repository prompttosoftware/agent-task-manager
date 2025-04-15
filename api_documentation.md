# API Documentation

This document outlines the request and response formats for each API endpoint, database schema, setup, and deployment instructions, and a user guide.

## 1. Issue Endpoints

### 1.1 Create Issue

*   **Endpoint:** "/api/issue" (POST)
*   **Request Format:**
    "{\"summary\":\"Issue Summary\",\"description\":\"Issue Description\",\"issueType\":\"Task\",\"priority\":\"High\",\"epicKey\":\"ATM-964\"}" (Note: Backslash escape is not needed for quotes in request format)
*   **Response Format:**
    "{\"id\":\"123e4567-e89b-12d3-a456-426614174000\",\"key\":\"ATM-123\",\"summary\":\"Issue Summary\",\"status\":\"Open\"}" (Note: Backslash escape is not needed for quotes in response format)

### 1.2 Get Issue

*   **Endpoint:** "/api/issue/{issueKey}" (GET)
*   **Request Format:** None. The `issueKey` is part of the URL.
*   **Response Format:**
    "{\"id\":\"123e4567-e89b-12d3-a456-426614174000\",\"key\":\"ATM-123\",\"summary\":\"Issue Summary\",\"description\":\"Issue Description\",\"issueType\":\"Task\",\"status\":\"Open\",\"priority\":\"High\",\"epicKey\":\"ATM-964\"}" (Note: Moved the complex object inside the response format)

### 1.3 Update Issue

*   **Endpoint:** "/api/issue/{issueKey}" (PUT)
*   **Request Format:**
    "{\"summary\":\"Updated Issue Summary\",\"description\":\"Updated Issue Description\",\"status\":\"In Progress\",\"priority\":\"High\",\"issueType\":\"Task\"}" (Note: Backslash escape is not needed for quotes in request format)
*   **Response Format:**
    "{\"id\":\"123e4567-e89b-12d3-a456-426614174000\",\"key\":\"ATM-123\",\"summary\":\"Updated Issue Summary\",\"status\":\"In Progress\"}" (Note: Backslash escape is not needed for quotes in response format)

### 1.4 Delete Issue

*   **Endpoint:** "/api/issue/{issueKey}" (DELETE)
*   **Request Format:** None. The `issueKey` is part of the URL.
*   **Response Format:**
    "{\"message\":\"Issue ATM-123 deleted successfully\"}" (Note: Backslash escape is not needed for quotes in response format)

## 2. Board Endpoints

### 2.1 Get Boards

*   **Endpoint:** "/api/board" (GET)
*   **Request Format:** None.
*   **Response Format:**
    [
      {\"id\":\"123e4567-e89b-12d3-a456-426614174000\",\"name\":\"Board 1\",\"issues\": [\"123e4567-e89b-12d3-a456-426614174000\",\"123e4567-e89b-12d3-a456-426614174001\"]}
    ]

### 2.2 Create Board

*   **Endpoint:** "/api/board" (POST)
*   **Request Format:**
    "{\"name\":\"New Board Name\",\"description\":\"Board Description\"}" (Note: Backslash escape is not needed for quotes in request format)
*   **Response Format:**
    "{\"id\":\"123e4567-e89b-12d3-a456-426614174000\",\"name\":\"New Board Name\"}" (Note: Backslash escape is not needed for quotes in response format)

### 2.3 Get Board

*   **Endpoint:** "/api/board/{boardId}" (GET)
*   **Request Format:** None. The `boardId` is part of the URL.
*   **Response Format:**
    "{\"id\":\"123e4567-e89b-12d3-a456-426614174000\",\"name\":\"Board 1\",\"issues\": [\"123e4567-e89b-12d3-a456-426614174000\",\"123e4567-e89b-12d3-a456-426614174001\"]}" (Note: Moved the complex object inside the response format)