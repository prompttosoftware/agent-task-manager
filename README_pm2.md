# pm2 Setup for Agent Task Manager

This document outlines the steps to install and configure `pm2` to manage the Agent Task Manager.

## Installation

1.  Install `pm2` globally using npm:

    ```bash
    npm install -g pm2
    ```

## Configuration

1.  Navigate to the root directory of the Agent Task Manager project.
2.  Create a `ecosystem.config.js` file. Example configuration:

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
        env_production: {
          NODE_ENV: 'production'
        }
      }]
    };
    ```
    *   `name`: The name of the application.
    *   `script`: The entry point of your application (e.g., `dist/index.js`). Make sure you build your project first.
    *   `instances`:  'max' to utilize all available CPUs, or specify a number.
    *   `autorestart`: Automatically restart the application if it crashes.
    *   `watch`:  Set to `false` to disable file watching.  Consider setting to `true` during development.
    *   `max_memory_restart`: Restart the application if it exceeds the specified memory limit.
    *   `env`: Environment variables to set for the application.

3.  Start the application using `pm2`:

    ```bash
    pm2 start ecosystem.config.js
    ```

    or

     ```bash
    pm2 start dist/index.js --name "agent-task-manager"
    ```

4.  To view logs:

    ```bash
    pm2 logs agent-task-manager
    ```

5.  To stop the application:

    ```bash
    pm2 stop agent-task-manager
    ```

6.  To restart the application:

    ```bash
    pm2 restart agent-task-manager
    ```

7.  To save the current process list so it restarts on server boot:

    ```bash
    pm2 save
    ```

## Additional Notes

*   Ensure your application is built before starting with `pm2`.
*   Consider using environment variables for configuration within your application.
*   Review the `pm2` documentation for more advanced features and configuration options.

