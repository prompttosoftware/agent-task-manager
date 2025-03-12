# Agent Task Manager

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd agent-task-manager
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

1.  Build the project:
    ```bash
    npm run build
    ```
2.  Start the server:
    ```bash
    npm start
    ```

## API Documentation

### Issue Endpoints

*   `GET /issues`:  Retrieves a list of issues.
*   `GET /issues/:id`: Retrieves a specific issue by ID.
*   `POST /issues`: Creates a new issue.
*   `PUT /issues/:id`: Updates an existing issue.
*   `DELETE /issues/:id`: Deletes an issue.

### Webhook Endpoints

*   `POST /webhooks`: Receives webhook events.

More detailed documentation will be added later.
