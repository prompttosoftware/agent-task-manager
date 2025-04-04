## Agent Task Manager

This application manages tasks for agents.

### Deployment

The application is designed to be deployed using `pm2`. The following steps outline the deployment process:

1.  **Build the application:** Ensure the application is built before deployment (e.g., `npm run build`).  This step is essential to transpile TypeScript code to JavaScript.
2.  **Copy the files:** Copy the built application files (including `dist` directory) to the target server.
3.  **Install dependencies:** Ensure Node.js and npm are installed on the server and install production dependencies (e.g., `npm install --production`).  Ensure that you are in the correct directory, where the `package.json` resides.
4.  **Configure environment variables:** Set the `PORT`, `DATABASE_PATH`, `AGENT_LOG_LEVEL`, and `AGENT_TASK_POLLING_INTERVAL` environment variables.  For example:
    *   `PORT`: The port the application will listen on (defaults to 3000 if not set).
    *   `DATABASE_PATH`: The path to the SQLite database file (defaults to `./data/task_manager.db`).
    *   `AGENT_LOG_LEVEL`: Sets the log level for the agent. Defaults to `info`.
    *   `AGENT_TASK_POLLING_INTERVAL`: Sets the interval (in milliseconds) at which the agent polls for tasks. Defaults to `60000` (1 minute).
5.  **Start the application:** Use the `pm2` startup script (e.g., `./scripts/start.sh`) or directly start the application using `pm2 start pm2.config.js`.

### Configuration

The application uses the following environment variables:

*   `PORT`: Specifies the port the Express server listens on. Defaults to 3000 if not set.
*   `DATABASE_PATH`: Specifies the path to the SQLite database file. Defaults to `./data/task_manager.db` if not set.
*   `AGENT_LOG_LEVEL`: Specifies the log level for the agent. Defaults to `info`.
*   `AGENT_TASK_POLLING_INTERVAL`: Specifies the task polling interval in milliseconds. Defaults to 60000 (1 minute).

### API Endpoints

The following API endpoints are available:

*   **Issues:**
    *   `POST /issues`: Creates a new issue.
    *   `GET /issues`: Retrieves a list of all issues.
    *   `GET /issues/:id`: Retrieves a specific issue by ID.
    *   `PUT /issues/:id`: Updates an existing issue.
    *   `DELETE /issues/:id`: Deletes an issue.
*   **Webhooks:**
    *   `POST /webhooks`: Creates a new webhook.
    *   `GET /webhooks`: Retrieves a list of all webhooks.
    *   `GET /webhooks/:id`: Retrieves a specific webhook by ID.
    *   `PUT /webhooks/:id`: Updates an existing webhook.
    *   `DELETE /webhooks/:id`: Deletes a webhook.

### PM2 Setup

To manage the Agent Task Manager with PM2, follow these steps:

1.  **Install PM2:**
    ```bash
    npm install -g pm2
    ```

2.  **Configure PM2:**
    Create a `pm2.config.js` file in the root directory of your project. An example configuration file is:
    ```javascript
    // pm2.config.js
    module.exports = {
      apps: [{
        name: 'agent-task-manager',
        script: 'dist/index.js', // Or your compiled entry point
        instances: 'max',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'production',
          PORT: process.env.PORT || 3000,
          DATABASE_PATH: process.env.DATABASE_PATH || './data/task_manager.db',
          AGENT_LOG_LEVEL: process.env.AGENT_LOG_LEVEL || 'info',
          AGENT_TASK_POLLING_INTERVAL: process.env.AGENT_TASK_POLLING_INTERVAL || 60000,
        },
      }]
    };
    ```

3.  **Start the application with PM2:**
    ```bash
    pm2 start pm2.config.js
    ```

4.  **Check the status:**
    ```bash
    pm2 status
    ```

5.  **Stop the application:**
    ```bash
    pm2 stop agent-task-manager
    ```

6.  **Restart the application:**
    ```bash
    pm2 restart agent-task-manager
    ```

7.  **Save the PM2 process list:**
    ```bash
    pm2 save
    ```
    This command saves the current list of PM2 processes so they are automatically restarted on server reboot.

8.  **PM2 Startup Script (Optional):**
    To ensure PM2 starts automatically on system boot, you can generate and configure a startup script:
    ```bash
    pm2 startup
    pm2 save
    ```

### Example

```bash
# Set environment variables (replace with your actual values)
export PORT=8080
export DATABASE_PATH=/path/to/your/database.db
export AGENT_LOG_LEVEL=debug
export AGENT_TASK_POLLING_INTERVAL=30000

# Run the startup script
./scripts/start.sh
```

### Project Structure

```
agent-task-manager/
├── data/
│   └── task_manager.db
├── docs/
│   └── pm2-setup.md
├── scripts/
│   └── start.sh
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   │   ├── board.controller.test.ts
│   │   │   ├── board.controller.ts
│   │   │   ├── epic.controller.test.ts
│   │   │   ├── epic.controller.ts
│   │   │   ├── issue.controller.test.ts
│   │   │   ├── issue.controller.ts
│   │   │   ├── issue.validation.ts
│   │   │   ├── webhook.controller.test.ts
│   │   │   └── webhook.controller.ts
│   │   ├── middleware/
│   │   │   └── webhookValidation.ts
│   │   ├── models/
│   │   │   └── webhook.ts
│   │   ├── routes/
│   │   │   ├── board.routes.ts
│   │   │   ├── issue.routes.ts
│   │   │   └── webhook.routes.ts
│   │   ├── services/
│   │   │   ├── epic.service.ts
│   │   │   ├── issue.service.ts
│   │   │   ├── webhook.service.test.ts
│   │   │   └── webhook.service.ts
│   │   └── types/
│   │       ├── issue.d.ts
│   │       └── webhook.d.ts
│   ├── db/
│   │   └── database.ts
│   ├── services/
│   │   ├── board.service.test.ts
│   │   ├── board.service.ts
│   │   ├── epic.service.ts
│   │   ├── issue.service.test.ts
│   │   ├── issue.service.ts
│   │   ├── webhookProcessing.ts
│   │   ├── webhookProcessing.test.ts
│   │   ├── webhookQueue.ts
│   │   ├── webhookWorker.ts
│   ├── types/
│   │   ├── board.d.ts
│   │   ├── issue.d.ts
│   │   └── webhook.d.ts
│   ├── utils/
│   │   └── signature.ts
│   ├── config.ts
│   └── index.ts
├── tests/
│   └── issue.service.test.ts
├── LICENSE
├── package-lock.json
├── package.json
├── pm2.config.js
└── README.md