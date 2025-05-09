# Local Jira-like Task Manager

## 1. Overview

This project implements a simple, lightweight, local Jira-like task manager. It provides a backend API for creating and managing issues within a Kanban board-style workflow.  It supports various issue types, statuses, and relationships, with data stored locally using lowdb (JSON file). The API is designed to mimic the functionality and response structure of the Jira API, facilitating potential integration or comparison. This is a backend-only project; no frontend UI is included.

## 2. Project Scope

*   **Backend API Only:**  No frontend UI development is included in this project.
*   **Technology Stack:**  Node.js with TypeScript.
*   **Data Persistence:**  Uses lowdb for local, JSON file-based storage.
*   **Issue Types:**  Supports Epic, Story, Task, Bug, and Subtask.
*   **Statuses:** Supports Todo, In Progress, and Done.
*   **API Endpoints:**
    *   Create Issue
    *   Get Issue
    *   Update Issue (fields)
    *   Transition Issue Status
    *   Get Multiple Issues (basic search/listing for Kanban)
*   **Issue Relationships:**  Handles subtasks to parent issues and issues related to Epics.

## 3. Technology Stack

*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Framework:** Express.js (for API routing and handling)
*   **Database:** lowdb (for local JSON file-based storage)
*   **ID Generation:** `uuid` library (e.g., `uuidv4`)
*   **Development Tools:**
    *   `npm` or `yarn` for package management
    *   `tsc` (TypeScript Compiler)
    *   `ESLint` for linting
    *   `Prettier` for code formatting
    *   `ts-node-dev` or `nodemon` for development server auto-restarts

## 4. Project Structure (Illustrative)
