## Agent Task Manager

This application manages tasks for agents.

### Deployment

The application is designed to be deployed using `pm2`.  The following steps outline the deployment process:

1.  **Build the application:** Ensure the application is built before deployment. (e.g., `npm run build`)
2.  **Copy the files:** Copy the built application files to the target server.
3.  **Install dependencies:** Ensure Node.js and npm are installed on the server and install dependencies (e.g., `npm install --production`).
4.  **Configure environment variables:** Set the `PORT`, `DATABASE_PATH`, `AGENT_LOG_LEVEL`, and `AGENT_TASK_POLLING_INTERVAL` environment variables.  For example:
    *   `PORT`: The port the application will listen on (defaults to 3000).
    *   `DATABASE_PATH`: The path to the SQLite database file (defaults to `./data/task_manager.db`).
    *   `AGENT_LOG_LEVEL`: Sets the log level for the agent.  Defaults to `info`.
    *   `AGENT_TASK_POLLING_INTERVAL`: Sets the interval (in milliseconds) at which the agent polls for tasks. Defaults to `60000` (1 minute).
5.  **Start the application:** Use the `pm2` startup script (e.g., `./scripts/start.sh`).

### Configuration

The application uses the following environment variables:

*   `PORT`:  Specifies the port the Express server listens on. Defaults to 3000 if not set.
*   `DATABASE_PATH`: Specifies the path to the SQLite database file.  Defaults to `./data/task_manager.db` if not set.
*   `AGENT_LOG_LEVEL`: Specifies the log level for the agent.  Defaults to `info`.
*   `AGENT_TASK_POLLING_INTERVAL`: Specifies the task polling interval in milliseconds. Defaults to 60000 (1 minute).

### PM2 Setup

To manage the Agent Task Manager with PM2, follow these steps:

1.  **Install PM2:**
    ```bash
    npm install -g pm2
    ```

2.  **Configure PM2:**
    Create a `pm2.config.js` file in the root directory of your project.  An example configuration file is:
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
          NODE_ENV: 'production',
          PORT: 3000,
          DATABASE_PATH: './data/task_manager.db',
          AGENT_LOG_LEVEL: 'info',
          AGENT_TASK_POLLING_INTERVAL: 60000,
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
├── scripts/
│   └── start.sh
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   │   ├── issue.controller.test.ts
│   │   │   ├── issue.controller.ts
│   │   │   ├── webhook.controller.test.ts
│   │   │   └── webhook.controller.ts
│   │   ├── middleware/
│   │   │   └── webhookValidation.ts
│   │   ├── routes/
│   │   │   ├── issue.routes.ts
│   │   │   └── webhook.routes.ts
│   │   ├── services/
│   │   │   ├── issue.service.ts
│   │   │   ├── webhook.service.test.ts
│   │   │   └── webhook.service.ts
│   │   └── types/
│   │       └── webhook.d.ts
│   ├── db/
│   │   ├── database.ts
│   │   └── db.js
│   ├── services/
│   │   ├── issue.service.ts
│   │   └── webhook.service.ts
│   ├── types/
│   │   ├── issue.d.ts
│   │   └── webhook.d.ts
│   └── index.ts
├── LICENSE
├── package-lock.json
├── package.json
├── pm2.config.js
└── README.md