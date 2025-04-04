# PM2 Setup for Agent Task Manager

This document outlines how to install and configure `pm2` to manage the Agent Task Manager.

## Installation

Install `pm2` globally using npm:

```bash
npm install -g pm2
```

## Configuration

1.  **Navigate to your project directory:**  `cd /usr/src/agent-task-manager`
2.  **Create a PM2 configuration file (if you don't already have one):**  e.g., `pm2.config.js`. An example is provided below.
3.  **Start the Agent Task Manager using PM2:** `pm2 start pm2.config.js`
4.  **Save the PM2 process list:** `pm2 save` This ensures the processes restart on server reboot.

### Example `pm2.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'agent-task-manager',
      script: 'dist/index.js', // Or your compiled entry point
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

**Explanation:**

*   `name`: The name of your application as displayed in `pm2 status`.
*   `script`: The entry point of your application (e.g., the compiled JavaScript file).
*   `instances`:  `max` will utilize all available CPUs. Consider setting a specific number of instances if needed.
*   `autorestart`:  Automatically restarts the application if it crashes.
*   `watch`:  `false` disables file watching to prevent restarts on code changes (recommended for production).  If you want to watch for file changes during development you can set this to `true` and modify the `ignore_watch` option.
*   `max_memory_restart`: Restarts the application if it exceeds the specified memory limit.
*   `env`:  Environment variables for your application.

## Common PM2 Commands

*   `pm2 start pm2.config.js`: Starts the application.
*   `pm2 restart agent-task-manager`: Restarts the application.
*   `pm2 stop agent-task-manager`: Stops the application.
*   `pm2 status`:  Shows the status of all PM2 managed processes.
*   `pm2 logs agent-task-manager`: Displays logs for the application.
*   `pm2 monit`:  Monitors the application in real-time.
*   `pm2 save`: Saves the current process list to be automatically restarted on server boot.
*   `pm2 startup`: Generates a startup script to automatically start PM2 on server boot.

## Troubleshooting

*   **Logs:** Check the application logs using `pm2 logs agent-task-manager` for any errors.
*   **Permissions:** Ensure that the user running the Agent Task Manager has the necessary permissions to access the application files and directories.
*   **Environment Variables:** Verify that the environment variables are correctly configured.
