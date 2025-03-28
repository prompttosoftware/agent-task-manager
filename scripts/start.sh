#!/bin/bash

# Stop any existing instance
pm2 stop agent-task-manager || true

# Remove any old logs
rm -f /usr/src/agent-task-manager/logs/*.log

# Create the logs directory if it doesn't exist
mkdir -p /usr/src/agent-task-manager/logs

# Start the application using pm2
pm2 start pm2.config.js

# Display pm2 status
pm2 status